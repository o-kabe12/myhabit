import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import HabitCalendarClient from "../../../components/HabitCalendarClient";

const prisma = new PrismaClient();

async function getHabitData(habitId: string, userId: string) {
  try {
    const habit = await prisma.habit.findUnique({
      where: {
        id: habitId,
        userId: userId,
      },
    });
    return habit;
  } catch (error) {
    console.error("Server-side habit fetch error:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

interface HabitCalendarPageProps {
  params: {
    id: string; // 習慣のID
  };
}

export default async function HabitCalendarPage({ params }: HabitCalendarPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    notFound();
  }

  const habitId = params.id;
  const userId = session.user.id;

  const habit = await getHabitData(habitId, userId);

  if (!habit) {
    notFound();
  }

  return (
    <HabitCalendarClient initialHabit={habit} habitId={habitId} />
  );
}