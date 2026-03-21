import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const contests = await prisma.contest.findMany({
    include: {
      _count: { select: { registrations: true, problems: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json(contests);
}

export async function POST(req: Request) {
  try {
    const { title, description, startTime, duration, problemIds, createdById } =
      await req.json();

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startTime: start,
        endTime: end,
        duration,
        createdById,
        problems: {
          create: (problemIds || []).map((pid: string, i: number) => ({
            problemId: pid,
            order: i + 1,
          })),
        },
      },
      include: { problems: { include: { problem: true } } },
    });

    return NextResponse.json(contest, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create contest" }, { status: 500 });
  }
}
