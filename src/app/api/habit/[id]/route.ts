// src/app/api/habit/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // 相対パスを修正

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

// PUTリクエストハンドラー (習慣の更新)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const id = params.id;
  const { name, category, color, daysOfWeek } = await request.json();

  // 入力値のバリデーション
  if (!name || !category || !daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 });
  }

  try {
    // 習慣が存在し、かつ現在のユーザーのものであることを確認
    const existingHabit = await prisma.habit.findUnique({
      where: { id: id },
    });

    if (!existingHabit || existingHabit.userId !== session.user.id) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: id },
      data: {
        name,
        category,
        color,
        daysOfWeek,
      },
    });
    return NextResponse.json(updatedHabit, { status: 200 });
  } catch (error) {
    console.error("PUT - 習慣の更新エラー:", error); // デバッグ用ログ
    return NextResponse.json({ error: "習慣の更新に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETEリクエストハンドラー (習慣の削除)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const id = params.id;

  try {
    // 習慣が存在し、かつ現在のユーザーのものであることを確認
    const existingHabit = await prisma.habit.findUnique({
      where: { id: id },
    });

    if (!existingHabit || existingHabit.userId !== session.user.id) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    await prisma.habit.delete({
      where: { id: id },
    });
    return NextResponse.json({ message: "習慣が正常に削除されました。" }, { status: 200 });
  } catch (error) {
    console.error("DELETE - 習慣の削除エラー:", error); // デバッグ用ログ
    return NextResponse.json({ error: "習慣の削除に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}