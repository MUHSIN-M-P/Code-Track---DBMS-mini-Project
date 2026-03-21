import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCFSubmissions, getCFUserInfo, processCFStats } from "@/lib/codeforces";
import { getLCStats } from "@/lib/leetcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { codeforcesHandle: true, leetcodeHandle: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 1. Fetch Codeforces
  let cfStats = null;
  let cfSubmissions = [] as any[];
  let cfInfo = null;
  if (user.codeforcesHandle) {
    const handle = user.codeforcesHandle;
    cfInfo = await getCFUserInfo(handle);
    cfSubmissions = await getCFSubmissions(handle);
    cfStats = processCFStats(cfSubmissions);

    // Identify weak topics where acceptance < 40% and attempted > 3
    const weakTopics = Object.entries(cfStats.tagsStats)
      .filter(([_, data]) => data.attempted > 3 && (data.solved / data.attempted) < 0.4)
      .map(([tag]) => tag);

    cfStats = { ...cfStats, weakTopics };
  }

  // 2. Fetch LeetCode
  let lcStats = null;
  if (user.leetcodeHandle) {
    lcStats = await getLCStats(user.leetcodeHandle);
  }

  // Transform recent submissions to match UI expectations
  const transformedRecentSubmissions = cfSubmissions.slice(0, 10).map((sub: any) => {
    const timeAgo = formatTimeAgo(sub.creationTimeSeconds);
    return {
      problemName: sub.problem.name,
      timeAgo,
      programmingLanguage: sub.programmingLanguage,
      verdict: sub.verdict,
    };
  });

  // Return unified format
  return NextResponse.json({
    cfStats,
    cfInfo,
    lcStats,
    recentSubmissions: transformedRecentSubmissions,
  });
}

// Helper function to convert unix timestamp to "time ago" format
function formatTimeAgo(timestampSeconds: number): string {
  const now = Date.now();
  const submissionTime = timestampSeconds * 1000; // Convert to milliseconds
  const diffMs = now - submissionTime;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}
