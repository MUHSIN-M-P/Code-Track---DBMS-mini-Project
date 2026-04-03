import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const topics = await prisma.topic.findMany({
        include: { _count: { select: { problems: true } } },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(topics);
}

export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json(
                { error: "Missing name" },
                { status: 400 },
            );
        }
        const topic = await prisma.topic.create({ data: { name } });
        return NextResponse.json(topic, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Failed to create topic" },
            { status: 500 },
        );
    }
}
