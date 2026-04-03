import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const contest = await prisma.contest.findUnique({
        where: { id },
        include: {
            problems: {
                include: {
                    problem: {
                        include: { topics: { include: { topic: true } } },
                    },
                },
                orderBy: { order: "asc" },
            },
            registrations: {
                include: { user: { select: { id: true, username: true } } },
            },
            createdBy: { select: { username: true } },
            _count: { select: { registrations: true } },
        },
    });

    if (!contest)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    if (now < new Date(contest.startTime)) {
        return NextResponse.json({
            ...contest,
            problems: [],
        });
    }

    return NextResponse.json(contest);
}

export async function DELETE(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    await prisma.contest.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
}
