import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        const { userId } = await req.json();

        const targetContest = await prisma.contest.findUnique({
            where: { id },
            select: { id: true, startTime: true, endTime: true },
        });
        if (!targetContest) {
            return NextResponse.json(
                { error: "Contest not found" },
                { status: 404 },
            );
        }

        const existing = await prisma.contestRegistration.findUnique({
            where: { userId_contestId: { userId, contestId: id } },
        });
        if (existing) {
            return NextResponse.json(
                { error: "Already registered" },
                { status: 409 },
            );
        }

        const overlapping = await prisma.contestRegistration.findFirst({
            where: {
                userId,
                contestId: { not: id },
                contest: {
                    startTime: { lt: targetContest.endTime },
                    endTime: { gt: targetContest.startTime },
                },
            },
            select: { contestId: true },
        });
        if (overlapping) {
            return NextResponse.json(
                { error: "Registration overlaps with another contest" },
                { status: 403 },
            );
        }

        const registration = await prisma.contestRegistration.create({
            data: { userId, contestId: id },
        });

        return NextResponse.json(registration, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Registration failed" },
            { status: 500 },
        );
    }
}
