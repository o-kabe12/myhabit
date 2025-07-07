// src/app/api/habits/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // authOptionsをインポート

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // ユーザー認証の確認
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "認証が必要です。" }, { status: 401 });
    }

    const { name, category, color, daysOfWeek } = await req.json();

    // 入力値のバリデーション
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ message: "習慣名は必須です。" }, { status: 400 });
    }
    if (!category || typeof category !== "string") {
      return NextResponse.json({ message: "カテゴリは必須です。" }, { status: 400 });
    }
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ message: "実行する曜日を少なくとも1つ選択してください。" }, { status: 400 });
    }
    // daysOfWeek の要素が有効な曜日かどうかの追加検証も可能

    // データベースに習慣を保存
    const newHabit = await prisma.habit.create({
      data: {
        name,
        category,
        color,
        daysOfWeek,
        userId: session.user.id, // ログイン中のユーザーIDを設定
      },
    });

    return NextResponse.json(newHabit, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("習慣登録エラー:", error);
    return NextResponse.json(
      { message: "習慣の登録中にエラーが発生しました。", error: (error as Error).message },
      { status: 500 }
    );
  }
}