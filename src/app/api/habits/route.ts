import { PrismaClient, DayOfWeek } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

// POSTリクエストハンドラー (新しい習慣の作成)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { name, category, color, daysOfWeek } = await request.json();

  // 入力値のバリデーション
  if (!name || !category || !color || !daysOfWeek || !Array.isArray(daysOfWeek)) {
    return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 });
  }

  // ★修正点★ 日本語の曜日をPrismaのEnumに変換するヘルパー関数
  const mapJapaneseDayToEnum = (japaneseDay: string): DayOfWeek | undefined => {
    switch (japaneseDay) {
      case '日': return DayOfWeek.SUNDAY;
      case '月': return DayOfWeek.MONDAY;
      case '火': return DayOfWeek.TUESDAY;
      case '水': return DayOfWeek.WEDNESDAY;
      case '木': return DayOfWeek.THURSDAY;
      case '金': return DayOfWeek.FRIDAY;
      case '土': return DayOfWeek.SATURDAY;
      default: return undefined; // 無効な値
    }
  };

  // ★修正点★ daysOfWeek を変換
  const transformedDaysOfWeek = daysOfWeek
    .map(mapJapaneseDayToEnum)
    .filter((day): day is DayOfWeek => day !== undefined); // undefined を除外

  // 変換後にdaysOfWeekが空になった場合のエラーハンドリング
  if (daysOfWeek.length > 0 && transformedDaysOfWeek.length === 0) {
    return NextResponse.json({ error: "無効な曜日の指定が含まれています。" }, { status: 400 });
  }

  try {
    // データベースに習慣を保存
    const newHabit = await prisma.habit.create({
      data: {
        name,
        category,
        color,
        daysOfWeek: transformedDaysOfWeek, // 変換後の配列を渡す
        userId: session.user.id,
      },
    });
    return NextResponse.json(newHabit, { status: 201 });
  } catch (error) {
    console.error("習慣登録エラー:", error);
    return NextResponse.json({ error: "習慣の登録に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}