import { prisma } from "./prisma";
import { Verdict } from "@prisma/client";

export async function evaluateStreak(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true },
    });

    if (!user) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = user.currentStreak;
    const longestStreak = user.longestStreak;

    if (currentStreak > 0) {
        const latestAC = await prisma.submission.findFirst({
            where: { userId, verdict: Verdict.Accepted },
            orderBy: { submittedAt: "desc" },
        });

        if (latestAC) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const lastACDate = new Date(latestAC.submittedAt);
            lastACDate.setUTCHours(0, 0, 0, 0);

            const diffInDays =
                (today.getTime() - lastACDate.getTime()) / (1000 * 3600 * 24);

            if (diffInDays > 1) {
                currentStreak = 0;
                await prisma.user.update({
                    where: { id: userId },
                    data: { currentStreak: 0 },
                });
            }
        } else {
            currentStreak = 0;
            await prisma.user.update({
                where: { id: userId },
                data: { currentStreak: 0 },
            });
        }
    }

    return { currentStreak, longestStreak };
}

export async function getHeatmapData(userId: string) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setUTCHours(0, 0, 0, 0);

    const submissions = await prisma.submission.findMany({
        where: {
            userId,
            submittedAt: { gte: oneYearAgo },
            verdict: Verdict.Accepted,
        },
        select: { submittedAt: true },
    });

    const counts = new Map<string, number>();
    for (const sub of submissions) {
        const dateStr = sub.submittedAt.toISOString().split("T")[0];
        counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([date, count]) => ({
        date,
        count,
    }));
}

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
        select: {
            problemId: true,
            problem: { select: { difficulty: true } },
        },
    });

    const difficultyDistribution = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
    };

    solvedProblems.forEach((sub) => {
        if (sub.problem?.difficulty) {
            difficultyDistribution[sub.problem.difficulty] =
                (difficultyDistribution[sub.problem.difficulty] || 0) + 1;
        }
    });

    const { currentStreak, longestStreak } = await evaluateStreak(userId);

    const acceptanceRate =
        totalSubmissions > 0
            ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
            : 0;

    return {
        totalSolved: solvedProblems.length,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        currentStreak,
        longestStreak,
        difficultyDistribution,
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
