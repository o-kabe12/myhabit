export interface Habit {
  id: string;
  name: string;
  category: string;
  color: string | null;
  daysOfWeek: string[];
  userId: string;
  createdAt: Date;
}

export interface CheckIn {
  id: string;
  date: string; // Date型で扱う
  isCompleted: boolean; // 新しく追加されたフィールド
  habitId: string;
  userId: string;
  createdAt: Date;
}

export interface DailyMemo {
  id: string;
  date: Date;
  content: string;
  userId: string;
}