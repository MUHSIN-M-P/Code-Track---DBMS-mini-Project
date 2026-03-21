import Link from "next/link";
import { Code2, BarChart3, Trophy, Flame, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";

export default function HomePage() {
    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden pt-20 pb-24 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

                <div className="container max-w-4xl mx-auto px-6 z-10">
                    <Badge
                        color="primary"
                        size="lg"
                        className="mb-6 px-4 py-2 border border-blue-200 font-semibold uppercase tracking-wider"
                    >
                        <Flame size={16} className="text-blue-600" />
                        <span className="text-blue-700">
                            The Ultimate Hub For Code Athletes
                        </span>
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
                        Master Algorithms.
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Track Progress.
                        </span>
                        <br />
                        Reach The Top.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                        The all-in-one competitive programming platform. Connect
                        Codeforces & LeetCode, analyze your weak topics, view
                        real-time college rankings, and accelerate your
                        competitive programming journey.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all w-full sm:w-auto"
                        >
                            Start Tracking Now
                        </Link>
                        <Link
                            href="/leaderboard"
                            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all w-full sm:w-auto"
                        >
                            View Leaderboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="container mx-auto px-6 py-16 bg-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    <Card className="text-center shadow-md border-t-4 border-t-blue-500">
                        <Target
                            size={28}
                            className="mx-auto text-blue-600 mb-3"
                        />
                        <div className="text-3xl font-extrabold text-gray-900 mb-1">
                            5K+
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Indexed Problems
                        </div>
                    </Card>
                    <Card className="text-center shadow-md border-t-4 border-t-purple-500">
                        <Users
                            size={28}
                            className="mx-auto text-purple-600 mb-3"
                        />
                        <div
                            className="text-3xl font-extrabold text-gray

-900 mb-1"
                        >
                            2.5K
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Active Users
                        </div>
                    </Card>
                    <Card className="text-center shadow-md border-t-4 border-t-yellow-500">
                        <Trophy
                            size={28}
                            className="mx-auto text-yellow-600 mb-3"
                        />
                        <div className="text-3xl font-extrabold text-gray-900 mb-1">
                            Top 1%
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            College Ranks
                        </div>
                    </Card>
                    <Card className="text-center shadow-md border-t-4 border-t-red-500">
                        <Flame
                            size={28}
                            className="mx-auto text-red-600 mb-3"
                        />
                        <div className="text-3xl font-extrabold text-gray-900 mb-1">
                            1M+
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Submissions
                        </div>
                    </Card>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-6 py-20 bg-gray-50">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Everything You Need to{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Level Up
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        CodeTrack aggregates your coding persona into one
                        powerful, unified dashboard.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <Card className="hover:shadow-xl transition-shadow">
                        <CardContent>
                            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                                <BarChart3 size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Unified Deep Analytics
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                Connect your Codeforces and LeetCode accounts to
                                visualize per-topic performance, global
                                acceptance rates, and submission history in one
                                place.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-xl transition-shadow">
                        <CardContent>
                            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                                <Target size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                AI Weak Topic Detection
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                Our engine analyzes your past Codeforces
                                submissions to highlight weak areas (like DP or
                                Game Theory) where your accuracy drops below
                                threshold.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-xl transition-shadow">
                        <CardContent>
                            <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 mb-4">
                                <Trophy size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Global Leaderboards
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                See where you stand among your peers. Dynamic
                                leaderboards rank users by Codeforces ELO
                                ratings and total aggregate problems solved
                                across all platforms.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-8">
                <div className="container mx-auto px-6 text-center text-gray-500 text-sm font-medium">
                    CodeTrack &copy; 2026 — Built for competitive programmers,
                    by competitive programmers.
                </div>
            </footer>
        </>
    );
}
