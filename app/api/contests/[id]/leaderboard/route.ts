import { NextResponse } from "next/server";
import { getContestLeaderboard } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Check if contest has ended — if so, serve/finalize leaderboard_entries
    const contest = await prisma.contest.findUnique({
        where: { id },
        select: { endTime: true, startTime: true },
    });

    if (!contest) {
        return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const now = new Date();
    const hasEnded = now > new Date(contest.endTime);

    if (hasEnded) {
        // Check if already finalized
        const existingFinal = await prisma.leaderboardEntry.findFirst({
            where: { contestId: id, isFinal: true },
        });

        if (!existingFinal) {
            // Compute leaderboard and write is_final entries
            const liveData = await getContestLeaderboard(id);

            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < liveData.length; i++) {
                    const entry = liveData[i];
                    await tx.leaderboardEntry.upsert({
                        where: { contestId_userId: { contestId: id, userId: entry.userId } },
                        update: {
                            problemsSolved: entry.problemsSolved,
                            penaltyTime: entry.penaltyTime,
                            rank: i + 1,
                            isFinal: true,
                        },
                        create: {
                            contestId: id,
                            userId: entry.userId,
                            problemsSolved: entry.problemsSolved,
                            penaltyTime: entry.penaltyTime,
                            rank: i + 1,
                            isFinal: true,
                        },
                    });
                }
            });
        }

        // Return the finalized entries
        const finalEntries = await prisma.leaderboardEntry.findMany({
            where: { contestId: id, isFinal: true },
            include: { user: { select: { id: true, username: true } } },
            orderBy: { rank: "asc" },
        });

        return NextResponse.json(
            finalEntries.map((e) => ({
                userId: e.userId,
                userName: e.user.username,
                problemsSolved: e.problemsSolved,
                penaltyTime: e.penaltyTime,
                rank: e.rank,
                isFinal: e.isFinal,
            }))
        );
    }

    // Contest still live — return dynamic computation
    const leaderboard = await getContestLeaderboard(id);
    return NextResponse.json(leaderboard);
}
