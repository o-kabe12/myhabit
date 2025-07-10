import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

// GETリクエストハンドラー (特定の習慣の詳細を取得)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const habitId = params.id;
  const userId = session.user.id;

  try {
    const habit = await prisma.habit.findUnique({
      where: {
        id: habitId,
        userId: userId, // ユーザーの習慣であることを確認
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    return NextResponse.json(habit, { status: 200 });

  } catch (error) {
    console.error("習慣の取得エラー:", error);
    return NextResponse.json({ error: "習慣の取得に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

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

  const id = params.id; // 習慣のID
  const userId = session.user.id;

  try {
    // まず、削除対象の習慣が現在のユーザーのものであるか確認
    const habit = await prisma.habit.findUnique({
      where: { id: id },
    });

    if (!habit || habit.userId !== userId) {
      return NextResponse.json({ error: "習慣が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    // 習慣を削除する前に、関連する全てのチェックイン記録を削除する
    // Prismaのトランザクションを使って、複数の操作をまとめて実行し、
    // どれか一つでも失敗したら全てをロールバックするようにします。
    await prisma.$transaction([
      prisma.checkIn.deleteMany({
        where: { habitId: id },
      }),
      prisma.habit.delete({
        where: { id: id },
      }),
    ]);

    return NextResponse.json({ message: "習慣が正常に削除されました。" }, { status: 200 });

  } catch (error) {
    console.error("習慣の削除エラー:", error);
    // PrismaのエラーコードP2003（外部キー制約違反）をより具体的にハンドリングすることも可能
    return NextResponse.json({ error: "習慣の削除に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}