import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

// GETリクエストハンドラー (特定の習慣の詳細を取得)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const habitId = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const habit = await prisma.habit.findUnique({
      where: {
        id: habitId,
        userId: userId,
      },
    });
    if (!habit) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }
    return NextResponse.json(habit, { status: 200 });
  } catch (error) {
    console.error("習慣の取得エラー:", error);
    return NextResponse.json({ error: "習慣の取得に失敗しました。" }, { status: 500 });
  }
}

// PUTリクエストハンドラー (習慣の更新)
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const habitId = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const { name, category, color, daysOfWeek } = await request.json();
  if (!name || !category || !daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 });
  }
  try {
    const existingHabit = await prisma.habit.findUnique({
      where: { id: habitId },
    });
    if (!existingHabit || existingHabit.userId !== session.user.id) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: { name, category, color, daysOfWeek },
    });
    return NextResponse.json(updatedHabit, { status: 200 });
  } catch (error) {
    console.error("PUT - 習慣の更新エラー:", error);
    return NextResponse.json({ error: "習慣の更新に失敗しました。" }, { status: 500 });
  }
}

// DELETEリクエストハンドラー (習慣の削除)
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const habitId = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== userId) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }
    await prisma.$transaction([
      prisma.checkIn.deleteMany({ where: { habitId: habitId } }),
      prisma.habit.delete({ where: { id: habitId } }),
    ]);
    return NextResponse.json({ message: "習慣が正常に削除されました。" }, { status: 200 });
  } catch (error) {
    console.error("習慣の削除エラー:", error);
    return NextResponse.json({ error: "習慣の削除に失敗しました。" }, { status: 500 });
  }
}