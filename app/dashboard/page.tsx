"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  BarChart2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  TrendingUp,
  Target
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";

interface DashboardData {
  cfInfo?: {
    handle: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    titlePhoto?: string;
  };
  cfStats?: {
    totalSolved: number;
    totalSubmissions: number;
    acceptanceRate: number;
    tagsStats: Record<string, { attempted: number; solved: number }>;
    weakTopics: string[];
  };
  lcStats?: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    acceptanceRate: number;
  };
  recentSubmissions: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    const userId = (session.user as { id: string }).id;

    fetch(`/api/stats?userId=${userId}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin text-blue-600"></div>
      </div>
    );
  }

  // If both handles are missing, prompt user to connect them
  if (!data?.cfInfo && !data?.lcStats) {
    return (
      <div className="container mx-auto px-6 py-16 text-center max-w-2xl">
        <div className="w-20 h-20 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
          <LinkIcon className="text-blue-600 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Platforms</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          CodeTrack visualizes your journey across competitive programming platforms.
          To see your unified dashboard, please connect your Codeforces or LeetCode handles.
        </p>
        <Link href="/profile" className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-500/25">
          Go to Profile Settings
        </Link>
      </div>
    );
  }

  // ── Combined Stats ──
  const cfSolved = data?.cfStats?.totalSolved || 0;
  const lcSolved = data?.lcStats?.totalSolved || 0;
  const totalSolved = cfSolved + lcSolved;

  const cfSubmissions = data?.cfStats?.totalSubmissions || 0;
  const lcEasy = data?.lcStats?.easySolved || 0;
  const lcMedium = data?.lcStats?.mediumSolved || 0;
  const lcHard = data?.lcStats?.hardSolved || 0;

  // Combined acceptance rate (weighted average)
  let avgAcceptance = 0;
  const rates: number[] = [];
  if (data?.cfStats) rates.push(data.cfStats.acceptanceRate);
  if (data?.lcStats) rates.push(data.lcStats.acceptanceRate);
  if (rates.length > 0) avgAcceptance = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);

  // Platforms connected count
  const platformsConnected = (data?.cfInfo ? 1 : 0) + (data?.lcStats ? 1 : 0);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl bg-gray-50 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Overview
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Combined analytics across {platformsConnected} connected platform{platformsConnected > 1 ? "s" : ""}.
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Problems Solved (Combined) */}
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Solved</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalSolved}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {cfSolved > 0 && `CF: ${cfSolved}`}{cfSolved > 0 && lcSolved > 0 && " · "}{lcSolved > 0 && `LC: ${lcSolved}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Codeforces Rating */}
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">CF Rating</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900">{data?.cfInfo?.rating || "—"}</h3>
                {data?.cfInfo?.maxRating && (
                  <span className="text-xs text-gray-500 font-medium">Max: {data.cfInfo.maxRating}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Total Submissions */}
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">CF Submissions</p>
              <h3 className="text-2xl font-bold text-gray-900">{cfSubmissions}</h3>
            </div>
          </div>
        </Card>

        {/* Combined Acceptance Rate */}
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Acceptance</p>
              <h3 className="text-2xl font-bold text-gray-900">{avgAcceptance}%</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Topic Stats & Weak Topics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Topics Performance */}
          {data?.cfStats && Object.keys(data.cfStats.tagsStats).length > 0 && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-gray-200 pb-4">
                <CardTitle>Topic Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  {Object.entries(data.cfStats.tagsStats)
                    .sort((a, b) => b[1].solved - a[1].solved)
                    .slice(0, 8)
                    .map(([tag, stats]) => {
                      const acc = Math.round((stats.solved / stats.attempted) * 100);
                      return (
                        <div key={tag}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-gray-700 capitalize">{tag.replace(/-/g, ' ')}</span>
                            <span className="text-gray-600 font-medium">{acc}% ({stats.solved}/{stats.attempted})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${acc < 40 ? 'bg-red-500' : acc > 70 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${acc}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weak Topics */}
          {data?.cfStats?.weakTopics && data.cfStats.weakTopics.length > 0 && (
            <Card className="border-l-4 border-l-red-500 bg-red-50 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg text-red-900 mb-2">Weak Topics Detected</CardTitle>
                  <p className="text-sm text-red-700 mb-3">Your accuracy in these topics is below 40%. Consider practicing them:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.cfStats.weakTopics.map(t => (
                      <Badge key={t} color="error" size="sm" className="font-medium">
                        {t.replace(/-/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Difficulty Breakdown & Recent Activity */}
        <div className="space-y-8">

          {/* Combined Difficulty Breakdown */}
          {data?.lcStats && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-gray-200 pb-4">
                <CardTitle className="text-lg">Difficulty Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-semibold">Easy</span>
                    <span className="text-green-900 font-bold text-lg">{lcEasy}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-700 font-semibold">Medium</span>
                    <span className="text-yellow-900 font-bold text-lg">{lcMedium}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700 font-semibold">Hard</span>
                    <span className="text-red-900 font-bold text-lg">{lcHard}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Breakdown */}
          {cfSolved > 0 && lcSolved > 0 && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-gray-200 pb-4">
                <CardTitle className="text-lg">Platform Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Visual bar */}
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-200">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${Math.round((cfSolved / totalSolved) * 100)}%` }}
                    ></div>
                    <div
                      className="bg-yellow-500 h-full transition-all"
                      style={{ width: `${Math.round((lcSolved / totalSolved) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-gray-700 font-medium">Codeforces</span>
                      <span className="text-gray-500">{cfSolved}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-700 font-medium">LeetCode</span>
                      <span className="text-gray-500">{lcSolved}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-gray-200 pb-4">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <div className="divide-y divide-gray-200">
              {data?.recentSubmissions?.length > 0 ? (
                data.recentSubmissions.map((sub, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {sub.verdict === "OK" ? (
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} className="text-green-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                          <XCircle size={16} className="text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                          {sub.problemName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{sub.timeAgo}</span>
                          <span>•</span>
                          <span>{sub.programmingLanguage}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 ml-4">
                      <Badge color={sub.verdict === "OK" ? "success" : "error"} size="sm">
                        {sub.verdict === "OK" ? "AC" : (sub.verdict === "TIME_LIMIT_EXCEEDED" ? "TLE" : (sub.verdict === "WRONG_ANSWER" ? "WA" : sub.verdict))}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No recent submissions found.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
