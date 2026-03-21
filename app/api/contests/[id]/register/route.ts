import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await req.json();

    const existing = await prisma.contestRegistration.findUnique({
      where: { userId_contestId: { userId, contestId: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }

    const activeContests = await prisma.contestRegistration.findMany({
      where: { userId },
      include: { contest: true },
    });
    const now = new Date();
    const hasActive = activeContests.some(
      (cr: any) => new Date(cr.contest.startTime) <= now && now <= new Date(cr.contest.endTime)
    );
    const targetContest = await prisma.contest.findUnique({ where: { id } });
    if (
      hasActive &&
      targetContest &&
      new Date(targetContest.startTime) <= now &&
      now <= new Date(targetContest.endTime)
    ) {
      return NextResponse.json({ error: "Already in an active contest" }, { status: 403 });
    }

    const registration = await prisma.contestRegistration.create({
      data: { userId, contestId: id },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
