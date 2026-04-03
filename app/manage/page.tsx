"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Trophy, Trash2, X, Plus, Code2 } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/tailgrids/core/card";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";

type Tab = "users" | "problems" | "contests";

interface UserRank {
    id: string;
    username: string;
    totalSolved: number;
    totalSubmissions: number;
    acceptanceRate: number;
}

interface Contest {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    _count: { registrations: number; problems: number };
}

interface Problem {
    id: string;
    title: string;
    difficulty: string;
    totalSubmissions: number;
    topics: { topic: { id: string; name: string } }[];
}

export default function ManagePage() {
    const { data: session } = useSession();
    const [tab, setTab] = useState<Tab>("contests");
    const [users, setUsers] = useState<UserRank[]>([]);
    const [contests, setContests] = useState<Contest[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);

    // Contest Modal State
    const [showContestModal, setShowContestModal] = useState(false);
    const [cTitle, setCTitle] = useState("");
    const [cStart, setCStart] = useState("");
    const [cDuration, setCDuration] = useState("90");

    // Problem Modal State
    const [showProblemModal, setShowProblemModal] = useState(false);
    const [pTitle, setPTitle] = useState("");
    const [pDesc, setPDesc] = useState("");
    const [pDiff, setPDiff] = useState("Easy");
    const [pTopics, setPTopics] = useState<string[]>([]);
    const [availableTopics, setAvailableTopics] = useState<{id: string, name: string}[]>([]);

    useEffect(() => {
        loadData();
        fetch("/api/topics")
            .then(r => r.json())
            .then(setAvailableTopics)
            .catch(() => {});
    }, []);

    const loadData = () => {
        fetch("/api/leaderboard")
            .then((r) => r.json())
            .then(setUsers)
            .catch(() => setUsers([]));
        fetch("/api/contests")
            .then((r) => r.json())
            .then(setContests);
        fetch("/api/problems")
            .then((r) => r.json())
            .then(setProblems)
            .catch(() => setProblems([]));
    };

    // Contest Operations
    const createContest = async () => {
        const userId = (session?.user as { id: string })?.id;
        if (!userId) return;
        
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

    // Problem Operations
    const createProblem = async () => {
        const userId = (session?.user as { id: string })?.id;
        if (!userId || !pTitle || !pDesc) return;

        const res = await fetch("/api/problems", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: pTitle,
                description: pDesc,
                difficulty: pDiff,
                topicIds: pTopics,
                createdById: userId,
            })
        });

        if (res.ok) {
            setShowProblemModal(false);
            setPTitle("");
            setPDesc("");
            setPDiff("Easy");
            setPTopics([]);
            loadData();
        } else {
            alert("Failed to create problem");
        }
    };

    const deleteProblem = async (id: string) => {
        if (!confirm("Delete this problem?")) return;
        await fetch(`/api/problems/${id}`, { method: "DELETE" });
        loadData();
    };

    const toggleTopic = (topicId: string) => {
        setPTopics(prev => prev.includes(topicId) 
            ? prev.filter(t => t !== topicId) 
            : [...prev, topicId]
        );
    };

    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl bg-gray-50 min-h-screen">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        🛡️ Manage
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        System-wide management
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Admin Sidebar */}
                <Card className="w-full md:w-64 shrink-0 shadow-md">
                    <div className="p-3">
                        <button
                            onClick={() => setTab("users")}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                tab === "users" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <Users size={16} /> Users
                        </button>
                        <button
                            onClick={() => setTab("problems")}
                            className={`mt-1 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                tab === "problems" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <Code2 size={16} /> Problems
                        </button>
                        <button
                            onClick={() => setTab("contests")}
                            className={`mt-1 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                tab === "contests" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <Trophy size={16} /> Contests
                        </button>
                    </div>
                </Card>

                {/* Admin Content */}
                <div className="flex-1">
                    {tab === "users" && (
                        <Card className="shadow-md">
                            <CardHeader className="bg-gray-50 border-b border-gray-200">
                                <CardTitle>Platform Users</CardTitle>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">User</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Solved</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Submissions</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Win Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{u.username}</td>
                                                <td className="px-6 py-4 font-bold text-green-600">{u.totalSolved}</td>
                                                <td className="px-6 py-4 text-gray-700">{u.totalSubmissions}</td>
                                                <td className="px-6 py-4 text-gray-700">{u.acceptanceRate}%</td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {tab === "problems" && (
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row justify-between items-center bg-gray-50 border-b border-gray-200">
                                <CardTitle>Manage Problems</CardTitle>
                                <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => setShowProblemModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Plus size={16} /> Create Problem
                                </Button>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Title</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Difficulty</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Topics</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {problems.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{p.difficulty}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {p.topics.map(t => t.topic.name).join(", ") || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => deleteProblem(p.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {problems.length === 0 && (
                                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No problems found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {tab === "contests" && (
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row justify-between items-center bg-gray-50 border-b border-gray-200">
                                <CardTitle>Manage Contests</CardTitle>
                                <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => setShowContestModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Plus size={16} /> Create Contest
                                </Button>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Title</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Start Time</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Duration</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {contests.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{c.title}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(c.startTime).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {Math.max(0, Math.round((new Date(c.endTime).getTime() - new Date(c.startTime).getTime()) / 60000))} min
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => deleteContest(c.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {contests.length === 0 && (
                                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No contests defined</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Contest Modal */}
            {showContestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <Card className="w-full max-w-lg border-0 shadow-2xl">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-gray-200">
                            <CardTitle>Create Contest</CardTitle>
                            <button onClick={() => setShowContestModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Title</label>
                                <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Weekly Challenge" className="w-full" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Start Time</label>
                                <Input type="datetime-local" value={cStart} onChange={(e) => setCStart(e.target.value)} className="w-full" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                                <Input type="number" value={cDuration} onChange={(e) => setCDuration(e.target.value)} className="w-full" />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-6">
                                <Button color="secondary" appearance="outline" onClick={() => setShowContestModal(false)}>Cancel</Button>
                                <Button color="primary" onClick={createContest}>Create Contest</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create Problem Modal */}
            {showProblemModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
                    <Card className="w-full max-w-2xl border-0 shadow-2xl my-8">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-gray-200">
                            <CardTitle>Create New Problem</CardTitle>
                            <button onClick={() => setShowProblemModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Title</label>
                                <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Two Sum" className="w-full" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Description (HTML supported)</label>
                                <textarea 
                                    className="w-full min-h-[150px] border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={pDesc}
                                    onChange={(e) => setPDesc(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Difficulty</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={pDiff}
                                    onChange={(e) => setPDiff(e.target.value)}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Topics</label>
                                <div className="flex flex-wrap gap-2 pt-1 border border-gray-200 p-3 rounded-lg max-h-[150px] overflow-y-auto bg-gray-50">
                                    {availableTopics.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => toggleTopic(t.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                pTopics.includes(t.id) ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                    {availableTopics.length === 0 && <span className="text-sm text-gray-500 p-1">No topics generated yet.</span>}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t mt-4">
                                <Button color="secondary" appearance="outline" onClick={() => setShowProblemModal(false)}>Cancel</Button>
                                <Button color="primary" onClick={createProblem}>Save Problem</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
