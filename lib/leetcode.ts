export interface LCOverview {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
}

/**
 * Fetches LeetCode user stats via the alfa-leetcode-api proxy.
 * Direct calls to leetcode.com/graphql are blocked server-side (CORS/anti-bot),
 * so we use this reliable public proxy instead.
 */
export async function getLCStats(username: string): Promise<LCOverview | null> {
  try {
    const res = await fetch(
      `https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 }, // cache for 5 minutes in Next.js
      }
    );

    if (!res.ok) {
      console.error(`LeetCode proxy returned ${res.status} for user: ${username}`);
      return null;
    }

    const data = await res.json();

    // The proxy returns flat fields: totalSolved, easySolved, mediumSolved, hardSolved
    // and also matchedUserStats.acSubmissionNum for detailed submission counts
    if (data.totalSolved === undefined) return null;

    const totalSolved = data.totalSolved || 0;
    const easySolved = data.easySolved || 0;
    const mediumSolved = data.mediumSolved || 0;
    const hardSolved = data.hardSolved || 0;

    // Compute acceptance rate from matchedUserStats if available
    let acceptanceRate = 0;
    if (data.matchedUserStats?.acSubmissionNum && data.matchedUserStats?.totalSubmissionNum) {
      const totalAC = data.matchedUserStats.acSubmissionNum.find(
        (s: any) => s.difficulty === "All"
      );
      const totalSub = data.matchedUserStats.totalSubmissionNum.find(
        (s: any) => s.difficulty === "All"
      );
      if (totalAC && totalSub && totalSub.submissions > 0) {
        acceptanceRate = Math.round((totalAC.submissions / totalSub.submissions) * 100);
      }
    }

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      acceptanceRate,
    };
  } catch (error) {
    console.error("Error fetching LeetCode stats:", error);
    return null;
  }
}
