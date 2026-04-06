"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/tailgrids/core/card";
import {
    Activity,
    CheckCircle2,
    Clock,
    Target,
    TrendingUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TopicPerf = {
    topicId: string;
    topicName: string;
    attempted: number;
    solved: number;
};

type RecentSubmission = {
    id: string;
    problemId: string;
    problemTitle: string;
    difficulty: string;
    language: string;
    verdict: string;
    submittedAt: string;
    isAccepted: boolean;
};

type HeatmapEntry = {
    date: string;
    count: number;
};

type DashboardData = {
    user: {
        id: string;
        username: string;
        preferredLang: string | null;
        currentStreak: number;
        longestStreak: number;
    };
    stats: {
        totalSolved: number;
        totalSubmissions: number;
        acceptedSubmissions: number;
        acceptanceRate: number;
        currentStreak: number;
        longestStreak: number;
        difficultyDistribution: {
            Easy: number;
            Medium: number;
            Hard: number;
        };
    };
    platformStats?: {
        totalUsers: number;
        totalSubmissions: number;
        acceptedSubmissions: number;
        acceptanceRate: number;
        totalProblems: number;
    };
    topics: TopicPerf[];
    recentSubmissions: RecentSubmission[];
    heatmap: HeatmapEntry[];
};

type ApiError = { error: string };

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        if (!session?.user) return;

        const userId = (session.user as { id: string }).id;
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const r = await fetch(`/api/stats?userId=${userId}`);
                const res = (await r.json()) as DashboardData | ApiError;

                if (cancelled) return;

                if (!r.ok || (res as ApiError).error) {
                    setError(
                        (res as ApiError).error ?? "Failed to load dashboard.",
                    );
                    setData(null);
                    return;
                }

                setData(res as DashboardData);
            } catch {
                if (!cancelled) {
                    setError("Failed to load dashboard.");
                    setData(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [session]);

    const summary = useMemo(() => {
        if (data?.platformStats) {
            return {
                title1: "Total Users",
                val1: data.platformStats.totalUsers,
                title2: "Platform Submissions",
                val2: data.platformStats.totalSubmissions,
                title3: "Global Acceptance",
                val3: `${data.platformStats.acceptanceRate}%`,
                title4: "Total Problems",
                val4: data.platformStats.totalProblems,
                sub4: "Active catalog",
            };
        }
        return {
            title1: "Total Solved",
            val1: data?.stats.totalSolved ?? 0,
            title2: "Submissions",
            val2: data?.stats.totalSubmissions ?? 0,
            title3: "Acceptance",
            val3: `${data?.stats.acceptanceRate ?? 0}%`,
            title4: "Streak",
            val4: data?.user.currentStreak ?? 0,
            sub4: `Best: ${data?.user.longestStreak ?? 0}`,
        };
    }, [data]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">{error}</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">No data.</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-6xl">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Dashboard
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Welcome, {data.user.username}.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Card>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-600">
                                {summary.title1}
                            </div>
                            <div className="text-3xl font-extrabold text-gray-900">
                                {summary.val1}
                            </div>
                        </div>
                        <Target className="text-gray-500" />
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-600">
                                {summary.title2}
                            </div>
                            <div className="text-3xl font-extrabold text-gray-900">
                                {summary.val2}
                            </div>
                        </div>
                        <TrendingUp className="text-gray-500" />
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-600">
                                {summary.title3}
                            </div>
                            <div className="text-3xl font-extrabold text-gray-900">
                                {summary.val3}
                            </div>
                        </div>
                        <Activity className="text-gray-500" />
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-600">{summary.title4}</div>
                            <div className="text-3xl font-extrabold text-gray-900">
                                {summary.val4}
                            </div>
                            <div className="text-xs text-gray-500">
                                {summary.sub4}
                            </div>
                        </div>
                        <Clock className="text-gray-500" />
                    </div>
                </Card>
            </div>

            {/* Admin-only visibility for student specifics */}
            {!data.platformStats && (
                <>
                    <div className="mb-10">
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto pb-4 custom-scrollbar">
                                    <div className="inline-grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                                        {(() => {
                                            const days: (string | null)[] = [];
                                            const today = new Date();
                                            
                                            // Start date 364 days ago
                                            const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 364));
                                            const startDayOfWeek = startDate.getUTCDay(); // 0 is Sunday, 6 is Saturday
                                            
                                            // Pad the beginning so the first day aligns perfectly to its day of the week
                                            for (let i = 0; i < startDayOfWeek; i++) {
                                                days.push(null);
                                            }

                                            // Push actual UTC date strings
                                            for (let i = 364; i >= 0; i--) {
                                                const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
                                                days.push(d.toISOString().split("T")[0]);
                                            }

                                            const map = new Map(data.heatmap.map((h) => [h.date, h.count]));
                                            
                                            return days.map((dateStr, index) => {
                                                if (!dateStr) {
                                                    return <div key={`pad-${index}`} className="w-3 h-3 transparent" />;
                                                }

                                                const count = map.get(dateStr) || 0;
                                                let bg = "bg-gray-100";
                                                if (count === 1) bg = "bg-green-200";
                                                else if (count >= 2 && count <= 3) bg = "bg-green-400";
                                                else if (count >= 4 && count <= 6) bg = "bg-green-600";
                                                else if (count > 6) bg = "bg-green-800";
                                                
                                                return (
                                                    <div
                                                        key={dateStr}
                                                        className={`w-3 h-3 rounded-sm ${bg} hover:ring-1 hover:ring-gray-400 transition-all cursor-pointer`}
                                                        title={`${count} submissions on ${dateStr}`}
                                                    />
                                                );
                                            });
                                        })()}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
                                        <span>Less</span>
                                        <div className="w-3 h-3 rounded-sm bg-gray-100" />
                                        <div className="w-3 h-3 rounded-sm bg-green-200" />
                                        <div className="w-3 h-3 rounded-sm bg-green-400" />
                                        <div className="w-3 h-3 rounded-sm bg-green-600" />
                                        <div className="w-3 h-3 rounded-sm bg-green-800" />
                                        <span>More</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Topic Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.topics.length ? (
                                        data.topics.map((t) => {
                                            const pct =
                                                t.attempted > 0
                                                    ? Math.round(
                                                          (t.solved / t.attempted) *
                                                              100,
                                                      )
                                                    : 0;
                                            return (
                                                <div key={t.topicId} className="group">
                                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                                        <span className={`font-medium transition-colors ${t.attempted > 0 ? 'text-gray-800 group-hover:text-blue-600' : 'text-gray-400'}`}>
                                                            {t.topicName}
                                                        </span>
                                                        {t.attempted > 0 ? (
                                                            <span className="text-xs font-mono text-gray-500">
                                                                <strong className="text-gray-900 text-sm">{t.solved}</strong> 
                                                                <span className="mx-0.5">/</span>{t.attempted}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Not attempted</span>
                                                        )}
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                                pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-transparent'
                                                            }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm text-gray-500">
                                            No topic data yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Difficulty Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const { Easy, Medium, Hard } = data.stats.difficultyDistribution;
                                    const total = Easy + Medium + Hard;

                                    if (total === 0) return <div className="text-sm text-gray-500 mt-4">Solve more problems to generate insights!</div>;

                                    const easyPct = (Easy / total) * 100;
                                    const mediumPct = (Medium / total) * 100;
                                    const hardPct = (Hard / total) * 100;

                                    const conic = `
                                        #22c55e 0% ${easyPct}%,
                                        #eab308 ${easyPct}% ${easyPct + mediumPct}%,
                                        #ef4444 ${easyPct + mediumPct}% 100%
                                    `;

                                    return (
                                        <div className="flex flex-col items-center justify-center p-4">
                                            <div className="relative w-44 h-44 rounded-full mb-8 shadow-sm" style={{ background: `conic-gradient(${conic})` }}>
                                                <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                                    <span className="text-3xl font-extrabold text-gray-900">{total}</span>
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Solved</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-6 w-full">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Easy</div>
                                                    <span className="text-xl font-bold text-gray-900">{Easy}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>Medium</div>
                                                    <span className="text-xl font-bold text-gray-900">{Medium}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Hard</div>
                                                    <span className="text-xl font-bold text-gray-900">{Hard}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Recent Submissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.recentSubmissions.length ? (
                                        data.recentSubmissions.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center justify-between gap-4"
                                            >
                                                <div className="min-w-0">
                                                    <Link href={`/problems/${sub.problemId}`} className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                                                        {sub.problemTitle}
                                                    </Link>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(
                                                            sub.submittedAt,
                                                        ).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <Badge
                                                        color={
                                                            sub.isAccepted
                                                                ? "success"
                                                                : "error"
                                                        }
                                                        size="sm"
                                                    >
                                                        {sub.verdict}
                                                    </Badge>
                                                    {sub.isAccepted ? (
                                                        <CheckCircle2
                                                            className="text-green-600"
                                                            size={18}
                                                        />
                                                    ) : (
                                                        <Clock
                                                            className="text-gray-500"
                                                            size={18}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-500">
                                            No submissions yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
