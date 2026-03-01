import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { MonthlyMealPlan } from '../types';
import { generateCalendarHtml } from './calendar-template';

/**
 * 月間献立データからカレンダーPDFを生成
 */
export async function generatePdf(
  mealPlan: MonthlyMealPlan,
  outputPath: string
): Promise<void> {
  console.log('PDF生成を開始...');

  // HTMLテンプレートを生成
  const html = generateCalendarHtml(mealPlan);

  // ディレクトリが存在しない場合は作成
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Puppeteerでブラウザを起動
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // HTMLをセット
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // PDFとして出力（A4縦向き）
    await page.pdf({
      path: outputPath,
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    });

    console.log(`PDF出力完了: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

/**
 * HTMLファイルとしても出力（デバッグ用）
 */
export function generateHtmlFile(
  mealPlan: MonthlyMealPlan,
  outputPath: string
): void {
  const html = generateCalendarHtml(mealPlan);

  // ディレクトリが存在しない場合は作成
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`HTML出力完了: ${outputPath}`);
}
