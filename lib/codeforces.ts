export interface CFUserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  titlePhoto?: string;
}

export interface CFSubmission {
  id: number;
  creationTimeSeconds: number;
  programmingLanguage: string;
  verdict: string;
  problem: {
    contestId: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
    tags: string[];
  };
}

export async function getCFUserInfo(handle: string): Promise<CFUserInfo | null> {
  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
    const data = await res.json();
    if (data.status === "OK") {
      return data.result[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching CF user info:", error);
    return null;
  }
}

export async function getCFSubmissions(handle: string): Promise<CFSubmission[]> {
  try {
    const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    const data = await res.json();
    if (data.status === "OK") {
      return data.result;
    }
    return [];
  } catch (error) {
    console.error("Error fetching CF user submissions:", error);
    return [];
  }
}

export function processCFStats(submissions: CFSubmission[]) {
  const solvedSet = new Set<string>();
  const tagsStats: Record<string, { attempted: number; solved: number }> = {};
  
  let totalSubmissions = 0;
  let acceptedSubmissions = 0;

  submissions.forEach((sub) => {
    const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
    const isAccepted = sub.verdict === "OK";

    totalSubmissions++;
    if (isAccepted) {
      acceptedSubmissions++;
      solvedSet.add(problemId);
    }

    sub.problem.tags.forEach(tag => {
      if (!tagsStats[tag]) tagsStats[tag] = { attempted: 0, solved: 0 };
      tagsStats[tag].attempted++;
      if (isAccepted) tagsStats[tag].solved++;
    });
  });

  const totalSolved = solvedSet.size;
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

  return {
    totalSolved,
    totalSubmissions,
    acceptanceRate,
    tagsStats
  };
}
