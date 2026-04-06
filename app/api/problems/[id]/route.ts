import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Difficulty, Verdict } from "@prisma/client";

function normalizeDifficulty(input: string): Difficulty | null {
    const v = String(input || "").trim();
    if (v === "Easy" || v === "EASY") return Difficulty.Easy;
    if (v === "Medium" || v === "MEDIUM") return Difficulty.Medium;
    if (v === "Hard" || v === "HARD") return Difficulty.Hard;
    return null;
}

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const problem = await prisma.problem.findUnique({
        where: { id },
        include: {
            topics: { include: { topic: true } },
            submissions: {
                select: {
                    id: true,
                    verdict: true,
                    language: true,
                    submittedAt: true,
                    userId: true,
                },
                orderBy: { submittedAt: "desc" },
            },
        },
    });
    if (!problem)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalSubs = problem.submissions.length;
    const accepted = problem.submissions.filter(
        (s) => s.verdict === Verdict.Accepted,
    ).length;
    const uniqueSolvers = new Set(
        problem.submissions
            .filter((s) => s.verdict === Verdict.Accepted)
            .map((s) => s.userId),
    ).size;

    return NextResponse.json({
        ...problem,
        totalSubmissions: totalSubs,
        acceptanceRate:
            totalSubs > 0 ? Math.round((accepted / totalSubs) * 100) : 0,
        solvers: uniqueSolvers,
    });
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        const { title, description, difficulty, topicIds } = await req.json();

        const normalizedDifficulty = normalizeDifficulty(difficulty);
        if (!normalizedDifficulty) {
            return NextResponse.json(
                { error: "Invalid difficulty" },
                { status: 400 },
            );
        }

        await prisma.problemTopic.deleteMany({ where: { problemId: id } });

        const problem = await prisma.problem.update({
            where: { id },
            data: {
                title,
                description,
                difficulty: normalizedDifficulty,
                topics: {
                    create: (topicIds || []).map((topicId: string) => ({
                        topicId,
                    })),
                },
            },
            include: { topics: { include: { topic: true } } },
        });

        return NextResponse.json(problem);
    } catch {
        return NextResponse.json(
            { error: "Failed to update" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    await prisma.problem.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
}
