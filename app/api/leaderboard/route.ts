import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type LeaderboardRow = {
    id: string;
    username: string;
    totalSolved: number;
    totalSubmissions: number;
    acceptanceRate: number;
    currentStreak: number;
    longestStreak: number;
    percentRank: number;
    globalPercentile: number;
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const topPercentParam = searchParams.get("topPercent");
    const topPercentRaw = topPercentParam ? Number(topPercentParam) : null;
    const topPercent =
        topPercentRaw && Number.isFinite(topPercentRaw)
            ? Math.max(1, Math.min(100, topPercentRaw))
            : null;

    const topFraction = topPercent ? topPercent / 100 : null;

    const whereClause = topFraction
        ? Prisma.sql`WHERE "percentRank" <= ${topFraction}`
        : Prisma.empty;

    const rows = await prisma.$queryRaw<LeaderboardRow[]>`
        WITH base_users AS (
            SELECT u.id, u.username, u."currentStreak", u."longestStreak"
            FROM "users" u
            WHERE u.role = 'user'::role AND u."isActive" = true
        ),
        solved AS (
            SELECT ups."userId" AS id, COUNT(*)::int AS "totalSolved"
            FROM "user_problem_status" ups
            WHERE ups."isSolved" = true
            GROUP BY ups."userId"
        ),
        subs AS (
            SELECT s."userId" AS id,
                   COUNT(*)::int AS "totalSubmissions",
                   SUM(CASE WHEN s.verdict = 'Accepted'::verdict THEN 1 ELSE 0 END)::int AS "acceptedSubmissions"
            FROM "submissions" s
            GROUP BY s."userId"
        ),
        ranked AS (
            SELECT
                bu.id,
                bu.username,
                COALESCE(solved."totalSolved", 0)::int AS "totalSolved",
                COALESCE(subs."totalSubmissions", 0)::int AS "totalSubmissions",
                CASE
                    WHEN COALESCE(subs."totalSubmissions", 0) = 0 THEN 0
                    ELSE ROUND((COALESCE(subs."acceptedSubmissions", 0)::numeric / subs."totalSubmissions") * 100)::int
                END AS "acceptanceRate",
                bu."currentStreak"::int AS "currentStreak",
                bu."longestStreak"::int AS "longestStreak",
                PERCENT_RANK() OVER (ORDER BY COALESCE(solved."totalSolved", 0) DESC) AS "percentRank"
            FROM base_users bu
            LEFT JOIN solved ON solved.id = bu.id
            LEFT JOIN subs ON subs.id = bu.id
        )
        SELECT
            id,
            username,
            "totalSolved",
            "totalSubmissions",
            "acceptanceRate",
            "currentStreak",
            "longestStreak",
            "percentRank",
            ROUND((100 - ("percentRank" * 100))::numeric, 2)::float8 AS "globalPercentile"
        FROM ranked
        ${whereClause}
        ORDER BY "totalSolved" DESC, "acceptanceRate" DESC, "longestStreak" DESC;
    `;

    return NextResponse.json(rows);
}
