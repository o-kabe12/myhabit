import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import HabitEditForm from "../../../components/HabitEditForm";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Habit } from "../../../types";

// PrismaClient のインスタンスはファイルスコープで一度だけ作成します
const prisma = new PrismaClient();

interface HabitEditPageProps {
  params: {
    id: string; // URLパスから取得する習慣ID
  };
}

export default async function HabitEditPage({ params }: HabitEditPageProps) {
  const session = await getServerSession(authOptions);
  const id = params.id;

  // ログインしていない場合はログインページへリダイレクト
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  let habit: Habit | null = null;
  try {
    // データベースから特定の習慣を取得し、自分の習慣であることを確認
    habit = await prisma.habit.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error("習慣の取得に失敗しました:", error);
    // エラーハンドリングを強化: 習慣が見つからない場合と同様の表示にするなど
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600">習慣の読み込み中にエラーが発生しました。</p>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="md:h-full flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-xl font-semibold text-gray-800 mb-4">習慣が見つかりませんでした。</p>
          <Link href="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="md:h-full flex items-center py-6 sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-semibold text-gray-900">編集</h1>
              <Link href={`/habit/${habit.id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-2">
                <ArrowLeftIcon className="h-6 w-6" />
                <span className="font-medium">習慣詳細に戻る</span>
              </Link>
            </div>
            <HabitEditForm habit={habit} />
          </div>
        </div>
      </div>
    </div>
  );
}