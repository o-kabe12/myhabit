"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, ExclamationTriangleIcon, CalendarDaysIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';
import { Habit } from '../types';
import HabitCalendar from '../components/HabitCalendar';
import DailyMemoPanel from '../components/DailyMemoPanel';

// データフェッチ関数 (SWR用)
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  return res.json();
};

interface HabitCalendarClientProps {
  initialHabit: Habit;
  habitId: string;
}

export default function HabitCalendarClient({ initialHabit, habitId }: HabitCalendarClientProps) {
  const router = useRouter();

  const getTodayFormatted = () => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayFormatted());

  const { data: habit, error: habitError, isLoading: habitLoading, mutate: mutateHabit } = useSWR<Habit>(
    `/api/habit/${habitId}`,
    fetcher,
    { fallbackData: initialHabit }
  );

  // 日付クリックハンドラー
  const handleDateClick = useCallback((date: Date) => {
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    setSelectedDate(formattedDate);
  }, []);

  if (habitLoading && !habit) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <ArrowPathIcon className="animate-spin h-10 w-10 mr-3" />
        <p>習慣データを読み込み中...</p>
      </div>
    );
  }

  if (habitError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <ExclamationTriangleIcon className="h-12 w-12 mb-4" />
        <p>習慣データの読み込み中にエラーが発生しました。</p>
        <button onClick={() => mutateHabit()}
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
    <div className="md:h-full flex items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="p-6 sm:p-8 relative bg-white shadow-lg sm:rounded-3xl rounded-xl">
          <button
            onClick={() => router.push(`/habit/${habitId}`)}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-6 font-medium cursor-pointer"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" /> 習慣詳細に戻る
          </button>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 break-words">
            {habit.name} の達成状況
          </h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <CalendarDaysIcon className="h-7 w-7 mr-2 text-blue-500" />
            カレンダー
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 mb-4">
            <HabitCalendar
              habitId={habit.id}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
            <DailyMemoPanel selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}