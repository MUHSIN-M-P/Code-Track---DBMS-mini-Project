import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const contests = await prisma.contest.findMany({
        include: {
            _count: { select: { registrations: true, problems: true } },
            createdBy: { select: { username: true } },
            ...(userId
                ? {
                      registrations: {
                          where: { userId },
                          select: { userId: true },
                      },
                  }
                : {}),
        },
        orderBy: { startTime: "desc" },
    });

    if (!userId) return NextResponse.json(contests);

    return NextResponse.json(
        contests.map(({ registrations, ...c }) => ({
            ...c,
            isRegistered: Boolean(registrations && registrations.length > 0),
        })),
    );
}

export async function POST(req: Request) {
    try {
        const { title, startTime, endTime, duration, problemIds, createdById } =
            await req.json();

        if (!title || !startTime || !createdById) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 },
            );
        }

        if (!Array.isArray(problemIds) || problemIds.length < 1) {
            return NextResponse.json(
                { error: "Select at least one problem" },
                { status: 400 },
            );
        }

        const start = new Date(startTime);
        const end = endTime
            ? new Date(endTime)
            : new Date(start.getTime() + Number(duration || 0) * 60000);

        if (
            !(end instanceof Date) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            return NextResponse.json(
                { error: "Invalid contest time window" },
                { status: 400 },
            );
        }

        const contest = await prisma.contest.create({
            data: {
                title,
                startTime: start,
                endTime: end,
                createdById,
                problems: {
                    create: problemIds.map((pid: string, i: number) => ({
                        problemId: pid,
                        order: i + 1,
                    })),
                },
            },
            include: { problems: { include: { problem: true } } },
        });

        return NextResponse.json(contest, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Failed to create contest" },
            { status: 500 },
        );
    }
}
