"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
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
    const [problem, setProblem] = useState<Problem | null>(null);
    const [language, setLanguage] = useState("cpp");
    const [verdict, setVerdict] = useState("Accepted");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch(`/api/problems/${id}`)
            .then((r) => r.json())
            .then(setProblem);
    }, [id]);

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

        const res = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                problemId: id,
                language,
                verdict,
            }),
        });

        if (res.ok) {
            setMessage("✅ Submission recorded!");
            // Refresh problem data
            const updated = await fetch(`/api/problems/${id}`).then((r) =>
                r.json(),
            );
            setProblem(updated);
        } else {
            const errData = await res.json().catch(() => ({}));
            setMessage(`❌ ${errData.error || "Submission failed"}`);
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

    return (
        <div className="container" style={{ paddingBottom: 60 }}>
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

                    {/* Submit Solution */}
                    {session && (
                        <div className="card">
                            <h3
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    marginBottom: 16,
                                }}
                            >
                                🚀 Submit Solution
                            </h3>
                            <div className="form-group">
                                <label className="form-label">Language</label>
                                <select
                                    className="form-input"
                                    style={{ width: "100%" }}
                                    value={language}
                                    onChange={(e) =>
                                        setLanguage(e.target.value)
                                    }
                                >
                                    <option value="cpp">C++</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="javascript">
                                        JavaScript
                                    </option>
                                    <option value="c">C</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Verdict</label>
                                <select
                                    className="form-input"
                                    style={{ width: "100%" }}
                                    value={verdict}
                                    onChange={(e) => setVerdict(e.target.value)}
                                >
                                    <option value="Accepted">Accepted</option>
                                    <option value="Wrong Answer">
                                        Wrong Answer
                                    </option>
                                    <option value="Time Limit Exceeded">
                                        Time Limit Exceeded
                                    </option>
                                    <option value="Runtime Error">
                                        Runtime Error
                                    </option>
                                    <option value="Compilation Error">
                                        Compilation Error
                                    </option>
                                </select>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: "100%" }}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                <Send size={16} />
                                {submitting
                                    ? "Submitting..."
                                    : "Record Submission"}
                            </button>
                            {message && (
                                <p
                                    style={{
                                        marginTop: 12,
                                        fontSize: 13,
                                        textAlign: "center",
                                        color: message.startsWith("✅")
                                            ? "var(--accent-green)"
                                            : "var(--accent-red)",
                                    }}
                                >
                                    {message}
                                </p>
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
