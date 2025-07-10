// src/app/habit/[id]/page.tsx

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import HabitDetailClient from "../../components/HabitDetailClient";

const prisma = new PrismaClient();

// ヘルパー関数：日付のみのUTC Dateオブジェクトを取得
const getUtcDateOnly = (date: Date) => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

// データフェッチ関数
async function getHabitAndMemoData(habitId: string, userId: string) {
  const today = new Date();
  const todayUtc = getUtcDateOnly(today);

  try {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId, userId: userId },
    });

    if (!habit) {
      return null;
    }

    const checkIn = await prisma.checkIn.findUnique({
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

    const dailyMemo = await prisma.dailyMemo.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: todayUtc,
        },
      },
      select: {
        content: true,
      },
    });

    // ストリーク計算ロジック（APIと同じロジックをここに複製）
    let currentStreak = 0;
    // 今日のチェックインが完了していればストリーク開始
    if (checkIn && checkIn.isCompleted) {
        currentStreak = 1;
        let checkDate = getUtcDateOnly(new Date()); // 今日の日付から開始
        while (true) {
            checkDate.setDate(checkDate.getDate() - 1); // 前日に移動
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
                // 前日が未完了ならストリーク終了
                break;
            }
        }
    }


    return {
      habit,
      isCheckedIn: checkIn?.isCompleted || false,
      streak: currentStreak,
      initialMemoContent: dailyMemo?.content || "", // ★追加★ メモの内容を渡す (ない場合は空文字列)
      todayFormatted: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`, // ★追加★ 日付も渡す
    };
  } catch (error) {
    console.error("Failed to fetch habit data on server:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}


interface HabitDetailPageProps {
  params: {
    id: string; // 習慣のID
  };
}

export default async function HabitDetailPage({ params }: HabitDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    notFound();
  }

  const { id: habitId } = params;
  const userId = session.user.id;

  const data = await getHabitAndMemoData(habitId, userId);

  if (!data || !data.habit) {
    notFound();
  }

  return (
    <HabitDetailClient
      initialHabit={data.habit}
      initialIsCheckedIn={data.isCheckedIn}
      initialStreak={data.streak}
      habitId={habitId}
      initialMemoContent={data.initialMemoContent}
      todayFormatted={data.todayFormatted}
    />
  );
}