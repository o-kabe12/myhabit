// src/components/CheckInButton.tsx
"use client";

import { useState, useEffect } from "react"; // useEffect を再導入
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
  const checkInApiUrl = `/api/checkin/${date}/${habitId}`;
  // useSWR の第3引数でオプションを渡す。
  // refreshInterval: 0 を設定することで、フォーカス時の再検証などを無効化し、手動 mutate のみで制御しやすくする。
  const { data, error, isLoading, mutate } = useSWR<{ isCheckedIn: boolean }>(checkInApiUrl, fetcher, { refreshInterval: 0 });

  // UI上の表示状態を管理するstate
  const [displayCheckedIn, setDisplayCheckedIn] = useState<boolean>(false); // 初期値は false に変更
  // APIリクエスト中のローディング状態を別途管理
  const [isMutating, setIsMutating] = useState(false);

  // ★修正点★ SWRのデータが更新されたら、UI表示用のstateも更新する useEffect
  useEffect(() => {
    // isLoading が false になり、かつ data が undefined でなければ（つまりデータ取得が完了したら）
    if (!isLoading && data !== undefined) {
      setDisplayCheckedIn(data.isCheckedIn);
    }
  }, [isLoading, data]); // isLoading または data が変更された時に実行

  const handleCheckInToggle = async () => {
    if (isMutating) return; // 二重クリック防止
    setIsMutating(true); // APIリクエスト開始

    // UIを即座に切り替える (楽観的更新)
    const previousState = displayCheckedIn;
    setDisplayCheckedIn(prev => !prev); 

    try {
      const method = previousState ? "DELETE" : "PUT"; // 変更前の状態でAPIメソッドを決定
      const response = await fetch(checkInApiUrl, {
        method: method,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '不明なエラーが発生しました。' }));
        throw new Error(errorData.error || `チェックインの${previousState ? "解除" : "達成"}に失敗しました。`);
      }

      const successData = await response.json();
      mutate(successData, { revalidate: false }); // SWRキャッシュを更新し、再検証はしない
      setDisplayCheckedIn(successData.isCheckedIn); // APIからの最終的な状態を反映

      // カレンダーデータのキャッシュも更新（こちらは revalidate: true で再フェッチさせる）
      const today = new Date();
      const currentMonthStartDate = formatDateToYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 1));
      const currentMonthEndDate = formatDateToYYYYMMDD(new Date(today.getFullYear(), today.getMonth() + 1, 0));
      const calendarApiUrl = `/api/checkin/calendar/${habitId}?startDate=${currentMonthStartDate}&endDate=${currentMonthEndDate}`;
      globalMutate(calendarApiUrl, { revalidate: true }); // カレンダーはバックグラウンドで最新状態を取得

    } catch (err: any) {
      console.error("Failed to toggle check-in:", err);
      // エラーが発生した場合、UIを元の状態に戻す
      setDisplayCheckedIn(previousState);
      // SWRのキャッシュも元の状態に戻す（または再検証してエラーをUIに表示）
      mutate(undefined, { revalidate: true }); // キャッシュをクリアし、再検証してエラーを表示させる
      alert(err.message || "チェックインの更新中にエラーが発生しました。");
    } finally {
      setIsMutating(false); // APIリクエスト終了
    }
  };

  // 初回ロード中、またはAPIリクエスト中の場合はローディング表示
  // SWRのisLoading: APIからの初回データ取得中
  // isMutating: ボタンクリックによるAPI通信中
  if (isLoading || isMutating) {
    return (
      <button
        className="flex items-center justify-center px-6 py-3 rounded-full bg-indigo-200 text-indigo-700 font-bold transition-all duration-200 cursor-not-allowed"
        disabled
      >
        <ArrowPathIcon className="animate-spin h-6 w-6 mr-2" />
        <span>{isMutating ? "更新中..." : "ロード中..."}</span>
      </button>
    );
  }

  // SWRのエラーがある場合、エラー表示
  if (error) {
    return (
      <div className="text-red-600 text-sm flex items-center">
        <XCircleIcon className="h-5 w-5 mr-1" />
        {error.message || "エラーが発生しました。"}
      </div>
    );
  }
  
  // UI表示用の state (displayCheckedIn) を使用
  const currentIsCheckedIn = displayCheckedIn; 

  return (
    <button
      onClick={handleCheckInToggle}
      className={`flex items-center px-6 py-3 rounded-full font-bold transition-all duration-200 transform ${
        currentIsCheckedIn
          ? "bg-green-500 hover:bg-green-600 text-white shadow-lg scale-105"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-md"
      }`}
      disabled={isMutating} // APIリクエスト中はボタンを無効化
    >
      {currentIsCheckedIn ? (
        <CheckCircleIcon className="h-6 w-6 mr-2" />
      ) : (
        <OutlineCheckCircleIcon className="h-6 w-6 mr-2" />
      )}
      <span>{currentIsCheckedIn ? "チェックイン済み" : "チェックインする"}</span>
    </button>
  );
}