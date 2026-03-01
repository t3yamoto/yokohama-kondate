# yokohama-kondate

横浜市学校給食の[献立PDF](https://ygs.or.jp/iframe/pdf/E_new.pdf)をパースし、CSVおよびカレンダー形式のPDFを生成するツール。

## 機能

- 給食献立PDFからテキストを抽出
- 日付・曜日・献立名を構造化データとして抽出
- CSV形式で出力（Excel互換のBOM付きUTF-8）
- カレンダー形式のPDFを生成（A4縦向き、2列レイアウト）

## 必要要件

- Node.js 18以上
- npm

## インストール

```bash
npm install
```

## 使い方

### フルパイプライン実行

```bash
npm run start
```

PDFのダウンロード、パース、CSV生成、PDF生成をすべて実行します。

### 個別実行

```bash
# PDFパースのみ
npm run parse

# CSV生成のみ
npm run generate-csv

# PDF生成のみ
npm run generate-pdf
```

## 出力ファイル

出力ファイルは `output/` ディレクトリに生成されます。

| ファイル | 説明 |
|---------|------|
| `kondate_YYYYMM.csv` | 日別献立CSV（日付、曜日、献立内容） |
| `kondate_YYYYMM_detailed.csv` | 詳細CSV（献立項目ごとに1行） |
| `kondate_YYYYMM.pdf` | カレンダー形式PDF |
| `kondate_YYYYMM.html` | デバッグ用HTML |

## プロジェクト構成

```
yokohama-kondate/
├── src/
│   ├── index.ts                 # メインエントリ
│   ├── parser/
│   │   └── pdf-parser.ts        # PDF取得・テキスト抽出・献立データ構造化
│   ├── converter/
│   │   └── csv-generator.ts     # CSV変換
│   ├── generator/
│   │   ├── pdf-generator.ts     # PDF生成（Puppeteer）
│   │   └── calendar-template.ts # HTMLテンプレート
│   └── types/
│       └── index.ts             # 型定義
├── output/                      # 生成ファイル出力先
├── example/
│   └── 0216.pdf                 # 参照用サンプル
├── package.json
└── tsconfig.json
```

## 技術スタック

- **言語**: TypeScript
- **PDFパース**: pdf-parse
- **CSV生成**: csv-stringify
- **PDF生成**: Puppeteer

## ライセンス

MIT
