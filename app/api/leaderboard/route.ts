import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Verdict, Role } from "@prisma/client";

export async function GET() {
    const users = await prisma.user.findMany({
        where: { role: Role.user, isActive: true },
        select: {
            id: true,
            username: true,
            joinDate: true,
            currentStreak: true,
            longestStreak: true,
        },
        orderBy: { joinDate: "asc" },
    });

    const userIds = users.map((u) => u.id);

    const submissionsAgg = await prisma.submission.groupBy({
        by: ["userId", "verdict"],
        where: { userId: { in: userIds } },
        _count: { _all: true },
    });

    const solvedAgg = await prisma.userProblemStatus.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, isSolved: true },
        _count: { _all: true },
    });

    const totalByUser = new Map<string, number>();
    const acceptedByUser = new Map<string, number>();
    for (const row of submissionsAgg) {
        totalByUser.set(
            row.userId,
            (totalByUser.get(row.userId) || 0) + row._count._all,
        );
        if (row.verdict === Verdict.Accepted) {
            acceptedByUser.set(
                row.userId,
                (acceptedByUser.get(row.userId) || 0) + row._count._all,
            );
        }
    }

    const solvedByUser = new Map(
        solvedAgg.map((r) => [r.userId, r._count._all] as const),
    );

    const leaderboard = users
        .map((u) => {
            const totalSubmissions = totalByUser.get(u.id) || 0;
            const acceptedSubmissions = acceptedByUser.get(u.id) || 0;
            const acceptanceRate =
                totalSubmissions > 0
                    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
                    : 0;

            return {
                id: u.id,
                username: u.username,
                totalSolved: solvedByUser.get(u.id) || 0,
                totalSubmissions,
                acceptanceRate,
                currentStreak: u.currentStreak,
                longestStreak: u.longestStreak,
            };
        })
        .sort((a, b) => {
            if (b.totalSolved !== a.totalSolved)
                return b.totalSolved - a.totalSolved;
            if (b.acceptanceRate !== a.acceptanceRate)
                return b.acceptanceRate - a.acceptanceRate;
            return b.longestStreak - a.longestStreak;
        });

    return NextResponse.json(leaderboard);
}
