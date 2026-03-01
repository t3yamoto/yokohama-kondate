import { DailyMeal, MealItem, MonthlyMealPlan } from '../types';

/**
 * 抽出したテキストから献立データを構造化
 */
export function extractMealsFromText(text: string): MonthlyMealPlan {
  const lines = text.split('\n').filter((line) => line.trim());

  // 年月を抽出
  const { year, month } = extractYearMonth(text);

  // 日付と献立を抽出（新形式優先）
  let meals = extractDailyMealsNewFormat(text, year, month);

  // 新形式で抽出できなかった場合は旧形式を試行
  if (meals.length === 0) {
    meals = extractDailyMeals(lines, year, month);
  }

  return {
    year,
    month,
    meals,
  };
}

/**
 * 新形式: 日付と献立が別行にある形式を抽出
 * 例:
 * 2
 * ごはん  牛乳  さばのみそ煮  磯香あえ  けんちん汁
 *
 * または複数行にまたがる場合:
 * 5
 * ごはん  牛乳  菜の花ごはんの具（さけそぼろ）  菜の花ご
 * はんの具（卵そぼろ）  すまし汁
 */
function extractDailyMealsNewFormat(
  text: string,
  year: number,
  month: number
): DailyMeal[] {
  const meals: DailyMeal[] = [];
  const processedDays = new Set<number>();
  const lines = text.split('\n');

  // 日付行のインデックスを先に特定
  const dateLineIndices: Array<{ index: number; day: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // 単独の数字行（1-31）を検出
    if (/^(\d{1,2})$/.test(line)) {
      const day = parseInt(line, 10);
      if (day >= 1 && day <= 31) {
        // 次の行がメニュー形式かチェック（献立は2スペース区切りで複数項目がある）
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (isMenuLine(nextLine)) {
          dateLineIndices.push({ index: i, day });
        }
      }
    }
  }

  // 各日付について献立を抽出
  for (let i = 0; i < dateLineIndices.length; i++) {
    const { index, day } = dateLineIndices[i];

    // 同じ日が既に処理されていたらスキップ
    if (processedDays.has(day)) continue;

    // 次の日付行または終端までの範囲を決定
    const nextIndex =
      i + 1 < dateLineIndices.length
        ? dateLineIndices[i + 1].index
        : lines.length;

    // 日付の次の行から献立を収集（1行のみ、または2行まで継続）
    const menuLines: string[] = [];
    for (let j = index + 1; j < Math.min(index + 3, lines.length); j++) {
      const line = lines[j].trim();

      // 停止条件: 空行、単独の数字（次の日付）、特定のキーワード
      if (
        !line ||
        /^\d{1,2}$/.test(line) ||
        /^食品名/.test(line) ||
        /^アレルゲン/.test(line) ||
        /^\d+\s*\/\s*\d+\s*ページ/.test(line) ||
        /^【[A-Z]】/.test(line) ||
        /^※/.test(line) ||
        /^●/.test(line) ||
        /^小麦|^乳|^卵|^大豆|^えび/.test(line) // アレルゲン注記
      ) {
        break;
      }

      // 最初の行がメニュー行でなければスキップ
      if (menuLines.length === 0 && !isMenuLine(line)) {
        break;
      }

      menuLines.push(line);
    }

    if (menuLines.length === 0) continue;

    // 複数行を結合して解析（改行を削除して2スペース区切りを維持）
    const combinedMenu = menuLines.join('');

    // メニュー行を解析（2スペース以上で区切り）
    const menuItems = combinedMenu
      .split(/\s{2,}/)
      .map((item) => item.trim())
      .map((item) => cleanMenuItemText(item)) // 末尾の数字などを除去
      .filter((item) => item && !isExcludedText(item));

    if (menuItems.length > 0) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = getDayOfWeekJp(date.getDay());

      meals.push({
        date,
        dayOfWeek,
        meals: menuItems.map((name) => ({
          name,
          category: inferCategory(name),
        })),
      });

      processedDays.add(day);
    }
  }

  // 日付順にソート
  meals.sort((a, b) => a.date.getTime() - b.date.getTime());

  return meals;
}

/**
 * 曜日番号を日本語に変換
 */
function getDayOfWeekJp(dayNum: number): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayNum];
}

/**
 * 除外すべきテキストかチェック
 */
function isExcludedText(text: string): boolean {
  const excludePatterns = [
    /^食品名$/,
    /^アレルゲン$/,
    /^注意喚起$/,
    /^ページ$/,
    /^\d+\s*\/\s*\d+\s*ページ$/,
    /^【[A-Z]】$/,
  ];
  return excludePatterns.some((p) => p.test(text));
}

/**
 * メニュー項目テキストをクリーンアップ
 * 末尾の数字やその他の不要な文字を除去
 */
