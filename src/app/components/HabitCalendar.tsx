"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowPathIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import useSWR from "swr";
import { CheckIn } from "../types";

interface HabitCalendarProps {
  habitId: string;
}

// データフェッチ関数 (SWR用)
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  // APIが直接配列を返すことを前提とする
  return res.json();
};

// ISO形式の日付文字列をYYYY-MM-DD 形式に変換
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCellColor = (isChecked: boolean): string => {
  if (isChecked) {
    return 'bg-green-500 text-white'; // チェックイン済み
  }
  return 'bg-gray-200 text-gray-700'; // 未チェックイン
};

export default function HabitCalendar({ habitId }: HabitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const startDate = formatDateToYYYYMMDD(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const endDate = formatDateToYYYYMMDD(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

  const apiUrl = `/api/checkin/calendar/${habitId}?startDate=${startDate}&endDate=${endDate}`;
  const { data: checkIns, error, isLoading, mutate } = useSWR<CheckIn[]>(apiUrl, fetcher);

  const checkedDatesSet = useMemo(() => {
    // dataが undefined, null, または配列でない場合に備える
    if (!checkIns || !Array.isArray(checkIns)) {
        return new Set<string>();
    }
    return new Set(checkIns.map(checkIn => formatDateToYYYYMMDD(new Date(checkIn.date))));
  }, [checkIns]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 text-gray-600">
        <ArrowPathIcon className="animate-spin h-8 w-8 mr-3" />
        <p>カレンダーを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-red-600">
        <ExclamationTriangleIcon className="h-10 w-10 mb-2" />
        <p>カレンダーの読み込み中にエラーが発生しました。</p>
        <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
          再試行
        </button>
      </div>
    );
  }

  const todayYYYYMMDD = formatDateToYYYYMMDD(new Date());

  return (
    <div className="p-4 bg-white rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h3 className="text-xl font-semibold text-gray-800">
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </h3>
        <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronRightIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {/* 曜日ヘッダー */}
        {['日', '月', '火', '水', '木', '金', '土'].map(dayName => (
          <div key={dayName} className="w-8 h-8 text-center font-bold text-gray-500 flex items-center justify-center">
            {dayName}
          </div>
        ))}
        {/* 月の開始曜日までの空白セル */}
        {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8"></div>
        ))}
        {/* 日付セル */}
        {daysInMonth.map((day, index) => {
          const formattedDate = formatDateToYYYYMMDD(day);
          const isChecked = checkedDatesSet.has(formattedDate);
          const isToday = formattedDate === todayYYYYMMDD;
          const isFuture = day.getTime() > new Date().setHours(23,59,59,999);

          return (
            <div
              key={formattedDate}
              className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium relative
                ${getCellColor(isChecked)}
                ${isToday ? 'border-2 border-blue-500' : ''}
                ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
              `}
              title={`${formattedDate} ${isChecked ? '完了' : '未完了'}`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
      {daysInMonth.length === 0 && (
        <p className="text-gray-600 text-center mt-4">この月には日付がありません。</p>
      )}
    </div>
  );
}