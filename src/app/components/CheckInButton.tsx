"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon as OutlineCheckCircleIcon } from "@heroicons/react/24/outline";

interface CheckInButtonProps {
  habitId: string;
  date: string; // 'YYYY-MM-DD'
}

export default function CheckInButton({ habitId, date }: CheckInButtonProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初回ロード時と日付が変わった時にチェックイン状態を取得
  useEffect(() => {
    async function fetchCheckInStatus() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/checkin/${date}/${habitId}`);
        if (!response.ok) {
          throw new Error("チェックイン状態の取得に失敗しました。");
        }
        const data = await response.json();
        setIsCheckedIn(data.isCheckedIn); // APIからのisCompletedの値を受け取る
      } catch (err: any) {
        console.error("Failed to fetch check-in status:", err);
        setError("状態の取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCheckInStatus();
  }, [habitId, date]);

  const handleCheckInToggle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // isCheckedIn が true なら解除（DELETE）
      // isCheckedIn が false なら達成（PUT）
      const method = isCheckedIn ? "DELETE" : "PUT";
      const response = await fetch(`/api/checkin/${date}/${habitId}`, {
        method: method,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `チェックインの${isCheckedIn ? "解除" : "達成"}に失敗しました。`);
      }

      setIsCheckedIn(!isCheckedIn); // 状態をトグル
    } catch (err: any) {
      console.error("Failed to toggle check-in:", err);
      setError(err.message || "チェックインの更新中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button
        className="flex items-center justify-center px-6 py-3 rounded-full bg-indigo-200 text-indigo-700 font-bold transition-all duration-200 cursor-not-allowed"
        disabled
      >
        <ArrowPathIcon className="animate-spin h-6 w-6 mr-2" />
        <span>ロード中...</span>
      </button>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm flex items-center">
        <XCircleIcon className="h-5 w-5 mr-1" />
        {error}
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckInToggle}
      className={`flex items-center px-6 py-3 rounded-full font-bold transition-all duration-200 transform ${
        isCheckedIn
          ? "bg-green-500 hover:bg-green-600 text-white shadow-lg scale-105" // チェックイン済みのスタイル
          : "bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-md" // チェックイン前のスタイル
      }`}
      disabled={isLoading}
    >
      {isCheckedIn ? (
        <CheckCircleIcon className="h-6 w-6 mr-2" />
      ) : (
        <OutlineCheckCircleIcon className="h-6 w-6 mr-2" />
      )}
      <span>{isCheckedIn ? "チェックイン済み" : "チェックインする"}</span>
    </button>
  );
}