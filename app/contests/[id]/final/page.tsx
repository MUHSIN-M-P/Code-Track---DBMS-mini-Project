"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";

type ContestDetail = {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    createdBy: { username: string };
    problems: {
        order: number;
        problem: { id: string; title: string; difficulty: string };
    }[];
    _count: { registrations: number };
};

type Submission = {
    id: string;
    verdict: string;
    language: string;
    submittedAt: string;
    problem: { id: string; title: string; difficulty: string };
};

type ApiError = { error: string };

export default function ContestFinalPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();

    const userId = (session?.user as { id?: string } | undefined)?.id;

    const [contest, setContest] = useState<ContestDetail | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        if (!id || !userId) return;

        let cancelled = false;

        Promise.all([
            fetch(`/api/contests/${id}`).then((r) => r.json()),
            fetch(
                `/api/submissions?userId=${encodeURIComponent(userId)}&contestId=${encodeURIComponent(String(id))}`,
            ).then((r) => r.json()),
        ])
            .then(([contestJson, submissionsJson]) => {
                if (cancelled) return;
                if ((contestJson as ApiError)?.error) {
                    setError((contestJson as ApiError).error);
                    setContest(null);
                } else {
                    setError(null);
                    setContest(contestJson as ContestDetail);
                }
                setSubmissions(
                    Array.isArray(submissionsJson) ? submissionsJson : [],
                );
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Failed to load contest summary.");
                    setContest(null);
                    setSubmissions([]);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, userId]);

    const bestByProblem = useMemo(() => {
        const map = new Map<string, Submission>();
        for (const s of submissions) {
            const existing = map.get(s.problem.id);
            if (!existing) {
                map.set(s.problem.id, s);
                continue;
            }
            const existingAccepted = String(existing.verdict) === "Accepted";
            const currentAccepted = String(s.verdict) === "Accepted";
            if (!existingAccepted && currentAccepted) {
                map.set(s.problem.id, s);
                continue;
            }
            if (
                new Date(s.submittedAt).getTime() >
                new Date(existing.submittedAt).getTime()
            ) {
                map.set(s.problem.id, s);
            }
        }
        return map;
    }, [submissions]);

    if (loading || status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin text-blue-600" />
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Contest Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-600">
                            {error || "Contest not found."}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    const durationMin = Math.max(
        0,
        Math.round((end.getTime() - start.getTime()) / 60000),
    );

    return (
        <div className="container mx-auto px-6 py-10 max-w-6xl">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        {contest.title}
                    </h1>
                    <div className="mt-2 text-sm text-gray-600">
                        Created by {contest.createdBy.username} • {durationMin}{" "}
                        min • {contest.problems.length} problems
                    </div>
                </div>
                <Badge color="success">Finished</Badge>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <Link
                    href={`/contests/${contest.id}`}
                    className="btn btn-secondary btn-sm"
                >
                    Back to Contest
                </Link>
                {contest.problems.length > 0 && (
                    <Link
                        href={`/problems/${contest.problems[0].problem.id}?contestId=${contest.id}`}
                        className="btn btn-primary btn-sm"
                    >
                        Review Problems
                    </Link>
                )}
            </div>

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Your Contest Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                        #
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                        Problem
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                        Verdict
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                        Language
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                        Last Submit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contest.problems.map((cp) => {
                                    const best = bestByProblem.get(
                                        cp.problem.id,
                                    );
                                    const verdict = best?.verdict ?? "—";
                                    const verdictColor:
                                        | "success"
                                        | "error"
                                        | "warning"
                                        | "gray" =
                                        verdict === "Accepted"
                                            ? "success"
                                            : verdict === "WrongAnswer" ||
                                                verdict === "Wrong Answer"
                                              ? "error"
                                              : verdict ===
                                                      "TimeLimitExceeded" ||
                                                  verdict ===
                                                      "Time Limit Exceeded"
                                                ? "warning"
                                                : "gray";

                                    return (
                                        <tr
                                            key={cp.problem.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {cp.order}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/problems/${cp.problem.id}?contestId=${contest.id}`}
                                                    className="font-semibold text-gray-900 hover:underline"
                                                >
                                                    {cp.problem.title}
                                                </Link>
                                                <div className="text-xs text-gray-500">
                                                    {cp.problem.difficulty}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={verdictColor}>
                                                    {verdict}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {best?.language ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {best?.submittedAt
                                                    ? new Date(
                                                          best.submittedAt,
                                                      ).toLocaleString()
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {contest.problems.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-sm text-gray-500"
                                        >
                                            No problems in this contest.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
