// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/authOptions";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { PlusCircleIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Habit } from "../types";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  let habits: Habit[] = [];
  let userXp = 0;
  let userLevel = 1;

  try {
    const userWithHabits = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        xp: true,
        level: true,
        habits: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (userWithHabits) {
      habits = userWithHabits.habits;
      userXp = userWithHabits.xp;
      userLevel = userWithHabits.level;
    }
  } catch (error) {
    console.error("ダッシュボードデータの取得に失敗しました:", error);
    // エラーハンドリングを強化しても良い
  } finally {
    await prisma.$disconnect();
  }

  // 次のレベルアップに必要なXPの閾値 (クライアント側で表示するため、ここで計算)
  const calculateXpThreshold = (currentLevel: number): number => {
    return 500 * currentLevel;
  };
  const xpForNextLevel = calculateXpThreshold(userLevel);
  const progressToNextLevel = xpForNextLevel > 0 ? (userXp / xpForNextLevel) * 100 : 0;
  const remainingXp = xpForNextLevel - userXp;


  return (
    <div className="h-full flex items-center">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">ダッシュボード</h1>
            <div className="bg-indigo-600 text-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-2">
                ようこそ、{session?.user?.name || "ゲスト"}さん！
              </h2>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm">レベル {userLevel}</span>
                <span className="text-sm">{userXp} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-3">
                <div
                  className="bg-indigo-400 h-3 rounded-full"
                  style={{ width: `${Math.min(100, progressToNextLevel)}%` }}
                ></div>
              </div>
              {userXp < xpForNextLevel && (
                 <p className="text-xs text-indigo-100 mt-2">次のレベルまであと {remainingXp} XP！</p>
              )}
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">あなたの習慣</h2>
              <Link href="/habit/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                新しい習慣
              </Link>
            </div>
          </div>

          <div className="overflow-scroll max-h-[40vh]">
            <div className="max-w-md mx-auto">
              {habits.length === 0 ? (
                <p className="text-gray-600">まだ習慣がありません。新しい習慣を追加しましょう！</p>
              ) : (
                <ul className="space-y-4">
                  {habits.map((habit) => (
                    <li key={habit.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex justify-between items-center">
                      <Link href={`/habit/${habit.id}`} className="flex-grow flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: habit.color || '#6366F1' }}>
                            {habit.name[0]}
                        </div>
                        <span className="text-lg font-medium text-gray-800">{habit.name}</span>
                      </Link>
                      <Link href={`/habit/${habit.id}`} className="text-indigo-600 hover:text-indigo-800">
                        <ChevronRightIcon className="h-6 w-6" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}