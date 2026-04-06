import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@codetrack.io" },
        update: {},
        create: {
            username: "admin",
            email: "admin@codetrack.io",
            passwordHash: adminPassword,
            role: "admin",
            currentStreak: 0,
            longestStreak: 0,
        },
    });

    // Create regular user
    const userPassword = await bcrypt.hash("user123", 12);
    const user = await prisma.user.upsert({
        where: { email: "john@codetrack.io" },
        update: {},
        create: {
            username: "john",
            email: "john@codetrack.io",
            passwordHash: userPassword,
            role: "user",
            preferredLang: "python",
            currentStreak: 5,
            longestStreak: 12,
            lastActiveDate: new Date(),
        },
    });

    // Create topics
    const topicsData = [
        { name: "Arrays" },
        { name: "Strings" },
        { name: "Dynamic Programming" },
        { name: "Graphs" },
        { name: "Trees" },
        { name: "Sorting" },
        { name: "Binary Search" },
        { name: "Linked Lists" },
        { name: "Stack" },
        { name: "Greedy" },
    ];

    const topics = [];
    for (const t of topicsData) {
        const topic = await prisma.topic.upsert({
            where: { name: t.name },
            update: {},
            create: t,
        });
        topics.push(topic);
    }

    // Create problems
    const problemsData = [
        {
            title: "Two Sum",
            difficulty: "Easy",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample: nums = [2,7,11,15], target = 9 -> [0,1]",
            topics: ["Arrays"],
        },
        {
            title: "Valid Parentheses",
            difficulty: "Easy",
            description:
                "Given a string s containing '(){}[]', determine if the input string is valid.",
            topics: ["Stack", "Strings"],
        },
        {
            title: "Longest Substring Without Repeating Characters",
            difficulty: "Medium",
            description:
                "Given a string s, find the length of the longest substring without repeating characters.",
            topics: ["Strings"],
        },
        {
            title: "Merge Two Sorted Lists",
            difficulty: "Easy",
            description: "Merge two sorted linked lists into one sorted list.",
            topics: ["Linked Lists"],
        },
        {
            title: "Maximum Subarray",
            difficulty: "Medium",
            description: "Find the contiguous subarray with the largest sum.",
            topics: ["Arrays", "Dynamic Programming"],
        },
        {
            title: "Binary Tree Level Order Traversal",
            difficulty: "Medium",
            description: "Return the level order traversal of a binary tree.",
            topics: ["Trees"],
        },
        {
            title: "Longest Common Subsequence",
            difficulty: "Medium",
            description:
                "Return the length of the longest common subsequence of two strings.",
            topics: ["Dynamic Programming", "Strings"],
        },
        {
            title: "Number of Islands",
            difficulty: "Medium",
            description: "Count the number of islands in a grid.",
            topics: ["Graphs"],
        },
        {
            title: "Merge Sort",
            difficulty: "Medium",
            description: "Implement merge sort for an array.",
            topics: ["Sorting"],
        },
        {
            title: "Binary Search",
            difficulty: "Easy",
            description: "Given a sorted array and target, return index or -1.",
            topics: ["Binary Search", "Arrays"],
        },
        {
            title: "Edit Distance",
            difficulty: "Hard",
            description:
                "Return minimum operations to convert one string to another.",
            topics: ["Dynamic Programming", "Strings"],
        },
        {
            title: "Dijkstra's Shortest Path",
            difficulty: "Hard",
            description:
                "Compute shortest paths from a source in a non-negative weighted graph.",
            topics: ["Graphs", "Greedy"],
        },
    ];

    const problems = [];
    for (const p of problemsData) {
        const problem = await prisma.problem.upsert({
            where: { title: p.title },
            update: {},
            create: {
                title: p.title,
                description: p.description,
                difficulty: p.difficulty,
            },
        });
        problems.push(problem);

        for (const topicName of p.topics) {
            const topic = topics.find((t) => t.name === topicName);
            if (topic) {
                await prisma.problemTopic.upsert({
                    where: {
                        problemId_topicId: {
                            problemId: problem.id,
                            topicId: topic.id,
                        },
                    },
                    update: {},
                    create: { problemId: problem.id, topicId: topic.id },
                });
            }
        }
    }

    // Create some submissions for John (and populate cached tables used by dashboard/leaderboard)
    const verdicts = [
        "Accepted",
        "WrongAnswer",
        "Accepted",
        "TimeLimitExceeded",
        "Accepted",
    ];
    for (let i = 0; i < Math.min(5, problems.length); i++) {
        const verdict = verdicts[i];
        const submittedAt = new Date(Date.now() - (5 - i) * 86400000);

        await prisma.$transaction(async (tx) => {
            const submission = await tx.submission.create({
                data: {
                    userId: user.id,
                    problemId: problems[i].id,
                    language: "python",
                    verdict,
                    submittedAt,
                },
            });

            await tx.problem.update({
                where: { id: problems[i].id },
                data: {
                    totalSubmissions: { increment: 1 },
                    ...(verdict === "Accepted"
                        ? { totalAccepted: { increment: 1 } }
                        : {}),
                },
            });

            const existingStatus = await tx.userProblemStatus.findUnique({
                where: {
                    userId_problemId: {
                        userId: user.id,
                        problemId: problems[i].id,
                    },
                },
                select: { isSolved: true },
            });

            const isFirstAttempt = !existingStatus;
            const isNewSolve =
                verdict === "Accepted" &&
                (!existingStatus || !existingStatus.isSolved);

            if (!existingStatus) {
                await tx.userProblemStatus.create({
                    data: {
                        userId: user.id,
                        problemId: problems[i].id,
                        isSolved: verdict === "Accepted",
                        firstAcceptedAt:
                            verdict === "Accepted"
                                ? submission.submittedAt
                                : null,
                    },
                });
            } else if (isNewSolve) {
                await tx.userProblemStatus.update({
                    where: {
                        userId_problemId: {
                            userId: user.id,
                            problemId: problems[i].id,
                        },
                    },
                    data: {
                        isSolved: true,
                        firstAcceptedAt: submission.submittedAt,
                    },
                });
            }

            const topicLinks = await tx.problemTopic.findMany({
                where: { problemId: problems[i].id },
                select: { topicId: true },
            });

            for (const link of topicLinks) {
                await tx.topicPerformance.upsert({
                    where: {
                        userId_topicId: {
                            userId: user.id,
                            topicId: link.topicId,
                        },
                    },
                    update: {
                        ...(isFirstAttempt
                            ? { attempted: { increment: 1 } }
                            : {}),
                        ...(isNewSolve ? { solved: { increment: 1 } } : {}),
                    },
                    create: {
                        userId: user.id,
                        topicId: link.topicId,
                        attempted: isFirstAttempt ? 1 : 0,
                        solved: isNewSolve ? 1 : 0,
                    },
                });
            }
        });
    }

    // Create a contest
    const contestStart = new Date(Date.now() + 86400000);
    const contestTitle = "Weekly Challenge #1";
    const contestEnd = new Date(contestStart.getTime() + 90 * 60000);

    const contest = await prisma.contest.upsert({
        where: { title: contestTitle },
        update: {
            startTime: contestStart,
            endTime: contestEnd,
            createdById: admin.id,
        },
        create: {
            title: contestTitle,
            startTime: contestStart,
            endTime: contestEnd,
            createdById: admin.id,
        },
    });

    const contestProblemRows = [
        { problemId: problems[0].id, order: 1 },
        { problemId: problems[2].id, order: 2 },
        { problemId: problems[4].id, order: 3 },
    ];

    for (const row of contestProblemRows) {
        await prisma.contestProblem.upsert({
            where: {
                contestId_problemId: {
                    contestId: contest.id,
                    problemId: row.problemId,
                },
            },
            update: { order: row.order },
            create: {
                contestId: contest.id,
                problemId: row.problemId,
                order: row.order,
            },
        });
    }

    await prisma.contestRegistration.upsert({
        where: {
            userId_contestId: { userId: user.id, contestId: contest.id },
        },
        update: {},
        create: { userId: user.id, contestId: contest.id },
    });

    console.log("✅ Seed completed successfully!");
    console.log("   Admin: admin@codetrack.io / admin123");
    console.log("   User: john@codetrack.io / user123");
    console.log(
        `   ${topics.length} topics, ${problems.length} problems, 1 contest created`,
    );
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
