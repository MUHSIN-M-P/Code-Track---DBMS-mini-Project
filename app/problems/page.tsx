"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, ExternalLink, Code2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";
import { Input } from "@/components/tailgrids/core/input";

interface Problem {
  id: string;
  title: string;
  platform: string;
  platformId: string;
  difficulty: string;
  url?: string;
}

export default function ProblemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (difficulty) params.set("difficulty", difficulty);
    if (platform) params.set("platform", platform);

    fetch(`/api/problems?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProblems(data);
        setLoading(false);
      })
      .catch(() => {
        setProblems([]);
        setLoading(false);
      });
  }, [search, difficulty, platform]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY": return "success";
      case "MEDIUM": return "warning";
      case "HARD": return "error";
      default: return "gray";
    }
  };

  const getPlatformColor = (plat: string) => {
    return plat === "CODEFORCES" ? "primary" : "sky";
  };

  const generatePlatformUrl = (problem: Problem) => {
    if (problem.url) return problem.url;

    if (problem.platform === "CODEFORCES") {
      return `https://codeforces.com/problemset/problem/${problem.platformId.match(/(\d+)([A-Z].*)/)?.[1] || ""}/${problem.platformId.match(/(\d+)([A-Z].*)/)?.[2] || ""}`;
    } else if (problem.platform === "LEETCODE") {
      return `https://leetcode.com/problems/${problem.platformId}/`;
    }
    return "#";
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin text-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl bg-gray-50 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Problem Recommendations
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Curated problems from Codeforces & LeetCode to strengthen your skills
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8 shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                className="pl-10"
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">All Platforms</option>
              <option value="CODEFORCES">Codeforces</option>
              <option value="LEETCODE">LeetCode</option>
            </select>
            <select
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter size={16} />
              <span>{problems.length} problems</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problem Table */}
      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Problem</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Platform</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Difficulty</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Code2 size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{problem.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={getPlatformColor(problem.platform)} size="sm">
                      {problem.platform === "CODEFORCES" ? "Codeforces" : "LeetCode"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={getDifficultyColor(problem.difficulty)} size="sm">
                      {problem.difficulty}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {problem.platformId}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={generatePlatformUrl(problem)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span>Solve</span>
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))}
              {problems.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Code2 size={48} className="mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
                      <p className="text-sm text-gray-600">Try adjusting your filters or search terms</p>
                    </div>
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
