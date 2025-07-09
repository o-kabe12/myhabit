// src/app/api/checkin/[date]/[habitId]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// PUTリクエストハンドラー (チェックインの作成/更新)
export async function PUT(
  request: Request,
  { params }: { params: { date: string; habitId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const dateString = params.date;
  const habitId = params.habitId;
  const userId = session.user.id;

  try {
    const date = new Date(dateString);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    const habit = await prisma.habit.findUnique({
      where: {
        id: habitId,
        userId: userId,
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    // CheckInを作成または更新（Upsert）
    const checkIn = await prisma.checkIn.upsert({
      where: {
        userId_habitId_date: { // ★ここを修正: スキーマの @@unique に合わせる★
          userId: userId, // 追加
          habitId: habitId,
          date: utcDate,
        },
      },
      update: {
        isCompleted: true, // 存在する場合はisCompletedをtrueに更新（再チェックインの場合）
      },
      create: {
        date: utcDate,
        habitId: habitId,
        userId: userId,
        isCompleted: true, // 新規作成時はtrue
      },
    });

    return NextResponse.json(checkIn, { status: 200 });
  } catch (error) {
    console.error("チェックインの作成/更新エラー:", error);
    return NextResponse.json({ error: "チェックインの作成/更新に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETEリクエストハンドラー (チェックインの削除)
export async function DELETE(
  request: Request,
  { params }: { params: { date: string; habitId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const dateString = params.date;
  const habitId = params.habitId;
  const userId = session.user.id;

  try {
    const date = new Date(dateString);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    // isCompleted を false に更新することで「チェックイン解除」を表現
    const updatedCheckIn = await prisma.checkIn.updateMany({ // updateManyを使う
      where: {
        habitId: habitId,
        date: utcDate,
        userId: userId,
      },
      data: {
        isCompleted: false, // チェックイン解除はisCompletedをfalseにする
      },
    });

    if (updatedCheckIn.count === 0) {
      return NextResponse.json({ message: "チェックインが見つかりませんでした。" }, { status: 404 });
    }

    return NextResponse.json({ message: "チェックインが正常に解除されました。" }, { status: 200 });
  } catch (error) {
    console.error("チェックインの解除エラー:", error);
    return NextResponse.json({ error: "チェックインの解除に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GETリクエストハンドラー (特定の日の特定の習慣のチェックイン状態を取得)
export async function GET(
    request: Request,
    { params }: { params: { date: string; habitId: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const dateString = params.date;
    const habitId = params.habitId;
    const userId = session.user.id;

    try {
        const date = new Date(dateString);
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

        const checkIn = await prisma.checkIn.findUnique({
            where: {
                userId_habitId_date: { // ★ここを修正: スキーマの @@unique に合わせる★
                    userId: userId, // 追加
                    habitId: habitId,
                    date: utcDate,
                },
            },
            select: { // isCompleted だけを取得
                isCompleted: true,
            }
        });

        // チェックインが存在し、かつisCompletedがtrueならisCheckedInはtrue
        return NextResponse.json({ isCheckedIn: checkIn?.isCompleted || false }, { status: 200 });
    } catch (error) {
        console.error("チェックイン状態の取得エラー:", error);
        return NextResponse.json({ error: "チェックイン状態の取得に失敗しました。" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}