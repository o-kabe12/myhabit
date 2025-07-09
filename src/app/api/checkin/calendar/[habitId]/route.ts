import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GETリクエストハンドラー (特定習慣の期間内チェックインデータを取得)
export async function GET(
  request: Request,
  { params }: { params: { habitId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const habitId = params.habitId;
  const userId = session.user.id;

  // クエリパラメータから開始日と終了日を取得（オプション）
  // 例: /api/checkin/calendar/habitId?startDate=2024-01-01&endDate=2024-12-31
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  // デフォルトで過去1年間のデータを取得
  const endDate = endDateParam ? new Date(endDateParam) : new Date();
  const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());

  // 日付の時刻情報をクリアし、UTCで日付のみを扱う
  const utcStartDate = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
  const utcEndDate = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));

  try {
    // ユーザーがこの習慣の所有者であることを確認
    const habit = await prisma.habit.findUnique({
      where: {
        id: habitId,
        userId: userId,
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    // 指定された期間のチェックインデータを取得
    const checkIns = await prisma.checkIn.findMany({
      where: {
        habitId: habitId,
        userId: userId,
        date: {
          gte: utcStartDate, // 開始日以降
          lte: utcEndDate,   // 終了日以前
        },
        isCompleted: true, // 完了したチェックインのみを取得
      },
      select: {
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 応答データを作成
    // DateオブジェクトはそのままJSON化するとISO文字列になるので、クライアントで扱える
    return NextResponse.json(checkIns, { status: 200 });
  } catch (error) {
    console.error("カレンダーデータの取得エラー:", error);
    return NextResponse.json({ error: "カレンダーデータの取得に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}