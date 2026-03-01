# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

横浜市学校給食の献立PDFを処理するTypeScriptプロジェクト。PDFからデータを抽出し、CSVとカレンダー形式のPDFを生成する。

## よく使うコマンド

```bash
# フルパイプライン実行（PDF取得→パース→CSV生成→PDF生成）
npm run start

# 開発時のビルド
npm run build
```

## アーキテクチャ

### データフロー

```
PDF (https://ygs.or.jp/iframe/pdf/E_new.pdf)
    ↓ axios
テキスト抽出 (pdf-parse)
    ↓
献立データ構造化 (正規表現パース)
    ↓
MonthlyMealPlan型
    ↓
├── CSV出力 (csv-stringify)
└── PDF出力 (Puppeteer + HTMLテンプレート)
```

### 主要な型

```typescript
interface MealItem { name: string; category?: string; }
interface DailyMeal { date: Date; dayOfWeek: string; meals: MealItem[]; }
interface MonthlyMealPlan { year: number; month: number; meals: DailyMeal[]; }
```

### ファイル構成

- `src/index.ts` - エントリポイント、CLIオプション処理
- `src/parser/pdf-parser.ts` - PDF取得、テキスト抽出、献立データ構造化
- `src/converter/csv-generator.ts` - CSV生成（BOM付きUTF-8）
- `src/generator/calendar-template.ts` - HTMLテンプレート生成
- `src/generator/pdf-generator.ts` - Puppeteerを使ったPDF生成

## 注意事項

### PDFパース

- ソースPDFはアレルゲン情報シートで、テーブル構造が複雑
- 日付は単独の数字（1-31）として出現し、その後にメニュー行が続く
- メニュー行は2つ以上のスペースで区切られた複数の項目を含む

### 出力PDF形式

- A4縦向き、2列レイアウト
- 各セルに日付ヘッダーと献立リスト
- 献立項目は `献立名 →` 形式で表示
- 罫線付きのテーブル形式
- 改ページ制御あり（献立が途中で分割されない）

### CSV出力

- BOM付きUTF-8でExcel互換
- 2種類のCSV: 日別まとめと詳細版
