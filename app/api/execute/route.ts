import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predefinedTestCases, fallbackTestCases } from "@/lib/testcases";

// Judge0 CE community instance - free, no API key needed
const JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

// Language IDs from https://ce.judge0.com/languages
const languageIds: Record<string, number> = {
    c:          48,  // C (GCC 7.4.0)
    cpp:        54,  // C++ (GCC 9.2.0)
    python:     71,  // Python (3.8.1)
    java:       62,  // Java (OpenJDK 13.0.1)
    javascript: 63,  // JavaScript (Node.js 12.14.0)
};

// Judge0 status IDs
const STATUS: Record<number, string> = {
    1:  "In Queue",
    2:  "Processing",
    3:  "Accepted",
    4:  "Wrong Answer",
    5:  "Time Limit Exceeded",
    6:  "Compilation Error",
    7:  "Runtime Error",
    8:  "Runtime Error",
    9:  "Runtime Error",
    10: "Runtime Error",
    11: "Runtime Error",
    12: "Runtime Error",
    13: "Internal Error",
    14: "Exec Format Error",
};

export async function POST(req: Request) {
    try {
        const { problemId, language, code } = await req.json();

        if (!problemId || !language || !code) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const languageId = languageIds[language];
        if (!languageId) {
            return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
        }

        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            select: { title: true }
        });

        if (!problem) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }

        const testSet = predefinedTestCases[problem.title] ?? fallbackTestCases;
        const isFallback = testSet === fallbackTestCases;

        for (const tc of testSet.cases) {
            let judge0Res: Response;
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);

                judge0Res = await fetch(JUDGE0_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source_code: code,
                        language_id: languageId,
                        stdin: tc.stdin ?? "",
                    }),
                    signal: controller.signal,
                });
                clearTimeout(timeout);
            } catch (err: unknown) {
                const isAbort = err instanceof Error && err.name === "AbortError";
                return NextResponse.json(
                    { error: isAbort ? "Execution timed out (>15s)" : "Could not reach execution server" },
                    { status: 503 }
                );
            }

            if (!judge0Res.ok) {
                const errText = await judge0Res.text().catch(() => "");
                console.error(`Judge0 HTTP ${judge0Res.status}:`, errText);
                return NextResponse.json(
                    { error: `Execution server error (HTTP ${judge0Res.status}). Try again in a moment.` },
                    { status: 502 }
                );
            }

            const data = await judge0Res.json();
            const statusId: number = data.status?.id ?? 0;
            const statusDesc: string = STATUS[statusId] ?? "Unknown";

            // Compilation error
            if (statusId === 6) {
                return NextResponse.json({
                    verdict: "Compilation Error",
                    output: data.compile_output ?? "Compilation failed"
                });
            }

            // Time Limit Exceeded
            if (statusId === 5) {
                return NextResponse.json({ verdict: "Time Limit Exceeded", output: "" });
            }

            // Runtime errors (7–12)
            if (statusId >= 7 && statusId <= 12) {
                return NextResponse.json({
                    verdict: "Runtime Error",
                    output: data.stderr ?? data.message ?? `Runtime Error (status ${statusId})`
                });
            }

            // For fallback mode: if it ran without crashing, continue
            if (statusId === 3 && isFallback) {
                continue;
            }

            // Accepted — but check output for non-fallback
            if (statusId === 3 && !isFallback) {
                const actualOutput = (data.stdout ?? "").trim();
                const expectedOutput = (tc.expected ?? "").trim();
                if (actualOutput !== expectedOutput) {
                    return NextResponse.json({
                        verdict: "Wrong Answer",
                        output: `Expected:\n${expectedOutput}\n\nGot:\n${actualOutput}`
                    });
                }
                continue; // this test case passed
            }

            // Any other non-accepted status
            if (statusId !== 3) {
                return NextResponse.json({
                    verdict: "Runtime Error",
                    output: data.stderr ?? data.message ?? statusDesc
                });
            }
        }

        return NextResponse.json({
            verdict: "Accepted",
            output: isFallback
                ? "Code compiled and ran successfully."
                : "All test cases passed ✅"
        });

    } catch (error) {
        console.error("Execute API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
