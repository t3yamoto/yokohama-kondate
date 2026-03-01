import axios from 'axios';
import pdfParse from 'pdf-parse';
import { ParsedPdfData } from '../types';

const PDF_URL = 'https://ygs.or.jp/iframe/pdf/E_new.pdf';

/**
 * URLからPDFを取得してテキストを抽出
 */
export async function fetchAndParsePdf(url: string = PDF_URL): Promise<ParsedPdfData> {
  console.log(`PDFを取得中: ${url}`);

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  const buffer = Buffer.from(response.data);
  console.log(`PDF取得完了: ${buffer.length} bytes`);

  const data = await pdfParse(buffer);

  console.log(`PDFパース完了: ${data.numpages}ページ`);

  return {
    text: data.text,
    numPages: data.numpages,
    info: data.info as Record<string, unknown>,
  };
}

/**
 * ローカルファイルからPDFをパース
 */
export async function parsePdfFromFile(filePath: string): Promise<ParsedPdfData> {
  const fs = await import('fs');
  const buffer = fs.readFileSync(filePath);

  const data = await pdfParse(buffer);

  return {
    text: data.text,
    numPages: data.numpages,
    info: data.info as Record<string, unknown>,
  };
}
