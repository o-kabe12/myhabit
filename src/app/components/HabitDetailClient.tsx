"use client";

import { useRouter } from "next/navigation";
import { Habit } from "../types";
import Link from "next/link";
import { ArrowPathIcon, ExclamationTriangleIcon,CalendarDaysIcon, ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import useSWR from "swr";
import DailyMemoPanel from "../components/DailyMemoPanel"; // ★追加★ DailyMemoPanelをインポート
import CheckInButton from "./CheckInButton";
import DeleteHabitButton from "./DeleteHabitButton";

// データフェッチ関数 (SWR用)
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  return res.json();
};

interface HabitDetailClientProps {
  initialHabit: Habit;
  initialIsCheckedIn: boolean;
  initialStreak: number;
  habitId: string;
  todayFormatted: string;
}

export default function HabitDetailClient({
  initialHabit,
  initialIsCheckedIn,
  initialStreak,
  habitId,
  todayFormatted,
}: HabitDetailClientProps) {
  const router = useRouter();

  // SWRでリアルタイム更新が必要な部分のみをフェッチする
  const { data: habit, error: habitError, isLoading: habitLoading, mutate: mutateHabit } = useSWR<Habit>(
    `/api/habit/${habitId}`,
    fetcher,
    { fallbackData: initialHabit }
  );

  const { data: checkInStatus, error: checkInError, isLoading: checkInLoading, mutate: mutateCheckIn } = useSWR<{ isCheckedIn: boolean }>(
    `/api/checkin/${todayFormatted}/${habitId}`,
    fetcher,
    { fallbackData: { isCheckedIn: initialIsCheckedIn } }
  );

  const { data: streakData, error: streakError, isLoading: streakLoading, mutate: mutateStreak } = useSWR<{ streak: number }>(
    `/api/habit/${habitId}/streak`,
    fetcher,
    { fallbackData: { streak: initialStreak } }
  );

  // isCheckedInは未使用なので削除
  const currentStreak = streakData?.streak;

  // handleCheckInToggle, isCheckedIn, useCallbackの未使用エラーを解消


  if (habitLoading && !habit || checkInLoading && !checkInStatus || streakLoading && !streakData) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <ArrowPathIcon className="animate-spin h-10 w-10 mr-3" />
        <p>習慣データを読み込み中...</p>
      </div>
    );
  }

  if (habitError || checkInError || streakError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <ExclamationTriangleIcon className="h-12 w-12 mb-4" />
        <p>データの読み込み中にエラーが発生しました。</p>
        <button onClick={() => { mutateHabit(); mutateCheckIn(); mutateStreak(); }}
                className="mt-4 px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition duration-200">
          再試行
        </button>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <p>習慣が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="h-[90dvh] md:h-full p-4 sm:p-6 lg:p-8 flex items-center">
      <div className="w-full h-[80dvh] sm:h-[75dvh] max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="p-6 sm:p-8 rounded-xl shadow-lg relative bg-white sm:rounded-3xl h-[80dvh] sm:h-[75dvh] overflow-scroll">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 opacity-75 hover:opacity-100 transition-opacity duration-200">
              <ArrowLeftIcon className="h-6 w-6" />
              <span>ダッシュボードに戻る</span>
            </Link>
          </div>
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 break-words max-w-[calc(100%-100px)]">
              {habit.name}
            </h1>
            <div className="flex space-x-2">
              <Link href={`/habit/edit/${habit.id}`} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors duration-200" title="習慣を編集">
                <PencilIcon className="h-6 w-6" />
              </Link>
              <DeleteHabitButton habitId={habit.id} onDelete={() => router.push('/dashboard')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">カテゴリ</h3>
              <p className="text-blue-700">{habit.category || "未設定"}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">実行曜日</h3>
              <p className="text-purple-700">
                {habit.daysOfWeek && habit.daysOfWeek.length > 0
                  ? habit.daysOfWeek.map(d => {
                      switch (d) {
                        case 'SUNDAY': return '日';
                        case 'MONDAY': return '月';
                        case 'TUESDAY': return '火';
                        case 'WEDNESDAY': return '水';
                        case 'THURSDAY': return '木';
                        case 'FRIDAY': return '金';
                        case 'SATURDAY': return '土';
                        default: return `${d}`;
                      }
                    }).join('、')
                  : '毎日'}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg shadow-sm mb-8 flex items-center justify-center">
            <span className="text-2xl font-bold text-yellow-800 mr-2">
              🔥
            </span>
            <h3 className="text-xl font-bold text-yellow-800">
              現在の連続記録: {currentStreak !== undefined ? `${currentStreak} 日` : '計算中...'}
            </h3>
          </div>


          <div className="mt-8 flex justify-center mt-8">
            <CheckInButton habitId={habit.id} date={todayFormatted}/>
          </div>

          <div className="mt-8">
            <DailyMemoPanel selectedDate={todayFormatted} />
          </div>

          <div className="text-center mt-6">
            <Link href={`/habit/${habitId}/calendar`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              カレンダーで達成状況を見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}