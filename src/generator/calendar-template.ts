import { MonthlyMealPlan, DailyMeal } from '../types';

/**
 * リスト形式のHTMLテンプレートを生成（example/0216.pdf形式）
 */
export function generateCalendarHtml(mealPlan: MonthlyMealPlan): string {
  const { year, month, meals } = mealPlan;

  // 2列レイアウト用にペアを作成
  const pairs: Array<[DailyMeal | null, DailyMeal | null]> = [];
  for (let i = 0; i < meals.length; i += 2) {
    pairs.push([meals[i] || null, meals[i + 1] || null]);
  }

  const rows = pairs.map((pair) => generateRow(pair[0], pair[1])).join('\n');

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${year}年${month}月 献立表</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    body {
      font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Meiryo', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      background: white;
      color: #333;
    }

    .container {
      width: 100%;
      max-width: 180mm;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #333;
    }

    .header h1 {
      font-size: 16px;
      font-weight: bold;
    }

    .menu-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #333;
    }

    .menu-row {
      display: flex;
      border-bottom: 1px solid #333;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .menu-row:last-child {
      border-bottom: none;
    }

    .menu-cell {
      flex: 1;
      padding: 6px 8px;
      min-height: 100px;
      border-right: 1px solid #333;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .menu-cell:last-child {
      border-right: none;
    }

    .menu-cell.empty {
      background-color: #fafafa;
    }

    .date-header {
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 4px;
      padding: 2px 0;
      border-bottom: 1px solid #333;
      text-align: center;
    }

    .date-header .day {
      font-size: 12px;
    }

    .date-header .weekday {
      margin-left: 4px;
    }

    .date-header .weekday.sunday {
      color: #d32f2f;
    }

    .date-header .weekday.saturday {
      color: #1976d2;
    }

    .menu-list {
      list-style: none;
    }

    .menu-item {
      padding: 3px 0;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #ccc;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .menu-item-text {
      width: 45%;
      text-align: left;
      padding-left: 4px;
    }

    .menu-item::after {
      content: "→";
      width: 10%;
      text-align: center;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${year}年${month}月 給食献立表</h1>
    </div>

    <div class="menu-table">
      ${rows}
    </div>
  </div>
</body>
</html>
`;
}

/**
 * 1行（2日分）のHTMLを生成
 */
function generateRow(
  left: DailyMeal | null,
  right: DailyMeal | null
): string {
  return `
    <div class="menu-row">
      ${generateCell(left)}
      ${generateCell(right)}
    </div>
  `;
}

/**
 * 1セル（1日分）のHTMLを生成
 */
function generateCell(meal: DailyMeal | null): string {
  if (!meal) {
    return '<div class="menu-cell empty"></div>';
  }

  const month = String(meal.date.getMonth() + 1).padStart(2, '0');
  const day = String(meal.date.getDate()).padStart(2, '0');
  const weekdayClass = getWeekdayClass(meal.dayOfWeek);

  const menuItems = meal.meals
    .map(
      (m) =>
        `<li class="menu-item"><span class="menu-item-text">${escapeHtml(m.name)}</span></li>`
    )
    .join('\n');

  return `
    <div class="menu-cell">
      <div class="date-header">
        <span class="day">${month}/${day}</span>
        <span class="weekday ${weekdayClass}">(${meal.dayOfWeek})</span>
      </div>
      <ul class="menu-list">
        ${menuItems}
      </ul>
    </div>
  `;
}

/**
 * 曜日に応じたクラス名を返す
 */
function getWeekdayClass(dayOfWeek: string): string {
  if (dayOfWeek === '日') return 'sunday';
  if (dayOfWeek === '土') return 'saturday';
  return '';
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
