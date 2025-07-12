// src/app/api/memo/[date]/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

const prisma = new PrismaClient();

// ヘルパー関数：日付文字列をUTCのDateオブジェクトに変換
const parseDateParam = (dateString: string): Date | null => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    console.error("日付パースエラー:", error);
    return null;
  }
};

// GET: 特定の日付のメモを取得
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const date = pathParts[pathParts.length - 1];

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const memo = await prisma.dailyMemo.findFirst({
      where: {
        userId: userId,
        date: new Date(date),
      },
    });
    if (!memo) {
      return NextResponse.json({ content: "" }, { status: 200 });
    }
    return NextResponse.json({ content: memo.content }, { status: 200 });
  } catch (error) {
    console.error("メモ取得エラー:", error);
    return NextResponse.json({ error: "メモの取得に失敗しました。" }, { status: 500 });
  }
}

// POST: 特定の日付のメモを作成 (既に存在する場合はエラー)
export async function POST(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const dateParam = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;
  const { content } = await request.json();
  if (typeof content !== 'string') {
    return NextResponse.json({ error: "contentは文字列である必要があります。" }, { status: 400 });
  }
  const targetDate = parseDateParam(dateParam);
  if (!targetDate) {
    return NextResponse.json({ error: "無効な日付形式です。YYYY-MM-DD形式で指定してください。" }, { status: 400 });
  }
  try {
    const existingMemo = await prisma.dailyMemo.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: targetDate,
        },
      },
    });
    if (existingMemo) {
      return NextResponse.json({ error: "この日付のメモは既に存在します。更新するにはPUTまたはPATCHを使用してください。" }, { status: 409 });
    }
    const newMemo = await prisma.dailyMemo.create({
      data: {
        userId: userId,
        date: targetDate,
        content: content,
      },
    });
    return NextResponse.json(newMemo, { status: 201 });
  } catch (error) {
    console.error("デイリーメモ作成エラー:", error);
    return NextResponse.json({ error: "デイリーメモの作成に失敗しました。" }, { status: 500 });
  }
}

// PUT: 特定の日付のメモを更新 (存在しない場合は作成)
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const dateParam = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;
  const { content } = await request.json();
  if (typeof content !== 'string') {
    return NextResponse.json({ error: "contentは文字列である必要があります。" }, { status: 400 });
  }
  const targetDate = parseDateParam(dateParam);
  if (!targetDate) {
    return NextResponse.json({ error: "無効な日付形式です。YYYY-MM-DD形式で指定してください。" }, { status: 400 });
  }
  try {
    const updatedMemo = await prisma.dailyMemo.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: targetDate,
        },
      },
      update: {
        content: content,
      },
      create: {
        userId: userId,
        date: targetDate,
        content: content,
      },
    });
    return NextResponse.json(updatedMemo, { status: 200 });
  } catch (error) {
    console.error("デイリーメモ更新エラー:", error);
    return NextResponse.json({ error: "デイリーメモの更新に失敗しました。" }, { status: 500 });
  }
}

// DELETE: 特定の日付のメモを削除
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const dateParam = pathParts[pathParts.length - 1];
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;
  const targetDate = parseDateParam(dateParam);
  if (!targetDate) {
    return NextResponse.json({ error: "無効な日付形式です。YYYY-MM-DD形式で指定してください。" }, { status: 400 });
  }
  try {
    const deletedMemo = await prisma.dailyMemo.delete({
      where: {
        userId_date: {
          userId: userId,
          date: targetDate,
        },
      },
    });
    return NextResponse.json({ message: "デイリーメモが削除されました。", deletedMemoId: deletedMemo.id }, { status: 200 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: "指定された日付のデイリーメモが見つかりませんでした。" }, { status: 404 });
    }
    console.error("デイリーメモ削除エラー:", error);
    return NextResponse.json({ error: "デイリーメモの削除に失敗しました。" }, { status: 500 });
  }
}