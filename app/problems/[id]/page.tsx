"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Users,
    TrendingUp,
    Send,
} from "lucide-react";

interface Problem {
    id: string;
    title: string;
    difficulty: string;
    description: string;
    topics: { topic: { id: string; name: string } }[];
    totalSubmissions: number;
    acceptanceRate: number;
    solvers: number;
    submissions: {
        id: string;
        verdict: string;
        language: string;
        submittedAt: string;
        userId: string;
    }[];
}

export default function ProblemDetailPage() {
    const { id } = useParams();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const contestId = searchParams.get("contestId") || undefined;
    const [contestProblems, setContestProblems] = useState<
        { order: number; problem: { id: string; title: string } }[]
    >([]);
    const [problem, setProblem] = useState<Problem | null>(null);
    const [language, setLanguage] = useState("cpp");
    const [verdict, setVerdict] = useState("Accepted");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [executionOutput, setExecutionOutput] = useState("");

    useEffect(() => {
        fetch(`/api/problems/${id}`)
            .then((r) => r.json())
            .then(setProblem);
    }, [id]);

    useEffect(() => {
        if (!contestId) return;

        fetch(`/api/contests/${contestId}`)
            .then((r) => r.json())
            .then((data) => {
                const problems = Array.isArray(data?.problems)
                    ? data.problems
                    : [];
                setContestProblems(problems);
            })
            .catch(() => setContestProblems([]));
    }, [contestId]);

    const handleSubmit = async () => {
        if (!session?.user) {
            setMessage("❌ You must be logged in to submit.");
            return;
        }
        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            setMessage("❌ Session error — please log out and log back in.");
            return;
        }
        setSubmitting(true);
        setMessage("");
        setExecutionOutput("");

        let finalVerdict = verdict;

        // If user typed code, execute it first!
        if (code.trim()) {
            setMessage("⚡ Running tests on Piston Engine...");
            try {
                const execRes = await fetch("/api/execute", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ problemId: id, language, code }),
                });
                const execData = await execRes.json();
                
                if (execRes.ok && execData.verdict) {
                    finalVerdict = execData.verdict;
                    if (execData.output && execData.output !== "All test cases passed.") {
                        setExecutionOutput(execData.output);
                    }
                    if (finalVerdict === "Accepted") {
                        setMessage(`✅ Executed and Received: ${finalVerdict}`);
                    } else {
                        setMessage(`❌ Executed and Received: ${finalVerdict}`);
                    }
                } else {
                    setMessage(`❌ Execution Error: ${execData.error || "Piston API failed"}`);
                    setSubmitting(false);
                    return;
                }
            } catch (err) {
                setMessage("❌ Failed to reach Execution Engine.");
                setSubmitting(false);
                return;
            }
        }

        const res = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                problemId: id,
                language,
                verdict: finalVerdict,
                contestId,
            }),
        });

        if (res.ok) {
            if (!code.trim()) setMessage("✅ Manual Submission recorded!");
            const updated = await fetch(`/api/problems/${id}`).then((r) =>
                r.json(),
            );
            setProblem(updated);
        } else {
            const errData = await res.json().catch(() => ({}));
            setMessage(`❌ Database Error: ${errData.error || "Submission failed"}`);
        }
        setSubmitting(false);
    };

    if (!problem)
        return (
            <div className="loading">
                <div className="spinner" />
            </div>
        );

    const diffBadge: Record<string, string> = {
        Easy: "badge-easy",
        Medium: "badge-medium",
        Hard: "badge-hard",
    };

    const userId = (session?.user as { id?: string })?.id;
    const mySubmissions = problem.submissions.filter(
        (s) => s.userId === userId,
    );

    const currentIndex = contestProblems.findIndex(
        (cp) => cp.problem.id === id,
    );
    const prevProblemId =
        currentIndex > 0 ? contestProblems[currentIndex - 1]?.problem.id : null;
    const nextProblemId =
        currentIndex >= 0 && currentIndex < contestProblems.length - 1
            ? contestProblems[currentIndex + 1]?.problem.id
            : null;

    return (
        <div className="container" style={{ paddingBottom: 60 }}>
            {contestId && currentIndex >= 0 && (
                <div
                    className="card"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 16,
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{ fontSize: 14, color: "var(--text-secondary)" }}
                    >
                        Contest Mode • Problem {currentIndex + 1} of{" "}
                        {contestProblems.length}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link
                            href={`/contests/${contestId}`}
                            className="btn btn-secondary btn-sm"
                        >
                            Contest Details
                        </Link>
                        {prevProblemId ? (
                            <Link
                                href={`/problems/${prevProblemId}?contestId=${contestId}`}
                                className="btn btn-secondary btn-sm"
                            >
                                Prev
                            </Link>
                        ) : (
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled
                            >
                                Prev
                            </button>
                        )}
                        {nextProblemId ? (
                            <Link
                                href={`/problems/${nextProblemId}?contestId=${contestId}`}
                                className="btn btn-primary btn-sm"
                            >
                                Next
                            </Link>
                        ) : (
                            <button className="btn btn-primary btn-sm" disabled>
                                Next
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h1 className="page-title">{problem.title}</h1>
                    <span className={`badge ${diffBadge[problem.difficulty]}`}>
                        {problem.difficulty}
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 8,
                        flexWrap: "wrap",
                    }}
                >
                    {problem.topics.map((t) => (
                        <span key={t.topic.id} className="badge badge-topic">
                            {t.topic.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="problem-detail">
                {/* Left Pane: Description & Code Editor */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Problem Description */}
                    <div className="problem-content">
                        <div
                            style={{ whiteSpace: "pre-wrap" }}
                            dangerouslySetInnerHTML={{
                                __html: problem.description
                                    .replace(
                                        /\*\*(.*?)\*\*/g,
                                        "<strong>$1</strong>",
                                    )
                                    .replace(/\n/g, "<br/>"),
                            }}
                        />
                    </div>

                    {/* Submit Solution Options moved to right side */}

                    {session && (
                        <div className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                                    ✨ Editor
                                </h3>
                                
                                <select
                                    className="form-input"
                                    style={{ width: "auto", padding: "4px 10px", fontSize: 13, height: "30px" }}
                                    value={language}
                                    onChange={(e) =>
                                        setLanguage(e.target.value)
                                    }
                                >
                                    <option value="cpp">C++</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="c">C</option>
                                </select>
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <textarea
                                    className="form-input"
                                    style={{ 
                                        width: "100%", 
                                        minHeight: "400px",
                                        fontFamily: "monospace",
                                        fontSize: 14,
                                        backgroundColor: "#1e1e1e",
                                        color: "#d4d4d4",
                                        padding: "16px",
                                        borderRadius: "8px",
                                        border: "1px solid #333"
                                    }}
                                    placeholder="Write your code here...&#10;(Leave empty to use manual verdict on the right instead)"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    spellCheck={false}
                                />
                            </div>
                            
                            {/* Execution Output directly below Editor */}
                            {executionOutput && (
                                <div style={{
                                    marginTop: 16,
                                    padding: 16,
                                    backgroundColor: "#1e1e1e",
                                    borderLeft: "4px solid #ef4444",
                                    borderRadius: "8px",
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                    color: "#ff8080",
                                    whiteSpace: "pre-wrap",
                                    maxHeight: "250px",
                                    overflowY: "auto"
                                }}>
                                    {executionOutput}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="problem-sidebar">
                    {/* Stats */}
                    <div className="card">
                        <h3
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                marginBottom: 16,
                            }}
                        >
                            📈 Statistics
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 14,
                                }}
                            >
                                <span
                                    style={{
                                        color: "var(--text-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <Users size={14} /> Solvers
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {problem.solvers}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 14,
                                }}
                            >
                                <span
                                    style={{
                                        color: "var(--text-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <TrendingUp size={14} /> Acceptance
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {problem.acceptanceRate}%
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 14,
                                }}
                            >
                                <span
                                    style={{
                                        color: "var(--text-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <Send size={14} /> Submissions
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {problem.totalSubmissions}
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* Action Controls Moved Here */}
                    {session && (
                        <div className="card">
                            <h3
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    marginBottom: 16,
                                }}
                            >
                                🚀 Actions
                            </h3>
                            
                            {!code.trim() && (
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label className="form-label">Manual Match (Fallback)</label>
                                    <select
                                        className="form-input"
                                        style={{ width: "100%" }}
                                        value={verdict}
                                        onChange={(e) => setVerdict(e.target.value)}
                                    >
                                        <option value="Accepted">Accepted</option>
                                        <option value="Wrong Answer">Wrong Answer</option>
                                        <option value="Time Limit Exceeded">Time Limit Exceeded</option>
                                        <option value="Runtime Error">Runtime Error</option>
                                        <option value="Compilation Error">Compilation Error</option>
                                    </select>
                                </div>
                            )}
                            
                            <button
                                className="btn btn-primary"
                                style={{ width: "100%" }}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                <Send size={16} />
                                {submitting
                                    ? "Processing..."
                                    : code.trim() ? "Run & Evaluate" : "Force Submission"}
                            </button>
                            
                            {message && (
                                <div
                                    style={{
                                        marginTop: 12,
                                        padding: 10,
                                        backgroundColor: message.includes("✅") ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                        borderRadius: 6,
                                        fontSize: 13,
                                        textAlign: "center",
                                        fontWeight: 600,
                                        color: message.includes("✅")
                                            ? "var(--accent-green)"
                                            : message.includes("⚡") ? "#3b82f6" : "var(--accent-red)",
                                    }}
                                >
                                    {message}
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Submissions */}
                    {mySubmissions.length > 0 && (
                        <div className="card">
                            <h3
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    marginBottom: 16,
                                }}
                            >
                                📝 My Submissions
                            </h3>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {mySubmissions.slice(0, 5).map((s) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            fontSize: 13,
                                            padding: "6px 0",
                                            borderBottom:
                                                "1px solid var(--border-primary)",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {s.verdict === "Accepted" ? (
                                                <CheckCircle2
                                                    size={14}
                                                    style={{
                                                        color: "var(--accent-green)",
                                                    }}
                                                />
                                            ) : (
                                                <XCircle
                                                    size={14}
                                                    style={{
                                                        color: "var(--accent-red)",
                                                    }}
                                                />
                                            )}
                                            <Clock size={12} />
                                            {new Date(
                                                s.submittedAt,
                                            ).toLocaleDateString()}
                                        </span>
                                        <span className="badge badge-topic">
                                            {s.language}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
