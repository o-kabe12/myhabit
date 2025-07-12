import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/authOptions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  // 末尾がhabitId
  const habitId = pathParts[pathParts.length - 1];

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
      },
      select: {
        date: true,
        isCompleted: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
    return NextResponse.json(checkIns, { status: 200 });
  } catch (error) {
    console.error("チェックインカレンダー取得エラー:", error);
    return NextResponse.json({ error: "チェックインカレンダーの取得に失敗しました。" }, { status: 500 });
  }
}