"use client";

import { useState, useEffect} from 'react';
import useSWR from 'swr';
import { ArrowPathIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// fetcher 関数 (共通のものを再利用)
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  return res.json();
};

interface CalendarData {
  [date: string]: {
    isCompleted: boolean;
  };
}

interface HabitCalendarProps {
  habitId: string;
  onDateClick: (date: Date) => void; // ★追加★ 日付クリック時のコールバック
  selectedDate: string; // ★追加★ 選択中の日付 (YYYY-MM-DD形式)
}

// ヘルパー関数: 日付セルの色を決定
const getCellColor = (isChecked: boolean): string => {
  if (isChecked) {
    return 'bg-green-500 text-white'; // チェックイン済み
  }
  return 'bg-gray-200 text-gray-700'; // 未チェックイン
};

export default function HabitCalendar({ habitId, onDateClick, selectedDate }: HabitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // その月のチェックインデータをフェッチ
  // 依存配列にcurrentMonth.getMonth()とcurrentMonth.getFullYear()を追加
  const { data: calendarData, error, isLoading, mutate } = useSWR<CalendarData>(
    `/api/calendar/${habitId}/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`,
    fetcher
  );

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0:日, 1:月, ..., 6:土

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month); // 週の開始日（0:日曜）

    const days = [];

    // 前月の空白日
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-prev-${i}`} className="p-2 text-center text-gray-400"></div>);
    }

    // 今月の日付
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i);
      // Prismaの@db.DateはUTCで日付のみを保存するので、比較もUTCで
      const utcDate = new Date(Date.UTC(year, month, i));
      const formattedDate = `${utcDate.getFullYear()}-${(utcDate.getMonth() + 1).toString().padStart(2, '0')}-${utcDate.getDate().toString().padStart(2, '0')}`;

      const isChecked = calendarData?.[formattedDate]?.isCompleted || false;
      const isSelected = formattedDate === selectedDate; // ★追加★ 選択中の日付を判定

      days.push(
        <div
          key={i}
          className={`p-2 text-center rounded-lg cursor-pointer transition-colors duration-150
            ${getCellColor(isChecked)}
            ${isSelected ? 'ring-4 ring-blue-400 ring-offset-1' : ''}  // ★追加★ 選択中のスタイル
            hover:ring-2 hover:ring-blue-300 hover:ring-offset-1
          `}
          onClick={() => onDateClick(date)} // ★修正★ クリック時にコールバックを呼び出す
        >
          {i}
        </div>
      );
    }
    return days;
  };

  const handleMonthChange = (offset: number) => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() + offset);
      return newMonth;
    });
  };

  // 月が変わったらSWRのデータを再検証
  useEffect(() => {
    mutate();
  }, [currentMonth, mutate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-600">
        <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
        <p>データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-center">
        <ExclamationTriangleIcon className="h-6 w-6 mx-auto mb-2" />
        <p>カレンダーデータの読み込み中にエラーが発生しました。</p>
      </div>
    );
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h3 className="text-xl font-semibold text-gray-800">
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </h3>
        <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronRightIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm font-medium text-center text-gray-500 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
}