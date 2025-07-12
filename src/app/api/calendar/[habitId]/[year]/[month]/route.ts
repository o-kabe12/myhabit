import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  // 末尾から3つ前がhabitId, 2つ前がyear, 1つ前がmonth
  const habitId = pathParts[pathParts.length - 3];
  const year = pathParts[pathParts.length - 2];
  const month = pathParts[pathParts.length - 1];

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;

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
  }
}