function cleanMenuItemText(text: string): string {
  // 末尾の連続する数字を除去（例: "じゃがいものソテー2324252627" -> "じゃがいものソテー"）
  let cleaned = text.replace(/\d+$/, '');

  // 先頭・末尾の空白を除去
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * メニュー行かどうかを判定
 * 献立は通常「ごはん  牛乳  主菜  副菜」のような2スペース区切りで複数項目がある
 */
function isMenuLine(text: string): boolean {
  if (!text) return false;

  // 2スペース以上で区切られた項目が3つ以上あること
  const items = text.split(/\s{2,}/).filter((item) => item.trim());
  if (items.length < 3) return false;

  // 食品らしい単語を含むかチェック（ご飯、牛乳、パン、汁、煮、焼き、あえ、など）
  const foodPatterns = [
    /ごはん|ご飯|はいがごはん|麦ごはん|赤飯/,
    /牛乳/,
    /パン/,
    /汁|スープ/,
    /煮|焼き|揚げ|フライ|あえ|炒め|サラダ/,
    /カレー|シチュー|ソテー/,
    /みそ|味噌/,
  ];

  const matchCount = foodPatterns.filter((pattern) =>
    pattern.test(text)
  ).length;

  // 2つ以上の食品パターンに一致すればメニュー行と判定
  return matchCount >= 2;
}

/**
 * テキストから年月を抽出
 */
function extractYearMonth(text: string): { year: number; month: number } {
  // パターン: "令和X年X月" or "2024年3月" or "R6年3月"
  const patterns = [
    /令和(\d+)年(\d{1,2})月/,
    /(\d{4})年(\d{1,2})月/,
    /R(\d+)年(\d{1,2})月/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);

      // 令和の場合は西暦に変換
      if (pattern.source.includes('令和') || pattern.source.includes('R')) {
        year = year + 2018;
      }

      return { year, month };
    }
  }

  // デフォルトは現在の日付
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * 日付パターンを検出して献立を抽出
 */
function extractDailyMeals(
  lines: string[],
  year: number,
  month: number
): DailyMeal[] {
  const meals: DailyMeal[] = [];
  const dayOfWeekMap: Record<string, string> = {
    月: '月',
    火: '火',
    水: '水',
    木: '木',
    金: '金',
    土: '土',
    日: '日',
  };

  // 日付パターン: "1日(月)", "1日（月）", "1 (月)", "1（月）" など
  const datePattern = /(\d{1,2})(?:日)?[（(]([月火水木金土日])[)）]/;

  let currentDay: number | null = null;
  let currentDayOfWeek: string | null = null;
  let currentMeals: MealItem[] = [];

  for (const line of lines) {
    const dateMatch = line.match(datePattern);

    if (dateMatch) {
      // 前の日のデータを保存
      if (currentDay !== null && currentMeals.length > 0) {
        meals.push({
          date: new Date(year, month - 1, currentDay),
          dayOfWeek: currentDayOfWeek || '',
          meals: [...currentMeals],
        });
      }

      currentDay = parseInt(dateMatch[1], 10);
      currentDayOfWeek = dayOfWeekMap[dateMatch[2]] || dateMatch[2];
      currentMeals = [];

      // 同じ行に献立がある場合は抽出
      const afterDate = line
        .substring(line.indexOf(dateMatch[0]) + dateMatch[0].length)
        .trim();
      if (afterDate) {
        const items = extractMealItems(afterDate);
        currentMeals.push(...items);
      }
    } else if (currentDay !== null) {
      // 献立の継続行
      const items = extractMealItems(line);
      if (items.length > 0) {
        currentMeals.push(...items);
      }
    }
  }

  // 最後の日のデータを保存
  if (currentDay !== null && currentMeals.length > 0) {
    meals.push({
      date: new Date(year, month - 1, currentDay),
      dayOfWeek: currentDayOfWeek || '',
      meals: [...currentMeals],
    });
  }

  // 日付順にソート
  meals.sort((a, b) => a.date.getTime() - b.date.getTime());

  return meals;
}

/**
 * テキスト行から献立アイテムを抽出
 */
function extractMealItems(text: string): MealItem[] {
  const items: MealItem[] = [];

  // 除外するパターン（ヘッダーなど）
  const excludePatterns = [
    /^献立表$/,
    /^給食献立$/,
    /^月$/,
    /^年$/,
    /^令和/,
    /^kcal$/i,
    /^エネルギー$/,
    /^たんぱく質$/,
    /^脂質$/,
    /^塩分$/,
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(text.trim())) {
      return [];
    }
  }

  // 献立の区切り文字で分割
  const separators = /[、,・\s]+/;
  const parts = text.split(separators).filter((p) => p.trim());

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && trimmed.length > 0 && !isHeaderText(trimmed)) {
      // カテゴリを推測
      const category = inferCategory(trimmed);
      items.push({
        name: trimmed,
        category,
      });
    }
  }

  return items;
}

/**
 * ヘッダーテキストかどうかを判定
 */
function isHeaderText(text: string): boolean {
  const headerPatterns = [
    /^\d+$/,
    /^[月火水木金土日]$/,
    /^曜$/,
    /^日$/,
  ];

  return headerPatterns.some((p) => p.test(text));
}

/**
 * 献立名からカテゴリを推測
 */
function inferCategory(mealName: string): string | undefined {
  const categoryPatterns: Array<{ pattern: RegExp; category: string }> = [
    { pattern: /ご(は|飯)|ライス|パン|麺|うどん|そば|スパゲ/, category: '主食' },
    { pattern: /汁|スープ|みそ汁|味噌汁|吸い物/, category: '汁物' },
    { pattern: /牛乳|ミルク/, category: '飲み物' },
    { pattern: /サラダ|和え|おひたし|漬け/, category: '副菜' },
    {
      pattern: /焼き|煮|揚げ|炒め|フライ|ソテー|グラタン|カレー|シチュー/,
      category: '主菜',
    },
    { pattern: /デザート|ゼリー|プリン|ケーキ|フルーツ|果物/, category: 'デザート' },
  ];

  for (const { pattern, category } of categoryPatterns) {
    if (pattern.test(mealName)) {
      return category;
    }
  }

  return undefined;
}
