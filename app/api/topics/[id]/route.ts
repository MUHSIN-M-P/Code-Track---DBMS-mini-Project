import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        await prisma.topic.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete topic" },
            { status: 500 }
        );
    }
}
