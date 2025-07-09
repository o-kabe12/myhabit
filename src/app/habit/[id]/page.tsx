// src/app/habit/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import DeleteHabitButton from "../../components/DeleteHabitButton";
import CheckInButton from "../../components/CheckInButton"; // ★ここを追加★
import { Habit } from "../../types";

const prisma = new PrismaClient();

interface HabitDetailPageProps {
  params: {
    id: string;
  };
}

export default async function HabitDetailPage({ params }: HabitDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const id = params.id; // params.id のアクセス方法を修正済

  let habit: Habit | null = null;
  try {
    habit = await prisma.habit.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error("習慣の取得に失敗しました:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600">習慣の読み込み中にエラーが発生しました。</p>
      </div>
    );
  } finally {
    await prisma.$disconnect();
  }

  if (!habit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-xl font-semibold text-gray-800 mb-4">習慣が見つかりませんでした。</p>
          <Link href="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  const dayOrder = ["月", "火", "水", "木", "金", "土", "日"];

  // 今日の日付を 'YYYY-MM-DD' 形式で取得
  // サーバー側で生成し、クライアントに渡す
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const todayDateString = `${year}-${month}-${day}`;


  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-2">
                <ArrowLeftIcon className="h-6 w-6" />
                <span className="font-medium">ダッシュボード</span>
              </Link>
              <div className="flex space-x-4">
                <Link href={`/habit/edit/${habit.id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-2">
                  <PencilIcon className="h-6 w-6" />
                  <span className="font-medium">編集</span>
                </Link>
                <DeleteHabitButton habitId={habit.id} />
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl" style={{ backgroundColor: habit.color }}>
                    {habit.name[0]}
                </div>
                <span>{habit.name}</span>
            </h1>

            <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">カテゴリー</p>
                    <p className="text-lg text-gray-800">{habit.category}</p>
                </div>
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">実行する曜日</p>
                    <div className="flex flex-wrap gap-2">
                        {dayOrder.map(day => (
                            <span
                                key={day}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    habit.daysOfWeek.includes(day)
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                                {day}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">作成日</p>
                    <p className="text-lg text-gray-800">{new Date(habit.createdAt).toLocaleDateString('ja-JP')}</p>
                </div>
            </div>

            <div className="mt-8 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">今日の進捗</h2>
                <CheckInButton habitId={habit.id} date={todayDateString} />
            </div>

            <div className="mt-8 p-6 bg-white border border-dashed border-gray-300 rounded-lg text-center text-gray-600">
                <p className="text-lg font-semibold mb-2">💡 ここに習慣の過去の進捗履歴やカレンダー機能が来ます</p>
                <p className="text-sm">（例：日々の達成状況をカレンダーで表示、統計データなど）</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}