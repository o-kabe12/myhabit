"use client";

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// データフェッチ関数 (SWR用)
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  return res.json();
};

interface DailyMemoPanelProps {
  selectedDate: string; // YYYY-MM-DD形式
}

export default function DailyMemoPanel({ selectedDate }: DailyMemoPanelProps) {
  const [memoContent, setMemoContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const apiUrl = `/api/memo/${selectedDate}`;

  // SWRでメモデータを取得
  const { data: memoData, error, isLoading, mutate } = useSWR<{ content: string }>(
    selectedDate ? apiUrl : null, // selectedDateがある場合のみフェッチ
    fetcher
  );

  // memoDataが変更されたら、memoContentを更新
  useEffect(() => {
    if (memoData) {
      setMemoContent(memoData.content);
    } else {
      setMemoContent(''); // データがない場合は空にする
    }
    setSaveStatus('idle'); // 新しい日付に切り替わったらステータスをリセット
  }, [memoData, selectedDate]);

  const handleSaveMemo = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT', // PUTで存在すれば更新、なければ作成 (upsert)
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: memoContent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'メモの保存に失敗しました。');
      }

      setSaveStatus('success');
      // SWRキャッシュを更新して最新の状態を反映
      mutate();
    } catch (err) {
      console.error("メモ保存エラー:", err);
      setSaveStatus('error');
      // 必要であればユーザーにアラート
      alert(`メモの保存中にエラーが発生しました: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
      // 一定時間後にステータスをリセット
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [apiUrl, memoContent, mutate]);

  const handleDeleteMemo = useCallback(async () => {
    if (!confirm("この日のメモを本当に削除しますか？")) {
      return;
    }
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(apiUrl, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'メモの削除に失敗しました。');
      }

      setMemoContent(''); // 削除成功したら内容を空にする
      setSaveStatus('success');
      mutate(); // SWRキャッシュを更新

    } catch (err) {
      console.error("メモ削除エラー:", err);
      setSaveStatus('error');
      alert(`メモの削除中にエラーが発生しました: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [apiUrl, mutate]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-600">
        <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
        <p>メモを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-center">
        <p>メモの読み込み中にエラーが発生しました。</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {selectedDate} のメモ
      </h2>
      <textarea
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-700"
        rows={5}
        placeholder="今日の出来事や気づきを記録しましょう..."
        value={memoContent}
        onChange={(e) => setMemoContent(e.target.value)}
      />
      <div className="flex justify-end items-center space-x-3">
        {saveStatus === 'success' && (
          <span className="text-green-600 flex items-center text-sm">
            <CheckCircleIcon className="h-5 w-5 mr-1" /> 保存しました
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 flex items-center text-sm">
            <XCircleIcon className="h-5 w-5 mr-1" /> 保存失敗
          </span>
        )}
        <button
          onClick={handleSaveMemo}
          className={`px-5 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center
            ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          disabled={isSaving}
        >
          {isSaving && <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />}
          保存
        </button>
        {memoContent && ( // メモ内容がある場合のみ削除ボタンを表示
          <button
            onClick={handleDeleteMemo}
            className={`px-5 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center
              ${isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            disabled={isSaving}
          >
            {isSaving && <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />}
            削除
          </button>
        )}
      </div>
    </div>
  );
}