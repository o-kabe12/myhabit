// src/components/Header.tsx
"use client"; // クライアントコンポーネントとしてマーク

import { useState } from "react"; // useStateをインポート
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  HomeIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Header() {
  const { data: session, status } = useSession(); // クライアントサイドでセッション情報を取得
  const [isMenuOpen, setIsMenuOpen] = useState(false); // メニュー開閉状態を管理

  // メニューアイテムのリストを定義
  const menuItems = session ? (
    <>
      <Link
        href="/dashboard"
        className="flex items-center space-x-2 px-4 py-2 hover:bg-indigo-700 rounded-md transition-colors duration-200"
        onClick={() => setIsMenuOpen(false)} // クリックでメニューを閉じる
      >
        <UserCircleIcon className="h-5 w-5" />
        <span>ダッシュボード</span>
      </Link>
      {/* 設定など他のリンクをここに追加できます */}
      {/* <Link
        href="/settings"
        className="flex items-center space-x-2 px-4 py-2 hover:bg-indigo-700 rounded-md transition-colors duration-200"
        onClick={() => setIsMenuOpen(false)}
      >
        <Cog6ToothIcon className="h-5 w-5" />
        <span>設定</span>
      </Link> */}
      <button
        onClick={() => {
          signOut({ callbackUrl: "/" }); // サインアウト後トップページにリダイレクト
          setIsMenuOpen(false); // クリックでメニューを閉じる
        }}
        className="text-left px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800 transition-colors duration-200 flex items-center space-x-2 text-sm font-medium"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5" />
        <span>サインアウト</span>
      </button>
    </>
  ) : (
    <Link
      href="/login"
      className="w-full text-left px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800 transition-colors duration-200 text-sm font-medium"
      onClick={() => setIsMenuOpen(false)} // クリックでメニューを閉じる
    >
      ログイン
    </Link>
  );

  return (
    <header className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg sticky top-0 left-0 w-full z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* ロゴ/サイト名 */}
        <Link href="/" className="flex items-center space-x-2">
          <HomeIcon className="h-7 w-7 text-white" />
          <span className="text-2xl font-bold tracking-tight">MyHabit</span>
        </Link>

        {/* PC版ナビゲーション (lg以上の画面幅で表示) */}
        <div className="hidden lg:flex items-center space-x-6 w-fit">
          {status === "loading" ? (
            <div className="h-6 w-24 bg-indigo-400 rounded animate-pulse"></div>
          ) : (
            menuItems
          )}
        </div>

        {/* ハンバーガーメニューボタン (lg未満の画面幅で表示) */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md p-2"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-7 w-7" />
            ) : (
              <Bars3Icon className="h-7 w-7" />
            )}
          </button>
        </div>
      </nav>

      {/* モバイルメニュー (lg未満の画面幅で表示、開閉状態に応じて表示) */}
      <div
        className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMenuOpen ? "max-h-screen opacity-100 py-4" : "max-h-0 opacity-0"
        } bg-indigo-600/95`}
      >
        <div className="flex flex-col space-y-3 px-4 text-white">
          {status === "loading" ? (
            <div className="h-6 w-24 bg-indigo-400 rounded animate-pulse"></div>
          ) : (
            menuItems
          )}
        </div>
      </div>
    </header>
  );
}