export interface Habit {
  id: string;
  name: string;
  category: string;
  color: string;
  daysOfWeek: string[];
  userId: string;
  createdAt: Date;
}