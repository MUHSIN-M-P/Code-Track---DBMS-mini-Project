import { prisma } from "./prisma";
import { Verdict } from "@prisma/client";

export async function getUserStats(userId: string) {
    const totalSubmissions = await prisma.submission.count({
        where: { userId },
    });

    const acceptedSubmissions = await prisma.submission.count({
        where: { userId, verdict: Verdict.Accepted },
    });

    const solvedProblems = await prisma.submission.findMany({
        where: { userId, verdict: Verdict.Accepted },
        distinct: ["problemId"],
        select: { problemId: true },
    });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true },
    });

    const acceptanceRate =
        totalSubmissions > 0
            ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
            : 0;

    return {
        totalSolved: solvedProblems.length,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        currentStreak: user?.currentStreak || 0,
        longestStreak: user?.longestStreak || 0,
    };
}

export async function getPlatformStats() {
    const totalUsers = await prisma.user.count();
    const totalSubmissions = await prisma.submission.count();
    const acceptedSubmissions = await prisma.submission.count({
        where: { verdict: Verdict.Accepted },
    });
    const totalProblems = await prisma.problem.count();

    const acceptanceRate =
        totalSubmissions > 0
            ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
            : 0;

    return {
        totalUsers,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        totalProblems,
    };
}

export async function getTopicPerformance(userId: string) {
    const topics = await prisma.topic.findMany({ orderBy: { name: "asc" } });
    const perfRows = await prisma.topicPerformance.findMany({
        where: { userId },
        select: { topicId: true, attempted: true, solved: true },
    });

    const perfByTopicId = new Map(perfRows.map((p) => [p.topicId, p] as const));

    return topics.map((topic) => {
        const perf = perfByTopicId.get(topic.id);
        return {
            topicId: topic.id,
            topicName: topic.name,
            attempted: perf?.attempted || 0,
            solved: perf?.solved || 0,
        };
    });
}

export async function getContestLeaderboard(contestId: string) {
    const registrations = await prisma.contestRegistration.findMany({
        where: { contestId },
        include: {
            user: { select: { id: true, username: true } },
        },
    });

    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        include: { problems: true },
    });

    if (!contest) return [];

    const leaderboard = await Promise.all(
        registrations.map(async (reg) => {
            const submissions = await prisma.submission.findMany({
                where: {
                    userId: reg.userId,
                    contestId,
                    verdict: Verdict.Accepted,
                },
                distinct: ["problemId"],
                orderBy: { submittedAt: "asc" },
            });

            const penaltyTime = submissions.reduce((total, sub) => {
                const diff =
                    sub.submittedAt.getTime() - contest.startTime.getTime();
                return total + Math.floor(diff / 60000);
            }, 0);

            return {
                userId: reg.user.id,
                userName: reg.user.username,
                problemsSolved: submissions.length,
                penaltyTime,
            };
        }),
    );

    return leaderboard.sort((a, b) => {
        if (b.problemsSolved !== a.problemsSolved)
            return b.problemsSolved - a.problemsSolved;
        return a.penaltyTime - b.penaltyTime;
    });
}
