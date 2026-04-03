"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Trophy, Trash2, X, Plus } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/tailgrids/core/card";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { Badge } from "@/components/tailgrids/core/badge";

type Tab = "users" | "contests";

interface UserRank {
    id: string;
    username: string;
    totalSolved: number;
    totalSubmissions: number;
    acceptanceRate: number;
    currentStreak: number;
    longestStreak: number;
}

interface Contest {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    createdBy?: { username: string };
    _count: { registrations: number; problems: number };
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("users");
    const [users, setUsers] = useState<UserRank[]>([]);
    const [contests, setContests] = useState<Contest[]>([]);

    // Modals
    const [showContestModal, setShowContestModal] = useState(false);

    // Forms
    const [cTitle, setCTitle] = useState("");
    const [cStart, setCStart] = useState("");
    const [cDuration, setCDuration] = useState("90");

    const isAdmin = (session?.user as { role?: string })?.role === "admin";

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (status === "authenticated" && !isAdmin) router.push("/dashboard");
    }, [status, isAdmin, router]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch("/api/leaderboard")
            .then((r) => r.json())
            .then(setUsers);
        fetch("/api/contests")
            .then((r) => r.json())
            .then(setContests);
    };

    const createContest = async () => {
        const userId = (session?.user as { id: string })?.id;
        await fetch("/api/contests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: cTitle,
                startTime: cStart,
                duration: parseInt(cDuration),
                createdById: userId,
            }),
        });
        setShowContestModal(false);
        setCTitle("");
        setCStart("");
        setCDuration("90");
        loadData();
    };

    const deleteContest = async (id: string) => {
        if (!confirm("Delete this contest?")) return;
        await fetch(`/api/contests/${id}`, { method: "DELETE" });
        loadData();
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin text-blue-600"></div>
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "users", label: "Users", icon: <Users size={16} /> },
        { key: "contests", label: "Contests", icon: <Trophy size={16} /> },
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-[85vh] bg-gray-50">
            {/* Sidebar */}
            <aside className="w-full md:w-64 border-r border-gray-200 bg-white p-4 flex flex-col gap-2 shadow-sm">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-3">
                    Admin Console
                </div>
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                            tab === t.key
                                ? "bg-blue-50 text-blue-600 shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </aside>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8 overflow-x-auto bg-gray-50">
                {/* ─── CONTESTS ──────────────────────────── */}
                {tab === "contests" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Contests
                            </h2>
                            <Button
                                color="primary"
                                onClick={() => setShowContestModal(true)}
                                className="flex items-center gap-2 shadow-md"
                            >
                                <Plus size={16} /> Create Contest
                            </Button>
                        </div>

                        <Card className="border border-gray-200 bg-white shadow-md">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Title
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Start Time
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Duration
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Problems
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Entries
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {contests.map((c) => (
                                            <tr
                                                key={c.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {c.title}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(
                                                        c.startTime,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {Math.max(
                                                        0,
                                                        Math.round(
                                                            (new Date(
                                                                c.endTime,
                                                            ).getTime() -
                                                                new Date(
                                                                    c.startTime,
                                                                ).getTime()) /
                                                                60000,
                                                        ),
                                                    )}{" "}
                                                    min
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {c._count?.problems || 0}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {c._count?.registrations ||
                                                        0}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() =>
                                                            deleteContest(c.id)
                                                        }
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {contests.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-6 py-8 text-center text-gray-500"
                                                >
                                                    No contests defined
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Contest Modal */}
                        {showContestModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
                                <Card className="w-full max-w-lg border border-gray-200 bg-white my-8 shadow-2xl">
                                    <CardHeader className="flex flex-row justify-between items-center border-b border-gray-200 pb-4">
                                        <CardTitle>Create Contest</CardTitle>
                                        <button
                                            onClick={() =>
                                                setShowContestModal(false)
                                            }
                                            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Title
                                            </label>
                                            <Input
                                                value={cTitle}
                                                onChange={(e) =>
                                                    setCTitle(e.target.value)
                                                }
                                                placeholder="Weekly Challenge #2"
                                                className="w-full border-gray-300 bg-white text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Start Time
                                            </label>
                                            <Input
                                                type="datetime-local"
                                                value={cStart}
                                                onChange={(e) =>
                                                    setCStart(e.target.value)
                                                }
                                                className="w-full border-gray-300 bg-white text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Duration (min)
                                            </label>
                                            <Input
                                                type="number"
                                                value={cDuration}
                                                onChange={(e) =>
                                                    setCDuration(e.target.value)
                                                }
                                                className="w-full border-gray-300 bg-white text-gray-900"
                                            />
                                        </div>
                                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                            <Button
                                                color="secondary"
                                                appearance="outline"
                                                onClick={() =>
                                                    setShowContestModal(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                color="primary"
                                                onClick={createContest}
                                            >
                                                Create Contest
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── USERS ──────────────────────── */}
                {tab === "users" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Users
                        </h2>

                        <Card className="border border-gray-200 bg-white shadow-md">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Name
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Total Solved
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Total Submissions
                                            </th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                Acceptance Rate
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {users.map((u) => (
                                            <tr
                                                key={u.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {u.username}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-green-600">
                                                    {u.totalSolved}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {u.totalSubmissions}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {u.acceptanceRate}%
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-8 text-center text-gray-500"
                                                >
                                                    No users found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
