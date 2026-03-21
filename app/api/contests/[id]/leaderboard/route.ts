import { NextResponse } from "next/server";
import { getContestLeaderboard } from "@/lib/analytics";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leaderboard = await getContestLeaderboard(id);
  return NextResponse.json(leaderboard);
}
