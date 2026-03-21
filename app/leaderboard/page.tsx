"use client";
import { useState, useEffect } from "react";
import { Trophy, Code, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";

interface UserRank {
  id: string;
  name: string;
  codeforcesHandle: string | null;
  cfRating: number;
  totalSolved: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin text-blue-600"></div>
      </div>
    );
  }

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return "warning";
    if (index === 1) return "gray";
    if (index === 2) return "orange";
    return "gray";
  };

  const getCFRatingColor = (rating: number) => {
    if (rating >= 2400) return "text-red-600 font-bold";
    if (rating >= 2100) return "text-orange-600 font-bold";
    if (rating >= 1900) return "text-purple-600 font-bold";
    if (rating >= 1600) return "text-blue-600 font-bold";
    if (rating >= 1400) return "text-cyan-600 font-bold";
    if (rating >= 1200) return "text-green-600 font-bold";
    return "text-gray-500 font-bold";
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl bg-gray-50 min-h-screen">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 mb-6 shadow-lg">
          <Trophy className="text-white w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
          College Leaderboard
        </h1>
        <p className="max-w-xl mx-auto text-lg text-gray-600">
          Ranked by Codeforces Rating and combined platform problems solved.
        </p>
      </div>

      <Card className="shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">Coder</th>
                <th className="px-6 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Award size={16} /> CF Rating
                  </div>
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Code size={16} /> Total Solved
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, i) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Badge color={getRankBadgeColor(i) as any} size="lg" className="w-8 h-8 rounded-full flex justify-center items-center p-0 font-bold">
                      {i + 1}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-gray-900 font-semibold">{user.name}</div>
                        {user.codeforcesHandle && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            CF: <span className={getCFRatingColor(user.cfRating)}>{user.codeforcesHandle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-lg ${getCFRatingColor(user.cfRating)}`}>
                      {user.cfRating > 0 ? user.cfRating : "Unrated"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge color="primary" size="md" className="font-bold">
                      {user.totalSolved}
                    </Badge>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No coders found. Be the first to join the leaderboard!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
