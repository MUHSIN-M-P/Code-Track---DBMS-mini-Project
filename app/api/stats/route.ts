import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTopicPerformance, getUserStats, getPlatformStats, getHeatmapData } from "@/lib/analytics";
import { Verdict } from "@prisma/client";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            preferredLang: true,
            currentStreak: true,
            longestStreak: true,
            role: true,
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [userStats, topics, recent, heatmap] = await Promise.all([
        getUserStats(userId),
        getTopicPerformance(userId),
        prisma.submission.findMany({
            where: { userId },
            include: {
                problem: {
                    select: { id: true, title: true, difficulty: true },
                },
            },
            orderBy: { submittedAt: "desc" },
            take: 10,
        }),
        getHeatmapData(userId),
    ]);

    const recentSubmissions = recent.map((s) => ({
        id: s.id,
        problemId: s.problemId,
        problemTitle: s.problem.title,
        difficulty: s.problem.difficulty,
        language: s.language,
        verdict: s.verdict,
        submittedAt: s.submittedAt,
        isAccepted: s.verdict === Verdict.Accepted,
    }));

    return NextResponse.json({
        user: {
            id: user.id,
            username: user.username,
            preferredLang: user.preferredLang,
            currentStreak: userStats.currentStreak,
            longestStreak: userStats.longestStreak,
        },
        stats: userStats,
        platformStats: user.role === "admin" ? await getPlatformStats() : undefined,
        topics,
        recentSubmissions,
        heatmap,
    });
}
