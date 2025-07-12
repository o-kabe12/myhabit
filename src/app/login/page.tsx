// src/app/login/page.tsx
"use client"; // クライアントコンポーネントとしてマーク

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ログイン済みであればダッシュボードへリダイレクト
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // セッション状態がロード中の場合はローディング表示
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-[90dvh] flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">MyHabit</h1>
      <p className="text-lg text-gray-600 mb-6">習慣を記録して自己成長を実感しよう</p>

      {/* 未ログイン時にGoogleログインボタンを表示 */}
      {status === "unauthenticated" && (
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center space-x-2 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* GoogleアイコンのSVGパス（簡略化のため省略、実際のアイコンをここに挿入してください） */}
            <path d="M43.611 20.083H42V20H24v8h11.391c-1.616 4.685-6.579 8.163-11.391 8.163-6.74 0-12.214-5.474-12.214-12.214S17.26 11.728 24 11.728c3.243 0 6.208 1.258 8.48 3.32l5.656-5.656C34.823 6.035 29.704 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20V24h-4.389l-.001-3.917z" fill="#FFC107"/><path d="M6.353 24c0-1.745.246-3.414.708-5H18v5H6.353z" fill="#4285F4"/><path d="M24 44c5.166 0 9.873-1.97 13.435-5.187L32.779 32.74C30.686 34.025 27.498 34.838 24 34.838c-6.74 0-12.214-5.474-12.214-12.214H6.353c.462 1.586.708 3.255.708 5 0 11.045 8.955 20 20 20z" fill="#34A853"/><path d="M43.611 20.083H42V20H24v8h11.391c-1.616 4.685-6.579 8.163-11.391 8.163-6.74 0-12.214-5.474-12.214-12.214S17.26 11.728 24 11.728c3.243 0 6.208 1.258 8.48 3.32l5.656-5.656C34.823 6.035 29.704 4 24 4c-11.045 0-20 8.955-20 20s8.955 20 20 20c11.045 0 20-8.955 20-20V24h-4.389l-.001-3.917z" fill="#FBBC05"/>
          </svg>
          <span>Googleでログイン</span>
        </button>
      )}
    </div>
  );
}