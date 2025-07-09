import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import HabitCalendar from "../../../components/HabitCalendar"; // HabitCalendarコンポーネントをインポート
import { Habit } from "../../../types";

const prisma = new PrismaClient();

interface HabitCalendarPageProps {
  params: {
    id: string; // habitId
  };
}

export default async function HabitCalendarPage({ params }: HabitCalendarPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const habitId = params.id;

  let habit: { id: string; name: string; color: string | null; } | null = null;
  try {
    // 習慣名を表示するために習慣情報を取得
    habit = await prisma.habit.findUnique({
      where: {
        id: habitId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        color: true,
      }
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href={`/habit/${habit.id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-2">
                <ArrowLeftIcon className="h-6 w-6" />
                <span className="font-medium">習慣詳細に戻る</span>
              </Link>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: habit.color }}>
                    {habit.name[0]}
                </div>
                <span>{habit.name} のカレンダー</span>
            </h1>

            {/* HabitCalendar コンポーネントを配置 */}
            <div className="mt-8">
                <HabitCalendar habitId={habit.id} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}