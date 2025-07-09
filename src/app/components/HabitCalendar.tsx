"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CheckIn } from "../types"; // CheckIn型をインポート

interface HabitCalendarProps {
  habitId: string;
}

// ヘルパー関数: 指定された月の全ての日付を生成
const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date)); // 新しいDateオブジェクトをプッシュ
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// ヘルパー関数: ISO形式の日付文字列を YYYY-MM-DD 形式に変換
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// カレンダーのセルの色を決定するヘルパー関数
const getCellColor = (checkInCount: number): string => {
  if (checkInCount > 0) {
    return "bg-green-500"; // チェックインあり
  }
  return "bg-gray-200"; // チェックインなし
};

export default function HabitCalendar({ habitId }: HabitCalendarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // チェックインデータを YYYY-MM-DD -> CheckInオブジェクト のマップとして保持
  const [checkedDatesMap, setCheckedDatesMap] = useState<Map<string, CheckIn>>(new Map());

  // 表示する期間（例: 過去1年間）
  const now = useMemo(() => new Date(), []);
  const startYear = useMemo(() => now.getFullYear() - 1, [now]);
  const endYear = useMemo(() => now.getFullYear(), [now]);

  // APIからチェックインデータを取得
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/checkin/calendar/${habitId}?startDate=${startYear}-01-01&endDate=${endYear}-12-31`);
      if (!response.ok) {
        throw new Error("カレンダーデータの取得に失敗しました。");
      }
      const data: CheckIn[] = await response.json();
      const newMap = new Map<string, CheckIn>();
      data.forEach(checkIn => {
        // Dateオブジェクトをそのまま使用
        newMap.set(formatDateToYYYYMMDD(new Date(checkIn.date)), checkIn);
      });
      setCheckedDatesMap(newMap);
    } catch (err: any) {
      console.error("Failed to fetch calendar data:", err);
      setError("カレンダーの読み込み中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, [habitId, startYear, endYear]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // カレンダーグリッドのデータを生成
  const calendarData = useMemo(() => {
    const data: { date: Date; isChecked: boolean }[] = [];
    const tempDate = new Date(startYear, 0, 1); // 1月1日から開始

    // 過去1年間の日付を全て生成し、チェックイン状態を紐付け
    while (tempDate.getFullYear() <= endYear) {
      const formattedDate = formatDateToYYYYMMDD(tempDate);
      data.push({
        date: new Date(tempDate), // 新しいDateオブジェクトをコピー
        isChecked: checkedDatesMap.has(formattedDate),
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return data;
  }, [checkedDatesMap, startYear, endYear]);


  // 月ごとの表示データを整理
  const monthsData = useMemo(() => {
    const months: { year: number; month: number; days: { date: Date; isChecked: boolean }[] }[] = [];
    let currentMonth: { year: number; month: number; days: { date: Date; isChecked: boolean }[] } | null = null;

    calendarData.forEach(day => {
      const dayYear = day.date.getFullYear();
      const dayMonth = day.date.getMonth(); // 0-indexed

      if (!currentMonth || currentMonth.year !== dayYear || currentMonth.month !== dayMonth) {
        if (currentMonth) {
          months.push(currentMonth);
        }
        currentMonth = { year: dayYear, month: dayMonth, days: [] };
      }
      currentMonth.days.push(day);
    });

    if (currentMonth) {
      months.push(currentMonth);
    }
    return months;
  }, [calendarData]);


  if (loading) {
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
        <p>{error}</p>
        <button onClick={fetchCalendarData} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-inner">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">習慣カレンダー</h3>
      <div className="flex flex-wrap gap-4 justify-center">
        {monthsData.map((monthData, monthIndex) => (
          <div key={`${monthData.year}-${monthData.month}`} className="flex flex-col items-center border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-700 mb-2">
              {monthData.year}年 {monthData.month + 1}月
            </h4>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* 曜日ヘッダー */}
              {['日', '月', '火', '水', '木', '金', '土'].map(dayName => (
                <div key={dayName} className="w-6 h-6 text-center font-bold text-gray-500">
                  {dayName}
                </div>
              ))}
              {/* 月の開始曜日までの空白セル */}
              {Array.from({ length: monthData.days[0].date.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="w-6 h-6"></div>
              ))}
              {/* 日付セル */}
              {monthData.days.map((day, dayIndex) => (
                <div
                  key={`${day.date.toDateString()}`} // Dateオブジェクトの文字列表現をキーに
                  className={`w-6 h-6 rounded-sm flex items-center justify-center text-white ${getCellColor(day.isChecked ? 1 : 0)}`}
                  title={`${formatDateToYYYYMMDD(day.date)} ${day.isChecked ? '完了' : '未完了'}`}
                >
                  {/* 日付の数字は表示しない、色だけで表現 */}
                </div>
              ))}
            </div>
          </div>
        ))}
        {monthsData.length === 0 && (
          <p className="text-gray-600 text-center col-span-full">まだチェックインがありません。</p>
        )}
      </div>
    </div>
  );
}