import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { habitId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const habitId = params.habitId;
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  // デフォルトで過去1年間のデータを取得
  let startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  startDate.setHours(0, 0, 0, 0);

  let endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  if (startDateParam) {
    // URLパラメータがあればそれを優先
    const parsedStartDate = new Date(startDateParam + 'T00:00:00Z'); // UTCとしてパース
    if (!isNaN(parsedStartDate.getTime())) {
      startDate = parsedStartDate;
    }
  }
  if (endDateParam) {
    // URLパラメータがあればそれを優先
    const parsedEndDate = new Date(endDateParam + 'T23:59:59Z'); // UTCとしてパース
    if (!isNaN(parsedEndDate.getTime())) {
      endDate = parsedEndDate;
    }
  }

  try {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        habitId: habitId,
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        isCompleted: true, // 完了したチェックインのみ取得
      },
      select: {
        date: true, // 日付のみで十分
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(checkIns, { status: 200 });

  } catch (error) {
    console.error("カレンダーデータの取得エラー:", error);
    return NextResponse.json({ error: "カレンダーデータの取得に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}