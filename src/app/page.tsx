"use client"; // クライアントコンポーネントとしてマーク

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      // セッションのロード中は何もせず待機
      return;
    }

    if (status === "authenticated") {
      // ログイン済みであればダッシュボードへリダイレクト
      router.push("/dashboard");
    } else {
      // 未ログインであればログインページへリダイレクト
      router.push("/login");
    }
  }, [status, router]); // status と router の変更を監視

  // セッション状態が「ロード中」の間は、シンプルなローディング表示をします
  // これにより、リダイレクトまでの間に空白のページが見えるのを防ぎます
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">読み込み中...</p>
      </div>
    );
  }

  // それ以外の状態（基本的にリダイレクトされるので、この部分はほとんど表示されない）
  return null;
}