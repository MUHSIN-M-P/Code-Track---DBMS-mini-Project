import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
        if (!name || !String(name).trim()) {
            return NextResponse.json(
                { error: "Topic name cannot be empty" },
                { status: 400 },
            );
        }
        const topic = await prisma.topic.create({ data: { name: String(name).trim() } });
        return NextResponse.json(topic, { status: 201 });
    } catch (e) {
        // Prisma unique constraint violation (duplicate name)
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return NextResponse.json(
                { error: "A topic with this name already exists" },
                { status: 409 },
            );
        }
        return NextResponse.json(
            { error: "Failed to create topic" },
            { status: 500 },
        );
    }
}
