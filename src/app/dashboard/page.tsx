// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { PlusCircleIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Habit } from "../types";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // ログインしていない場合はログインページへリダイレクト
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  let habits: Habit[] = [];
  try {
    // 現在ログインしているユーザーの習慣を取得
    habits = await prisma.habit.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'asc', // 作成順でソート
      },
    });
  } catch (error) {
    console.error("習慣の取得に失敗しました:", error);
    // エラーハンドリングをUIに表示する場合は、ここでは単純化
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600">習慣の読み込み中にエラーが発生しました。</p>
      </div>
    );
  } finally {
    await prisma.$disconnect(); // データベース接続を閉じる
  }

  // 曜日の表示順を定義
  const dayOrder = ["月", "火", "水", "木", "金", "土", "日"];

  return (
    <div className="bg-gray-100 pt-6 sm:pt-16">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-semibold text-gray-900">
                {session.user.name ? (
                  <>
                    {session.user.name}さんの
                    <br />
                    ダッシュボード
                  </>
                ) : (
                  "ダッシュボード"
                )}
              </h1>
              <Link href="/habit/new" className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-2">
                <PlusCircleIcon className="h-6 w-6" />
                <span className="font-medium">新しい習慣</span>
              </Link>
            </div>

            {habits.length === 0 ? (
              <div className="text-center text-gray-600 p-8 border rounded-lg bg-gray-50">
                <p className="text-lg mb-4">まだ習慣が登録されていません。</p>
                <Link href="/habit/new" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                  最初の習慣を登録する
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {habits.map((habit) => (
                  <Link href={`/habit/${habit.id}`} key={habit.id} className="block cursor-pointer hover:opacity-80 transition-opacity duration-200">
                    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between transition-transform transform hover:scale-[1.01]">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: habit.color }}>
                          {habit.name[0]} {/* 習慣名の最初の文字を表示 */}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{habit.name}</h2>
                          <p className="text-sm text-gray-500">{habit.category}</p>
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-gray-600">
                            {dayOrder.map(day => (
                              <span
                                key={day}
                                className={`px-2 py-1 rounded-full ${
                                  habit.daysOfWeek.includes(day)
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-indigo-600">
                        <ChevronRightIcon className="h-6 w-6" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}