import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { habitId: string; year: string; month: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  const { habitId, year, month } = params;

  const targetYear = parseInt(year, 10);
  const targetMonth = parseInt(month, 10); // 1-indexed (例: 7月は7)

  if (isNaN(targetYear) || isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    return NextResponse.json({ error: "無効な年または月です。" }, { status: 400 });
  }

  // 月の最初と最後の日付をUTCで取得
  const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
  const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999)); // 月の最終日の終わり

  try {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: userId,
        habitId: habitId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        isCompleted: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const calendarData: { [key: string]: { isCompleted: boolean } } = {};
    checkIns.forEach(checkIn => {
      // UTC日付をYYYY-MM-DD形式にフォーマット
      const formattedDate = `${checkIn.date.getUTCFullYear()}-${(checkIn.date.getUTCMonth() + 1).toString().padStart(2, '0')}-${checkIn.date.getUTCDate().toString().padStart(2, '0')}`;
      calendarData[formattedDate] = { isCompleted: checkIn.isCompleted };
    });

    return NextResponse.json(calendarData, { status: 200 });

  } catch (error) {
    console.error("カレンダーデータ取得エラー:", error);
    return NextResponse.json({ error: "カレンダーデータの取得に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}