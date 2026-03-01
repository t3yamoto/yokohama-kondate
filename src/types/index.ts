/**
 * 献立アイテム
 */
export interface MealItem {
  name: string;
  category?: string;
}

/**
 * 1日の献立
 */
export interface DailyMeal {
  date: Date;
  dayOfWeek: string;
  meals: MealItem[];
}

/**
 * 月間献立表
 */
export interface MonthlyMealPlan {
  year: number;
  month: number;
  meals: DailyMeal[];
}

/**
 * PDFパース結果
 */
export interface ParsedPdfData {
  text: string;
  numPages: number;
  info: Record<string, unknown>;
}
