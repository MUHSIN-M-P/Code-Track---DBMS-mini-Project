import { prisma } from "./prisma";

export async function getUserStats(userId: string) {
  const totalSubmissions = await prisma.submission.count({
    where: { userId },
  });

  const acceptedSubmissions = await prisma.submission.count({
    where: { userId, verdict: "ACCEPTED" },
  });

  const solvedProblems = await prisma.submission.findMany({
    where: { userId, verdict: "ACCEPTED" },
    distinct: ["problemId"],
    select: { problemId: true },
  });

  const streak = await prisma.streak.findUnique({ where: { userId } });

  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

  return {
    totalSolved: solvedProblems.length,
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate,
    currentStreak: streak?.currentStreak || 0,
    longestStreak: streak?.longestStreak || 0,
  };
}

export async function getTopicPerformance(userId: string) {
  const topics = await prisma.topic.findMany({
    include: {
      problems: {
        include: {
          problem: {
            include: {
              submissions: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  return topics.map((topic) => {
    const problems = topic.problems.map((pt) => pt.problem);
    const attempted = problems.filter((p) => p.submissions.length > 0).length;
    const solved = problems.filter((p) =>
      p.submissions.some((s) => s.verdict === "ACCEPTED")
    ).length;
    const total = problems.length;

    return {
      topicId: topic.id,
      topicName: topic.name,
      total,
      attempted,
      solved,
      percentage: total > 0 ? Math.round((solved / total) * 100) : 0,
    };
  });
}

export async function getContestLeaderboard(contestId: string) {
  const registrations = await prisma.contestRegistration.findMany({
    where: { contestId },
    include: {
      user: { select: { id: true, name: true } },
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
          verdict: "ACCEPTED",
        },
        distinct: ["problemId"],
        orderBy: { submittedAt: "asc" },
      });

      const penaltyTime = submissions.reduce((total, sub) => {
        const diff = sub.submittedAt.getTime() - contest.startTime.getTime();
        return total + Math.floor(diff / 60000);
      }, 0);

      return {
        userId: reg.user.id,
        userName: reg.user.name,
        problemsSolved: submissions.length,
        penaltyTime,
      };
    })
  );

  return leaderboard.sort((a, b) => {
    if (b.problemsSolved !== a.problemsSolved)
      return b.problemsSolved - a.problemsSolved;
    return a.penaltyTime - b.penaltyTime;
  });
}
