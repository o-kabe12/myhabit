// src/app/api/checkin/[date]/[habitId]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// XPとレベル計算のヘルパー関数 (このファイル内に定義するか、別途ユーティリティファイルにまとめる)
// 今回は一時的にここに定義します
const XP_PER_CHECKIN = 100; // 1回のチェックインで得られるXP

// 次のレベルアップに必要なXPの閾値を計算
const calculateXpThreshold = (currentLevel: number): number => {
  // 例: レベル1 -> 500XP, レベル2 -> 1000XP, レベル3 -> 1500XP
  return 500 * currentLevel;
};

// PUTリクエストハンドラー (チェックインの作成/更新とXP・レベル計算)
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

    // まず、その日のチェックインが既に存在し、isCompletedがtrueであるか確認
    const existingCheckIn = await prisma.checkIn.findUnique({
        where: {
            userId_habitId_date: {
                userId: userId,
                habitId: habitId,
                date: utcDate,
            },
        },
        select: {
            isCompleted: true,
        }
    });

    // 既に完了済みの場合、XPを付与せずそのままリターン
    if (existingCheckIn && existingCheckIn.isCompleted) {
        return NextResponse.json({ message: "既にチェックイン済みです。" }, { status: 200 });
    }

    // CheckInを作成または更新（Upsert）
    const checkIn = await prisma.checkIn.upsert({
      where: {
        userId_habitId_date: {
          userId: userId,
          habitId: habitId,
          date: utcDate,
        },
      },
      update: {
        isCompleted: true, // 存在する場合はisCompletedをtrueに更新
      },
      create: {
        date: utcDate,
        habitId: habitId,
        userId: userId,
        isCompleted: true, // 新規作成時はtrue
      },
    });

    // ここからXPとレベルの計算ロジック
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (user) {
      let newXp = user.xp + XP_PER_CHECKIN;
      let newLevel = user.level;
      let levelUpOccurred = false;

      // レベルアップ判定
      while (newXp >= calculateXpThreshold(newLevel)) {
        newLevel++;
        levelUpOccurred = true;
      }

      // ユーザーのXPとレベルを更新
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
        },
      });

      // レベルアップしたかどうかをレスポンスに含める（UIで通知するためなど）
      return NextResponse.json({ ...checkIn, levelUpOccurred, newLevel, newXp }, { status: 200 });
    }

    return NextResponse.json(checkIn, { status: 200 }); // userが見つからない場合はXP更新なしで返す
  } catch (error) {
    console.error("チェックインの作成/更新およびXP/レベル計算エラー:", error);
    return NextResponse.json({ error: "チェックインの作成/更新に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETEリクエストハンドラー (チェックインの解除とXPの減算)
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

    // 既にisCompletedがfalseの場合はXPを減算しない
    const existingCheckIn = await prisma.checkIn.findUnique({
        where: {
            userId_habitId_date: {
                userId: userId,
                habitId: habitId,
                date: utcDate,
            },
        },
        select: {
            isCompleted: true,
        }
    });

    if (!existingCheckIn || !existingCheckIn.isCompleted) {
        return NextResponse.json({ message: "削除対象のチェックインが見つからないか、既に解除済みです。" }, { status: 404 });
    }


    // isCompleted を false に更新
    const updatedCheckIn = await prisma.checkIn.updateMany({
      where: {
        habitId: habitId,
        date: utcDate,
        userId: userId,
      },
      data: {
        isCompleted: false,
      },
    });

    if (updatedCheckIn.count === 0) {
      return NextResponse.json({ message: "チェックインが見つかりませんでした。" }, { status: 404 });
    }

    // ここからXPの減算ロジック
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (user) {
      let newXp = Math.max(0, user.xp - XP_PER_CHECKIN);
      let newLevel = user.level;

      // ユーザーのXPを更新
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel, // レベルは変更しない
        },
      });
    }

    return NextResponse.json({ message: "チェックインが正常に解除されました。" }, { status: 200 });
  } catch (error) {
    console.error("チェックインの解除およびXP減算エラー:", error);
    return NextResponse.json({ error: "チェックインの解除に失敗しました。" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GETリクエストハンドラー (特定の日の特定の習慣のチェックイン状態を取得)
// 変更なし
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
                userId_habitId_date: {
                    userId: userId,
                    habitId: habitId,
                    date: utcDate,
                },
            },
            select: {
                isCompleted: true,
            }
        });

        return NextResponse.json({ isCheckedIn: checkIn?.isCompleted || false }, { status: 200 });
    } catch (error) {
        console.error("チェックイン状態の取得エラー:", error);
        return NextResponse.json({ error: "チェックイン状態の取得に失敗しました。" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}