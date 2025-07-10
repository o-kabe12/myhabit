import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } } // params の型を明示的に指定
) {
  const { id: habitId } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // const habitId = params.id; // この行は不要になる
  const userId = session.user.id;

  try {
    // 習慣が存在し、かつユーザーのものであることを確認
    const habit = await prisma.habit.findUnique({
      where: {
        id: habitId,
        userId: userId,
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    let currentStreak = 0;
    let currentDate = new Date();

    const getUtcDateOnly = (date: Date) => {
      return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    };

    let checkDate = getUtcDateOnly(currentDate);

    const todayCheckIn = await prisma.checkIn.findUnique({
        where: {
            userId_habitId_date: {
                userId: userId,
                habitId: habitId,
                date: checkDate,
            },
        },
        select: {
            isCompleted: true,
        }
    });

    if (!todayCheckIn || !todayCheckIn.isCompleted) {
        return NextResponse.json({ streak: 0 }, { status: 200 });
    }

    currentStreak = 1;

    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const previousDayCheckIn = await prisma.checkIn.findUnique({
        where: {
          userId_habitId_date: {
            userId: userId,
            habitId: habitId,
            date: checkDate,
          },
        },
        select: {
          isCompleted: true,
        },
      });

      if (previousDayCheckIn && previousDayCheckIn.isCompleted) {
        currentStreak++;
      } else {
        break;
      }
    }

    return NextResponse.json({ streak: currentStreak }, { status: 200 });

  } catch (error) {
    console.error("ストリーク計算エラー:", error);
    return NextResponse.json({ error: "ストリークの計算に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}