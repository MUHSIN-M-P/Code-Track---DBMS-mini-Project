import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      problems: {
        include: { problem: { include: { topics: { include: { topic: true } } } } },
        orderBy: { order: "asc" },
      },
      registrations: { include: { user: { select: { id: true, name: true } } } },
      createdBy: { select: { name: true } },
      _count: { select: { registrations: true } },
    },
  });

  if (!contest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contest);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contest.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
