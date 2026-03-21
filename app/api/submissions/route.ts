import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateStreak } from "@/lib/streak";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const problemId = searchParams.get("problemId");
  const contestId = searchParams.get("contestId");

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (problemId) where.problemId = problemId;
  if (contestId) where.contestId = contestId;

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      problem: { select: { id: true, title: true, difficulty: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(submissions);
}

export async function POST(req: Request) {
  try {
    const { userId, problemId, language, verdict, contestId } = await req.json();

    if (!userId || !problemId || !language || !verdict) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (contestId) {
      const contest = await prisma.contest.findUnique({ where: { id: contestId } });
      if (contest && new Date() > new Date(contest.endTime)) {
        return NextResponse.json({ error: "Contest has ended" }, { status: 403 });
      }
    }

    const submission = await prisma.submission.create({
      data: { userId, problemId, language, verdict, contestId },
    });

    if (verdict === "ACCEPTED") {
      await updateStreak(userId);
    }

    return NextResponse.json(submission, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
