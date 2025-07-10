import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import HabitDetailClient from "../../components/HabitDetailClient"; // 新しく作成したクライアントコンポーネントをインポート

const prisma = new PrismaClient();

// データフェッチ関数
async function getHabitData(habitId: string, userId: string) { // habitId は既にstringとして渡される
  const today = new Date();
  const todayFormatted = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const getUtcDateOnly = (date: Date) => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  };

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
          date: getUtcDateOnly(today),
        },
      },
      select: {
        isCompleted: true,
      },
    });

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

  const data = await getHabitData(habitId, userId);

  if (!data || !data.habit) {
    notFound(); // 習慣が見つからない場合は404ページを表示
  }

  return (
    <HabitDetailClient
      initialHabit={data.habit}
      initialIsCheckedIn={data.isCheckedIn}
      initialStreak={data.streak}
      habitId={habitId}
    />
  );
}