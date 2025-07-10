import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import HabitDetailClient from "../../components/HabitDetailClient";

// PrismaClient のインスタンスはファイルスコープで一度だけ作成します
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
    if (checkIn && checkIn.isCompleted) {
        currentStreak = 1;
        let checkDate = getUtcDateOnly(new Date());
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

    return {
      habit,
      isCheckedIn: checkIn?.isCompleted || false,
      streak: currentStreak,
      initialMemoContent: dailyMemo?.content || "",
      todayFormatted: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`,
    };
  } catch (error) {
    console.error("Failed to fetch habit data on server:", error);
    return null;
  }
}


interface HabitDetailPageProps {
  params: {
    id: string;
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