import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateStreak } from "@/lib/streak";
import { Verdict } from "@prisma/client";

function normalizeVerdict(input: string): Verdict | null {
    // Accept both the SDD-style labels and legacy UI values.
    const v = String(input || "").trim();
    if (!v) return null;

    const legacyMap: Record<string, Verdict> = {
        ACCEPTED: Verdict.Accepted,
        AC: Verdict.Accepted,
        WRONG_ANSWER: Verdict.WrongAnswer,
        WA: Verdict.WrongAnswer,
        TLE: Verdict.TimeLimitExceeded,
        TIME_LIMIT_EXCEEDED: Verdict.TimeLimitExceeded,
        RUNTIME_ERROR: Verdict.RuntimeError,
        RE: Verdict.RuntimeError,
        COMPILATION_ERROR: Verdict.CompilationError,
        CE: Verdict.CompilationError,
    };

    if (legacyMap[v]) return legacyMap[v];

    // Try matching exact SDD labels.
    if (v === "Accepted") return Verdict.Accepted;
    if (v === "Wrong Answer") return Verdict.WrongAnswer;
    if (v === "Time Limit Exceeded") return Verdict.TimeLimitExceeded;
    if (v === "Runtime Error") return Verdict.RuntimeError;
    if (v === "Compilation Error") return Verdict.CompilationError;

    return null;
}

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
            user: { select: { id: true, username: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 100,
    });

    return NextResponse.json(submissions);
}

export async function POST(req: Request) {
    try {
        const { userId, problemId, language, verdict, contestId } =
            await req.json();

        if (!userId || !problemId || !language || !verdict) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 },
            );
        }

        const normalizedVerdict = normalizeVerdict(verdict);
        if (!normalizedVerdict) {
            return NextResponse.json(
                { error: "Invalid verdict" },
                { status: 400 },
            );
        }

        const now = new Date();

        if (contestId) {
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

            // Prevent simultaneous participation in overlapping contests (SDD 2.3).
            const overlapping = await prisma.contestRegistration.findFirst({
                where: {
                    userId,
                    contestId: { not: contestId },
                    contest: {
                        startTime: { lt: contest.endTime },
                        endTime: { gt: contest.startTime },
                    },
                },
                select: { contestId: true },
            });
            if (overlapping) {
                return NextResponse.json(
                    {
                        error: "Already registered in another overlapping contest",
                    },
                    { status: 403 },
                );
            }

            const inContest = await prisma.contestProblem.findUnique({
                where: { contestId_problemId: { contestId, problemId } },
                select: { contestId: true },
            });
            if (!inContest) {
                return NextResponse.json(
                    { error: "Problem is not part of this contest" },
                    { status: 403 },
                );
            }
        }

        const submission = await prisma.$transaction(async (tx) => {
            const problem = await tx.problem.findUnique({
                where: { id: problemId },
                select: { id: true, topics: { select: { topicId: true } } },
            });
            if (!problem) {
                throw new Error("PROBLEM_NOT_FOUND");
            }

            const existingStatus = await tx.userProblemStatus.findUnique({
                where: { userId_problemId: { userId, problemId } },
                select: { isSolved: true },
            });

            const isFirstAttempt = !existingStatus;
            const isNewSolve =
                normalizedVerdict === Verdict.Accepted &&
                (!existingStatus || !existingStatus.isSolved);

            const created = await tx.submission.create({
                data: {
                    userId,
                    problemId,
                    language,
                    verdict: normalizedVerdict,
                    contestId,
                    submittedAt: now,
                },
            });

            await tx.problem.update({
                where: { id: problemId },
                data: {
                    totalSubmissions: { increment: 1 },
                    ...(normalizedVerdict === Verdict.Accepted
                        ? { totalAccepted: { increment: 1 } }
                        : {}),
                },
            });

            if (!existingStatus) {
                await tx.userProblemStatus.create({
                    data: {
                        userId,
                        problemId,
                        isSolved: normalizedVerdict === Verdict.Accepted,
                        firstAcceptedAt:
                            normalizedVerdict === Verdict.Accepted ? now : null,
                    },
                });
            } else if (isNewSolve) {
                await tx.userProblemStatus.update({
                    where: { userId_problemId: { userId, problemId } },
                    data: { isSolved: true, firstAcceptedAt: now },
                });
            }

            if (problem.topics.length > 0 && (isFirstAttempt || isNewSolve)) {
                await Promise.all(
                    problem.topics.map(({ topicId }) =>
                        tx.topicPerformance.upsert({
                            where: { userId_topicId: { userId, topicId } },
                            update: {
                                ...(isFirstAttempt
                                    ? { attempted: { increment: 1 } }
                                    : {}),
                                ...(isNewSolve
                                    ? { solved: { increment: 1 } }
                                    : {}),
                            },
                            create: {
                                userId,
                                topicId,
                                attempted: isFirstAttempt ? 1 : 0,
                                solved: isNewSolve ? 1 : 0,
                            },
                        }),
                    ),
                );
            }

            return created;
        });

        if (normalizedVerdict === Verdict.Accepted) {
            await updateStreak(userId);
        }

        return NextResponse.json(submission, { status: 201 });
    } catch (e: any) {
        if (e?.message === "PROBLEM_NOT_FOUND") {
            return NextResponse.json(
                { error: "Problem not found" },
                { status: 404 },
            );
        }
        return NextResponse.json(
            { error: "Failed to create submission" },
            { status: 500 },
        );
    }
}
