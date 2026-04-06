import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: contestId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true, startTime: true, endTime: true },
    });
    if (!contest) {
        return NextResponse.json(
            { error: "Contest not found" },
            { status: 404 },
        );
    }

    const now = new Date();
    if (now < new Date(contest.startTime)) {
        return NextResponse.json(
            { error: "Contest has not started" },
            { status: 403 },
        );
    }
    if (now > new Date(contest.endTime)) {
        return NextResponse.json(
            { error: "Contest has ended" },
            { status: 403 },
        );
    }

    const registration = await prisma.contestRegistration.findUnique({
        where: { userId_contestId: { userId, contestId } },
        select: { userId: true },
    });
    if (!registration) {
        return NextResponse.json(
            { error: "Not registered for this contest" },
            { status: 403 },
        );
    }

    const contestProblems = await prisma.contestProblem.findMany({
        where: { contestId },
        select: { problemId: true, order: true },
        orderBy: { order: "asc" },
    });

    if (contestProblems.length === 0) {
        return NextResponse.json(
            { error: "No problems configured for this contest" },
            { status: 400 },
        );
    }

    const problemIds = contestProblems.map((p) => p.problemId);

    const statuses = await prisma.userProblemStatus.findMany({
        where: { userId, problemId: { in: problemIds }, isSolved: true },
        select: { problemId: true },
    });
    const solved = new Set(statuses.map((s) => s.problemId));

    const next = contestProblems.find((p) => !solved.has(p.problemId));

    return NextResponse.json({
        contestId,
        problemId: next?.problemId ?? null,
        allSolved: !next,
    });
}
