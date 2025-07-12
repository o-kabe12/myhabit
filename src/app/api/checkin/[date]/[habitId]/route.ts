import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

// XPの定義 (例: lib/xp.ts などからインポートすることも可能)
const XP_PER_CHECKIN = 10;
const calculateXpThreshold = (level: number) => 100 + (level - 1) * 50; // 仮のXP計算式

const prisma = new PrismaClient();

// GETリクエストハンドラー (特定の日の特定の習慣のチェックイン状態を取得)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  // 末尾から2つ前がdate, 1つ前がhabitId
  const date = pathParts[pathParts.length - 2];
  const habitId = pathParts[pathParts.length - 1];

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        userId: userId,
        habitId: habitId,
        date: new Date(date),
      },
    });
    if (!checkIn) {
      return NextResponse.json({ isCompleted: false }, { status: 200 });
    }
    return NextResponse.json({ isCompleted: checkIn.isCompleted }, { status: 200 });
  } catch (error) {
    console.error("チェックイン取得エラー:", error);
    return NextResponse.json({ error: "チェックインの取得に失敗しました。" }, { status: 500 });
  }
}

// PUTリクエストハンドラー (チェックインの作成/更新とXP・レベル計算)
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const dateString = pathParts[pathParts.length - 2];
  const habitId = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const date = new Date(dateString);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const habit = await prisma.habit.findUnique({
      where: { id: habitId, userId: userId },
    });
    if (!habit) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_habitId_date: {
          userId: userId,
          habitId: habitId,
          date: utcDate,
        },
      },
      select: { isCompleted: true },
    });
    if (existingCheckIn && existingCheckIn.isCompleted) {
      return NextResponse.json({ message: "既にチェックイン済みです。", isCheckedIn: true }, { status: 200 });
    }
    const checkIn = await prisma.checkIn.upsert({
      where: {
        userId_habitId_date: {
          userId: userId,
          habitId: habitId,
          date: utcDate,
        },
      },
      update: { isCompleted: true },
      create: {
        date: utcDate,
        habitId: habitId,
        userId: userId,
        isCompleted: true,
      },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });
    if (user) {
      const newXp = user.xp + XP_PER_CHECKIN;
      let newLevel = user.level;
      let levelUpOccurred = false;
      while (newXp >= calculateXpThreshold(newLevel)) {
        newLevel++;
        levelUpOccurred = true;
      }
      await prisma.user.update({
        where: { id: userId },
        data: { xp: newXp, level: newLevel },
      });
      return NextResponse.json({ ...checkIn, levelUpOccurred, newLevel, newXp, isCheckedIn: true }, { status: 200 });
    }
    return NextResponse.json({ ...checkIn, isCheckedIn: true }, { status: 200 });
  } catch (error) {
    console.error("チェックインの作成/更新およびXP/レベル計算エラー:", error);
    return NextResponse.json({ error: "チェックインの作成/更新に失敗しました。" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const dateString = pathParts[pathParts.length - 2];
  const habitId = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const date = new Date(dateString);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_habitId_date: {
          userId: userId,
          habitId: habitId,
          date: utcDate,
        },
      },
      select: { isCompleted: true },
    });
    if (!existingCheckIn || !existingCheckIn.isCompleted) {
      return NextResponse.json({ message: "既にチェックインは未完了です。", isCheckedIn: false }, { status: 200 });
    }
    const updatedCheckIn = await prisma.checkIn.update({
      where: {
        userId_habitId_date: {
          userId: userId,
          habitId: habitId,
          date: utcDate,
        },
      },
      data: { isCompleted: false },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });
    if (user) {
      const newXp = Math.max(0, user.xp - XP_PER_CHECKIN);
      let newLevel = user.level;
      while (newLevel > 1 && newXp < calculateXpThreshold(newLevel - 1)) {
        newLevel--;
      }
      await prisma.user.update({
        where: { id: userId },
        data: { xp: newXp, level: newLevel },
      });
      return NextResponse.json({ ...updatedCheckIn, isCheckedIn: false, newLevel, newXp }, { status: 200 });
    }
    return NextResponse.json({ ...updatedCheckIn, isCheckedIn: false }, { status: 200 });
  } catch (error) {
    console.error("チェックイン解除エラー:", error);
    return NextResponse.json({ error: "チェックインの解除に失敗しました。" }, { status: 500 });
  }
}