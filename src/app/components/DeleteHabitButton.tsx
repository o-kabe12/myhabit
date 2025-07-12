// src/components/DeleteHabitButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

interface DeleteHabitButtonProps {
  habitId: string;
  onDelete?: () => void;
}

export default function DeleteHabitButton({ habitId, onDelete }: DeleteHabitButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/habit/${habitId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "習慣の削除に失敗しました。");
      }

      setSuccess("習慣が正常に削除されました。");
      setTimeout(() => {
        if (onDelete) onDelete();
        router.refresh();
        router.push("/dashboard");
      }, 1000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "習慣の削除中に予期せぬエラーが発生しました。");
    } finally {
      setIsDeleting(false);
      // 成功時以外はモーダルを閉じる
      if (!success) {
        setTimeout(() => setShowModal(false), 2000); // エラー表示後にモーダルを閉じる
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-red-600 hover:text-red-800 transition-colors duration-200 cursor-pointer"
        title="習慣を削除"
      >
        <TrashIcon className="h-6 w-6" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            {success ? (
              <div className="text-center text-green-600">
                <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg font-semibold">{success}</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-600">
                <XCircleIcon className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg font-semibold">{error}</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  閉じる
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">習慣を削除しますか？</h3>
                  <p className="text-gray-600 mb-6">
                    この操作は元に戻せません。本当に削除してもよろしいですか？
                  </p>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`px-4 py-2 rounded-md text-white transition-colors duration-200 cursor-pointer ${
                      isDeleting
                        ? "bg-red-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    } flex items-center justify-center space-x-2`}
                  >
                    {isDeleting && (
                      <ArrowPathIcon className="animate-spin h-5 w-5 text-white" />
                    )}
                    <span>{isDeleting ? "削除中..." : "削除する"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}