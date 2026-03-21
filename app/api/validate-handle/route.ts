import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform"); // "codeforces" or "leetcode"
  const handle = searchParams.get("handle");

  if (!platform || !handle) {
    return NextResponse.json({ valid: false, error: "Missing platform or handle" }, { status: 400 });
  }

  if (platform === "codeforces") {
    try {
      const res = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
      const data = await res.json();
      if (data.status === "OK") {
        return NextResponse.json({ valid: true, handle: data.result[0].handle });
      }
      return NextResponse.json({ valid: false, error: "Codeforces handle not found" });
    } catch {
      return NextResponse.json({ valid: false, error: "Could not reach Codeforces" });
    }
  }

  if (platform === "leetcode") {
    try {
      const res = await fetch(
        `https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(handle)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) {
        return NextResponse.json({ valid: false, error: "LeetCode username not found" });
      }
      const data = await res.json();
      // The proxy returns totalSolved for valid users
      if (data.totalSolved !== undefined) {
        return NextResponse.json({ valid: true });
      }
      return NextResponse.json({ valid: false, error: "LeetCode username not found" });
    } catch {
      return NextResponse.json({ valid: false, error: "Could not reach LeetCode" });
    }
  }

  return NextResponse.json({ valid: false, error: "Invalid platform" }, { status: 400 });
}
