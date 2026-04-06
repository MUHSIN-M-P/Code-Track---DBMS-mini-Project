"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, Users, Trophy, Calendar, Send } from "lucide-react";
import Link from "next/link";

interface ContestDetail {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    createdBy: { username: string };
    problems: {
        order: number;
        problem: {
            id: string;
            title: string;
            difficulty: string;
            topics: { topic: { name: string } }[];
        };
    }[];
    registrations: { user: { id: string; username: string } }[];
    _count: { registrations: number };
}

interface LeaderboardEntry {
    userId: string;
    userName: string;
    problemsSolved: number;
    penaltyTime: number;
}

export default function ContestDetailPage() {
    const { id } = useParams();
    const { data: session } = useSession();
    const router = useRouter();
    const [contest, setContest] = useState<ContestDetail | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [tab, setTab] = useState<"problems" | "leaderboard">("problems");

    const userId = (session?.user as { id?: string })?.id;

    useEffect(() => {
        fetch(`/api/contests/${id}`)
            .then((r) => r.json())
            .then(setContest);
        fetch(`/api/contests/${id}/leaderboard`)
            .then((r) => r.json())
            .then(setLeaderboard);
    }, [id]);

    if (!contest)
        return (
            <div className="loading">
                <div className="spinner" />
            </div>
        );

    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    const durationMinutes = Math.max(
        0,
        Math.round((end.getTime() - start.getTime()) / 60000),
    );
    const isUpcoming = now < start;
    const isActive = now >= start && now <= end;
    const isEnded = now > end;
    const isRegistered = contest.registrations.some(
        (r) => r.user.id === userId,
    );

    const statusLabel = isActive ? "Active" : isUpcoming ? "Upcoming" : "Ended";
    const statusBadge = isActive
        ? "badge-active"
        : isUpcoming
          ? "badge-upcoming"
          : "badge-ended";

    const handleRegister = async () => {
        if (!userId) return;
        const res = await fetch(`/api/contests/${id}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        if (res.ok) {
            const updated = await fetch(`/api/contests/${id}`).then((r) =>
                r.json(),
            );
            setContest(updated);
        } else {
            const data = await res.json();
            alert(data.error);
        }
    };

    const handleJoin = async () => {
        if (!userId) return;
        const r = await fetch(
            `/api/contests/${id}/next-problem?userId=${encodeURIComponent(userId)}`,
        );
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            alert(data.error || "Failed to join contest");
            return;
        }
        if (data.allSolved || !data.problemId) {
            router.push(`/contests/${id}/final`);
            return;
        }
        router.push(`/problems/${data.problemId}?contestId=${id}`);
    };

    const diffBadge: Record<string, string> = {
        Easy: "badge-easy",
        Medium: "badge-medium",
        Hard: "badge-hard",
    };

    return (
        <div className="container" style={{ paddingBottom: 60 }}>
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h1 className="page-title">{contest.title}</h1>
                    <span className={`badge ${statusBadge}`}>
                        {statusLabel}
                    </span>
                </div>
                <p className="page-subtitle">
                    Created by {contest.createdBy.username}
                </p>
            </div>

            {/* Contest Info Bar */}
            <div
                className="card"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 14,
                            color: "var(--text-secondary)",
                        }}
                    >
                        <Calendar size={16} />
                        {start.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 14,
                            color: "var(--text-secondary)",
                        }}
                    >
                        <Clock size={16} />
                        {durationMinutes} minutes
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 14,
                            color: "var(--text-secondary)",
                        }}
                    >
                        <Trophy size={16} />
                        {contest.problems.length} problems
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 14,
                            color: "var(--text-secondary)",
                        }}
                    >
                        <Users size={16} />
                        {contest._count.registrations} participants
                    </div>
                </div>
                {!isEnded && session && !isRegistered && (
                    <button
                        className="btn btn-primary"
                        onClick={handleRegister}
                    >
                        Register Now
                    </button>
                )}
                {isActive && isRegistered && (
                    <button className="btn btn-primary" onClick={handleJoin}>
                        Join Contest
                    </button>
                )}
                {!isActive && isRegistered && (
                    <span className="badge badge-accepted">✓ Registered</span>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
                <button
                    className={`btn btn-sm ${tab === "problems" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setTab("problems")}
                >
                    <Trophy size={14} /> Problems
                </button>
                <button
                    className={`btn btn-sm ${tab === "leaderboard" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setTab("leaderboard")}
                >
                    <Users size={14} /> Leaderboard
                </button>
            </div>

            {/* Problems Tab */}
            {tab === "problems" && (
                <>
                    {isUpcoming && !isRegistered ? (
                        <div
                            className="card"
                            style={{ textAlign: "center", padding: 40 }}
                        >
                            <p
                                style={{
                                    color: "var(--text-secondary)",
                                    fontSize: 15,
                                }}
                            >
                                🔒 Problems will be visible once the contest
                                starts
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Problem</th>
                                        <th>Difficulty</th>
                                        <th>Topics</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contest.problems.map((cp) => (
                                        <tr key={cp.problem.id}>
                                            <td
                                                style={{
                                                    fontWeight: 700,
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {cp.order}
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/problems/${cp.problem.id}`}
                                                    className="table-link"
                                                >
                                                    {cp.problem.title}
                                                </Link>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${diffBadge[cp.problem.difficulty]}`}
                                                >
                                                    {cp.problem.difficulty}
                                                </span>
                                            </td>
                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 4,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    {cp.problem.topics.map(
                                                        (t) => (
                                                            <span
                                                                key={
                                                                    t.topic.name
                                                                }
                                                                className="badge badge-topic"
                                                            >
                                                                {t.topic.name}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/problems/${cp.problem.id}`}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    <Send size={14} /> Solve
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Leaderboard Tab */}
            {tab === "leaderboard" && (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Participant</th>
                                <th>Solved</th>
                                <th>Penalty (min)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry, i) => (
                                <tr key={entry.userId}>
                                    <td>
                                        <span
                                            className={`lb-rank ${
                                                i === 0
                                                    ? "lb-rank-1"
                                                    : i === 1
                                                      ? "lb-rank-2"
                                                      : i === 2
                                                        ? "lb-rank-3"
                                                        : ""
                                            }`}
                                            style={
                                                i > 2
                                                    ? {
                                                          background:
                                                              "var(--bg-secondary)",
                                                          color: "var(--text-secondary)",
                                                      }
                                                    : {}
                                            }
                                        >
                                            {i + 1}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {entry.userName}
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: "var(--accent-green)",
                                            }}
                                        >
                                            {entry.problemsSolved}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {entry.penaltyTime}
                                    </td>
                                </tr>
                            ))}
                            {leaderboard.length === 0 && (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="empty-state">
                                            <p className="empty-state-text">
                                                No submissions yet
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
