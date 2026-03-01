import * as path from 'path';
import { fetchAndParsePdf } from './parser/pdf-parser';
import { extractMealsFromText } from './parser/meal-extractor';
import { generateCsv, generateDetailedCsv } from './converter/csv-generator';
import { generatePdf, generateHtmlFile } from './generator/pdf-generator';

const PDF_URL = 'https://ygs.or.jp/iframe/pdf/E_new.pdf';
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const parseOnly = args.includes('--parse-only');
  const csvOnly = args.includes('--csv-only');
  const pdfOnly = args.includes('--pdf-only');

  try {
    console.log('=== 横浜献立PDF処理システム ===\n');

    // Step 1: PDFをパース
    console.log('[Step 1] PDFを取得・パース中...');
    const pdfData = await fetchAndParsePdf(PDF_URL);

    console.log(`\n抽出したテキスト（最初の500文字）:\n${pdfData.text.substring(0, 500)}...\n`);

    if (parseOnly) {
      console.log('\n=== パース完了（--parse-only モード）===');
      console.log(`全テキスト:\n${pdfData.text}`);
      return;
    }

    // Step 2: テキストから献立を抽出
    console.log('[Step 2] 献立データを抽出中...');
    const mealPlan = extractMealsFromText(pdfData.text);

    console.log(`抽出した献立: ${mealPlan.year}年${mealPlan.month}月`);
    console.log(`日数: ${mealPlan.meals.length}日分`);

    if (mealPlan.meals.length > 0) {
      console.log('\nサンプル（最初の3日分）:');
      for (const daily of mealPlan.meals.slice(0, 3)) {
        console.log(
          `  ${daily.date.getMonth() + 1}/${daily.date.getDate()}(${daily.dayOfWeek}): ${daily.meals.map((m) => m.name).join(', ')}`
        );
      }
    }

    // Step 3: CSV生成
    if (!pdfOnly) {
      console.log('\n[Step 3] CSV生成中...');
      const csvPath = path.join(
        OUTPUT_DIR,
        `kondate_${mealPlan.year}${String(mealPlan.month).padStart(2, '0')}.csv`
      );
      generateCsv(mealPlan, csvPath);

      // 詳細CSVも生成
      const detailedCsvPath = path.join(
        OUTPUT_DIR,
        `kondate_${mealPlan.year}${String(mealPlan.month).padStart(2, '0')}_detailed.csv`
      );
      generateDetailedCsv(mealPlan, detailedCsvPath);
    }

    if (csvOnly) {
      console.log('\n=== CSV生成完了（--csv-only モード）===');
      return;
    }

    // Step 4: PDF生成
    console.log('\n[Step 4] カレンダーPDF生成中...');
    const pdfPath = path.join(
      OUTPUT_DIR,
      `kondate_${mealPlan.year}${String(mealPlan.month).padStart(2, '0')}.pdf`
    );
    await generatePdf(mealPlan, pdfPath);

    // HTMLも出力（デバッグ用）
    const htmlPath = path.join(
      OUTPUT_DIR,
      `kondate_${mealPlan.year}${String(mealPlan.month).padStart(2, '0')}.html`
    );
    generateHtmlFile(mealPlan, htmlPath);

    console.log('\n=== 処理完了 ===');
    console.log(`出力ディレクトリ: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
