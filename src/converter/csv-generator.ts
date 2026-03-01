import { stringify } from 'csv-stringify/sync';
import * as fs from 'fs';
import * as path from 'path';
import { MonthlyMealPlan } from '../types';

/**
 * 月間献立データをCSVに変換して出力
 */
export function generateCsv(mealPlan: MonthlyMealPlan, outputPath: string): void {
  const records: string[][] = [];

  // ヘッダー
  records.push(['日付', '曜日', '献立内容']);

  // 献立データを行に変換
  for (const daily of mealPlan.meals) {
    const dateStr = formatDate(daily.date);
    const mealStr = daily.meals.map((m) => m.name).join('、');

    records.push([dateStr, daily.dayOfWeek, mealStr]);
  }

  // CSVに変換
  const csvContent = stringify(records, {
    bom: true, // Excel対応のためBOM付きUTF-8
  });

  // ディレクトリが存在しない場合は作成
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // ファイル出力
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`CSV出力完了: ${outputPath}`);
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * 詳細CSV（カテゴリ付き）を生成
 */
export function generateDetailedCsv(
  mealPlan: MonthlyMealPlan,
  outputPath: string
): void {
  const records: string[][] = [];

  // ヘッダー
  records.push(['日付', '曜日', '献立名', 'カテゴリ']);

  // 献立データを行に変換（1献立1行）
  for (const daily of mealPlan.meals) {
    const dateStr = formatDate(daily.date);

    for (const meal of daily.meals) {
      records.push([dateStr, daily.dayOfWeek, meal.name, meal.category || '']);
    }
  }

  // CSVに変換
  const csvContent = stringify(records, {
    bom: true,
  });

  // ディレクトリが存在しない場合は作成
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // ファイル出力
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`詳細CSV出力完了: ${outputPath}`);
}
