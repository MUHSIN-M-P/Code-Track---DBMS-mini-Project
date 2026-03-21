import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;
  if (difficulty) where.difficulty = difficulty;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  try {
    const problems = await prisma.platformProblem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(problems);
  } catch (error) {
    console.error("Error fetching platform problems:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, platform, platformId, difficulty, url } = await req.json();

    const problem = await prisma.platformProblem.create({
      data: {
        title,
        platform,
        platformId,
        difficulty: difficulty || "MEDIUM",
        url,
      },
    });

    return NextResponse.json(problem, { status: 201 });
  } catch (error) {
    console.error("Error creating platform problem:", error);
    return NextResponse.json({ error: "Failed to create problem" }, { status: 500 });
  }
}
