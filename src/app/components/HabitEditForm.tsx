"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Habit } from "../types";
import { DayOfWeek } from "@prisma/client";

interface HabitEditFormProps {
  habit: Habit;
}

export default function HabitEditForm({ habit }: HabitEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(habit.name);
  const [category, setCategory] = useState(habit.category);
  const [color, setColor] = useState(habit.color ?? "");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(habit.daysOfWeek);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dayMap: { [key: string]: DayOfWeek } = {
    "日": DayOfWeek.SUNDAY,
    "月": DayOfWeek.MONDAY,
    "火": DayOfWeek.TUESDAY,
    "水": DayOfWeek.WEDNESDAY,
    "木": DayOfWeek.THURSDAY,
    "金": DayOfWeek.FRIDAY,
    "土": DayOfWeek.SATURDAY,
  };

  // 全ての曜日を日本語で表示するための配列
  // 初期化時に正しい並び順にする
  const allDisplayDays = ["日", "月", "火", "水", "木", "金", "土"];


  const handleDayToggle = (displayDay: string) => {
    const enumDay = dayMap[displayDay]; // 日本語からEnumに変換

    if (enumDay === undefined) {
      // 想定外の日本語曜日が来た場合のエラーハンドリング
      console.error(`Unknown display day: ${displayDay}`);
      return;
    }

    setSelectedDays((prevDays) =>
      prevDays.includes(enumDay)
        ? prevDays.filter((d) => d !== enumDay)
        : [...prevDays, enumDay].sort((a, b) => {
            // Enumの順序を定義 (例: 日月火水木金土)
            const enumOrder = [
              DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
              DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY
            ];
            return enumOrder.indexOf(a) - enumOrder.indexOf(b);
          })
    );
  };

  const categories = ["健康", "学習", "仕事", "趣味", "その他"]; // カテゴリの選択肢

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // 必須入力チェック
    if (!name.trim() || !category.trim() || selectedDays.length === 0) {
      setError("習慣名、カテゴリー、実行する曜日は必須です。");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/habit/${habit.id}`, {
        method: "PUT", // 更新にはPUTメソッドを使用
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category, color, daysOfWeek: selectedDays }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "習慣の更新に失敗しました。");
      }

      setSuccessMessage("習慣が正常に更新されました！");
      // 成功後、少し待ってから詳細ページへリダイレクト
      setTimeout(() => {
        router.push(`/habit/${habit.id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "習慣の更新中に予期せぬエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          習慣名
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          カテゴリー
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
          色
        </label>
        <input
          type="color"
          id="color"
          value={color ?? ""}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* 実行する曜日 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          実行する曜日
        </label>
        <div className="flex flex-wrap gap-2">
          {allDisplayDays.map((displayDay) => {
            const enumDay = dayMap[displayDay];
            return (
              <button
                key={displayDay}
                type="button"
                onClick={() => handleDayToggle(displayDay)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedDays.includes(enumDay)
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {displayDay}
              </button>
            );
          })}
        </div>
        {selectedDays.length === 0 && (
          <p className="mt-2 text-sm text-red-600">※少なくとも1つ曜日を選択してください。</p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">エラー！</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">成功！</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
            isSubmitting ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          }`}
        >
          {isSubmitting ? (
            <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
          ) : (
            <CheckIcon className="-ml-1 mr-3 h-5 w-5 text-white" />
          )}
          {isSubmitting ? "更新中..." : "習慣を更新"}
        </button>
      </div>
    </form>
  );
}