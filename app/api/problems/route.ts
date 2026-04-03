import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Difficulty } from "@prisma/client";

function normalizeDifficulty(input: string | null): Difficulty | undefined {
    if (!input) return undefined;
    const v = input.trim();
    if (v === "Easy" || v === "EASY") return Difficulty.Easy;
    if (v === "Medium" || v === "MEDIUM") return Difficulty.Medium;
    if (v === "Hard" || v === "HARD") return Difficulty.Hard;
    return undefined;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty");
    const topicId = searchParams.get("topicId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    where.isVisible = true;
    const normalizedDifficulty = normalizeDifficulty(difficulty);
    if (normalizedDifficulty) where.difficulty = normalizedDifficulty;
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (topicId) where.topics = { some: { topicId } };

    try {
        const problems = await prisma.problem.findMany({
            where,
            include: { topics: { include: { topic: true } } },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(problems);
    } catch (error) {
        console.error("Error fetching problems:", error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { title, description, difficulty, topicIds, createdById } =
            await req.json();

        if (!title || !description || !difficulty) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 },
            );
        }

        const normalizedDifficulty = normalizeDifficulty(String(difficulty));
        if (!normalizedDifficulty) {
            return NextResponse.json(
                { error: "Invalid difficulty" },
                { status: 400 },
            );
        }

        const problem = await prisma.problem.create({
            data: {
                title,
                description,
                difficulty: normalizedDifficulty,
                createdById: createdById || null,
                topics: {
                    create: (topicIds || []).map((topicId: string) => ({
                        topicId,
                    })),
                },
            },
            include: { topics: { include: { topic: true } } },
        });

        return NextResponse.json(problem, { status: 201 });
    } catch (error) {
        console.error("Error creating problem:", error);
        return NextResponse.json(
            { error: "Failed to create problem" },
            { status: 500 },
        );
    }
}
