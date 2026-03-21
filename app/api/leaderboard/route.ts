import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCFUserInfo } from "@/lib/codeforces";
import { getLCStats } from "@/lib/leetcode";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, name: true, codeforcesHandle: true, leetcodeHandle: true },
  });

  // Fetch updated external stats on the fly for the leaderboard
  const leaderboard = await Promise.all(
    users.map(async (u: any) => {
      let cfRating = 0;
      let totalSolved = 0;

      if (u.codeforcesHandle) {
        const cfInfo = await getCFUserInfo(u.codeforcesHandle);
        if (cfInfo) cfRating = cfInfo.rating || 0;
      }

      if (u.leetcodeHandle) {
        const lcStats = await getLCStats(u.leetcodeHandle);
        if (lcStats) totalSolved += lcStats.totalSolved;
      }

      return {
        id: u.id,
        name: u.name,
        codeforcesHandle: u.codeforcesHandle,
        cfRating,
        totalSolved,
      };
    })
  );

  // Sort by CF rating descending, then total solved
  leaderboard.sort((a, b) => {
    if (b.cfRating !== a.cfRating) return b.cfRating - a.cfRating;
    return b.totalSolved - a.totalSolved;
  });

  return NextResponse.json(leaderboard);
}
