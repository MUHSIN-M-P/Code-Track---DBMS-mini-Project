"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Calendar, Clock, Users, Trophy } from "lucide-react";

interface Contest {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    duration: number;
    createdBy: { name: string };
    _count: { registrations: number; problems: number };
    isRegistered?: boolean;
}

export default function ContestsPage() {
    const { data: session } = useSession();
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = (session?.user as { id?: string } | undefined)?.id;
        const url = userId
            ? `/api/contests?userId=${encodeURIComponent(userId)}`
            : "/api/contests";
        fetch(url)
            .then((r) => r.json())
            .then((data) => {
                setContests(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setContests([]);
                setLoading(false);
            });
    }, [session]);

    const getStatus = (c: Contest) => {
        const now = new Date();
        const start = new Date(c.startTime);
        const end = new Date(c.endTime);
        if (now < start) return { label: "Upcoming", badge: "badge-upcoming" };
        if (now >= start && now <= end)
            return { label: "Active", badge: "badge-active" };
        return { label: "Ended", badge: "badge-ended" };
    };

    const handleRegister = async (contestId: string) => {
        if (!session?.user) return;
        const userId = (session.user as { id: string }).id;

        const res = await fetch(`/api/contests/${contestId}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });

        if (res.ok) {
            alert("✅ Registered successfully!");
            setContests((prev) =>
                prev.map((c) =>
                    c.id === contestId ? { ...c, isRegistered: true } : c,
                ),
            );
        } else {
            const data = await res.json();
            alert(data.error || "Registration failed");
        }
    };

    if (loading)
        return (
            <div className="loading">
                <div className="spinner" />
            </div>
        );

    const upcoming = contests.filter((c) => getStatus(c).label === "Upcoming");
    const active = contests.filter((c) => getStatus(c).label === "Active");
    const ended = contests.filter((c) => getStatus(c).label === "Ended");

    const renderContests = (list: Contest[], empty: string) => {
        if (list.length === 0)
            return (
                <div className="empty-state" style={{ padding: 40 }}>
                    <p className="empty-state-text">{empty}</p>
                </div>
            );

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {list.map((c) => {
                    const status = getStatus(c);
                    return (
                        <div key={c.id} className="contest-card">
                            <div className="contest-header">
                                <div>
                                    <Link
                                        href={`/contests/${c.id}`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <h3 className="contest-title table-link">
                                            {c.title}
                                        </h3>
                                    </Link>
                                    <p
                                        style={{
                                            fontSize: 14,
                                            color: "var(--text-secondary)",
                                            marginTop: 4,
                                        }}
                                    >
                                        {c.description}
                                    </p>
                                </div>
                                <span className={`badge ${status.badge}`}>
                                    {status.label}
                                </span>
                            </div>
                            <div className="contest-meta">
                                <div className="contest-meta-item">
                                    <Calendar size={14} />
                                    {new Date(c.startTime).toLocaleDateString(
                                        "en-US",
                                        {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        },
                                    )}
                                </div>
                                <div className="contest-meta-item">
                                    <Clock size={14} />
                                    {c.duration} min
                                </div>
                                <div className="contest-meta-item">
                                    <Trophy size={14} />
                                    {c._count.problems} problems
                                </div>
                                <div className="contest-meta-item">
                                    <Users size={14} />
                                    {c._count.registrations} registered
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 4,
                                }}
                            >
                                <Link
                                    href={`/contests/${c.id}`}
                                    className="btn btn-secondary btn-sm"
                                >
                                    View Details
                                </Link>
                                {status.label === "Active" &&
                                    session &&
                                    c.isRegistered && (
                                        <Link
                                            href={`/contests/${c.id}`}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Join
                                        </Link>
                                    )}
                                {status.label !== "Ended" &&
                                    session &&
                                    !c.isRegistered && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleRegister(c.id)}
                                        >
                                            Register
                                        </button>
                                    )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="container" style={{ paddingBottom: 60 }}>
            <div className="page-header">
                <h1 className="page-title">Contests</h1>
                <p className="page-subtitle">
                    Compete in timed coding challenges and climb the leaderboard
                </p>
            </div>

            {active.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                    <h2
                        style={{
                            fontSize: 18,
                            fontWeight: 700,
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        🟢 Active Contests
                    </h2>
                    {renderContests(active, "")}
                </section>
            )}

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    🔮 Upcoming Contests
                </h2>
                {renderContests(upcoming, "No upcoming contests")}
            </section>

            <section>
                <h2
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    📋 Past Contests
                </h2>
                {renderContests(ended, "No past contests")}
            </section>
        </div>
    );
}
