import { NextResponse } from "next/server";
import { evaluateStreak } from "@/lib/analytics";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    try {
        const { currentStreak } = await evaluateStreak(userId);
        return NextResponse.json({ currentStreak });
    } catch (e) {
        return NextResponse.json({ error: "Failed to evaluate streak" }, { status: 500 });
    }
}
