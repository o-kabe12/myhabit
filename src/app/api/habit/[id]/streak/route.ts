import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const habitId = pathParts[pathParts.length - 2];

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: userId,
        habitId: habitId,
        isCompleted: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
    // streak計算ロジック（省略）
    return NextResponse.json({ streak: checkIns.length }, { status: 200 });
  } catch (error) {
    console.error("streak取得エラー:", error);
    return NextResponse.json({ error: "streakの取得に失敗しました。" }, { status: 500 });
  }
}