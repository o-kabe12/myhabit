import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const habitId = pathParts[pathParts.length - 2];

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 今日の日付を取得
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    // 今日のチェックイン状態を確認
    const todayCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_habitId_date: {
          userId: userId,
          habitId: habitId,
          date: todayUtc,
        },
      },
      select: {
        isCompleted: true,
      },
    });

    let currentStreak = 0;
    
    // 今日チェックイン済みの場合、連続記録を計算
    if (todayCheckIn && todayCheckIn.isCompleted) {
      currentStreak = 1;
      let checkDate = new Date(todayUtc);
      
      // 過去の日付を順次チェック
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
    }

    return NextResponse.json({ streak: currentStreak }, { status: 200 });
  } catch (error) {
    console.error("streak取得エラー:", error);
    return NextResponse.json({ error: "streakの取得に失敗しました。" }, { status: 500 });
  }
}