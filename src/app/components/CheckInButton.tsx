"use client";

import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon as OutlineCheckCircleIcon } from "@heroicons/react/24/outline";
import useSWR, { mutate as globalMutate } from "swr";

interface CheckInButtonProps {
  habitId: string;
  date: string; // 'YYYY-MM-DD'
}

// データフェッチ関数 (SWR用)
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: '不明なエラー' }));
    throw new Error(errorData.error || 'データフェッチに失敗しました');
  }
  return res.json();
};

// ISO形式の日付文字列をYYYY-MM-DD 形式に変換
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CheckInButton({ habitId, date }: CheckInButtonProps) {
  const checkInApiUrl = (habitId && date) ? `/api/checkin/${date}/${habitId}` : null;

  // SWRが扱うデータの型をAPIのレスポンスに合わせて <{ isCompleted: boolean }> に修正
  const { data, error, isLoading, mutate } = useSWR<{ isCompleted: boolean }>(
    checkInApiUrl,
    fetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
    }
  );

  const [isMutating, setIsMutating] = useState(false);

  const handleCheckInToggle = async () => {
    // isMutatingやisLoading、URLがない場合は処理を中断
    if (isMutating || isLoading || !checkInApiUrl) return;

    setIsMutating(true);

    // キャッシュ内の正しいプロパティ名(isCompleted)を見るように修正
    const previousState = data?.isCompleted ?? false;
    // 楽観的更新で操作するデータも正しいプロパティ名に
    const optimisticData = { isCompleted: !previousState };
    mutate(optimisticData, false);

    try {
      const method = previousState ? "DELETE" : "PUT";
      const response = await fetch(checkInApiUrl, { method });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '不明なエラーが発生しました。' }));
        throw new Error(errorData.error || `チェックインの${previousState ? "解除" : "達成"}に失敗しました。`);
      }

      const successData = await response.json();
      mutate(successData, { revalidate: false });

      // 関連データのキャッシュ更新
      const today = new Date();
      const currentMonthStartDate = formatDateToYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 1));
      const currentMonthEndDate = formatDateToYYYYMMDD(new Date(today.getFullYear(), today.getMonth() + 1, 0));
      const calendarApiUrl = `/api/checkin/calendar/${habitId}?startDate=${currentMonthStartDate}&endDate=${currentMonthEndDate}`;
      globalMutate(calendarApiUrl);

      const streakApiUrl = `/api/habit/${habitId}/streak`;
      globalMutate(streakApiUrl);

    } catch (err: unknown) {
      console.error("Failed to toggle check-in:", err);
      // エラー時のロールバックも正しいプロパティ名で
      mutate({ isCompleted: previousState }, false);
      alert((err instanceof Error ? err.message : "チェックインの更新中にエラーが発生しました。"));
    } finally {
      setIsMutating(false);
    }
  };

  // habitId や date が渡される前の状態
  if (!checkInApiUrl) {
    return (
      <button className="flex items-center justify-center px-6 py-3 rounded-full bg-gray-200 text-gray-400 cursor-not-allowed" disabled>
        情報がありません
      </button>
    );
  }

  // 初回ロード中
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

  // エラー発生時
  if (error) {
    return (
      <div className="text-red-600 text-sm flex items-center">
        <XCircleIcon className="h-5 w-5 mr-1" />
        {error.message || "エラーが発生しました。"}
      </div>
    );
  }

  // 最終的な表示状態の判定も正しいプロパティ名(isCompleted)から取得
  const isCheckedIn = data?.isCompleted ?? false;

  return (
    <button
      onClick={handleCheckInToggle}
      className={`flex items-center px-6 py-3 rounded-full font-bold transition-all duration-200 transform cursor-pointer ${
        isCheckedIn
          ? "bg-green-500 hover:bg-green-600 text-white shadow-lg scale-105"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-md"
      }`}
      disabled={isMutating}
    >
      {isMutating ? (
        <ArrowPathIcon className="animate-spin h-6 w-6 mr-2" />
      ) : isCheckedIn ? (
        <CheckCircleIcon className="h-6 w-6 mr-2" />
      ) : (
        <OutlineCheckCircleIcon className="h-6 w-6 mr-2" />
      )}
      <span>{isMutating ? "更新中..." : isCheckedIn ? "チェックイン済み" : "チェックインする"}</span>
    </button>
  );
}