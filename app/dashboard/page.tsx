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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
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
                                        <div
                                            key={t.topicId}
                                            className="flex items-center justify-between gap-4"
                                        >
                                            <div className="text-sm font-semibold text-gray-900">
                                                {t.topicName}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {t.solved}/{t.attempted}{" "}
                                                <span className="text-gray-400">
                                                    ({pct}%)
                                                </span>
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

                <Card>
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
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                {sub.problemTitle}
                                            </div>
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
        </div>
    );
}
