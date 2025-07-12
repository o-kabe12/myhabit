"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusCircleIcon } from "@heroicons/react/24/solid"; // アイコン用

export default function NewHabitPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("運動"); // デフォルト値
  const [color, setColor] = useState("#6366f1"); // デフォルト値: indigo-500
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]); // 選択された曜日
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { data: session, status } = useSession();

  // 認証状態のチェック
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>読み込み中...</p></div>;
  }
  if (status === "unauthenticated") {
    router.push("/login"); // 未ログインならログインページへリダイレクト
    return null;
  }

  // 曜日選択のハンドラー
  const handleDayToggle = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  // フォーム送信ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // バリデーション
    if (!name.trim()) {
      setError("習慣名は必須です。");
      setLoading(false);
      return;
    }
    if (daysOfWeek.length === 0) {
      setError("実行する曜日を少なくとも1つ選択してください。");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category, color, daysOfWeek }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "習慣の登録に失敗しました。");
      }

      // 成功したらダッシュボードへリダイレクト
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "予期せぬエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const days = ["月", "火", "水", "木", "金", "土", "日"];
  const categories = ["運動", "学習", "健康", "趣味", "仕事", "その他"];
  const colors = [
    { value: "#ef4444", name: "Red", className: "bg-red-500" }, // red-500
    { value: "#f97316", name: "Orange", className: "bg-orange-500" }, // orange-500
    { value: "#fde047", name: "Yellow", className: "bg-yellow-300" }, // yellow-300
    { value: "#22c55e", name: "Green", className: "bg-green-500" }, // green-500
    { value: "#0ea5e9", name: "Sky", className: "bg-sky-500" }, // sky-500
    { value: "#6366f1", name: "Indigo", className: "bg-indigo-500" }, // indigo-500
    { value: "#a855f7", name: "Purple", className: "bg-purple-500" }, // purple-500
    { value: "#ec4899", name: "Pink", className: "bg-pink-500" }, // pink-500
  ];

  return (
    <div className="min-h-[90dvh] bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex items-center space-x-5 mb-8">
              <PlusCircleIcon className="h-10 w-10 text-cyan-500" />
              <h1 className="text-3xl font-semibold text-gray-900">新しい習慣を登録</h1>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  習慣名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="例: 筋トレ、読書、早起き"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  id="category"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${c.className} ${
                        color === c.value ? "border-indigo-500 ring-2 ring-indigo-500 ring-offset-2" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setColor(c.value)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  実行曜日 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 grid grid-cols-7 gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`py-2 px-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                        daysOfWeek.includes(day)
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => handleDayToggle(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "登録中..." : "習慣を登録"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}