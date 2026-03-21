"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Code2, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/tailgrids/core/button";

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
                        <Code2 size={18} />
                    </div>
                    <span className="font-bold text-gray-900 tracking-tight">
                        CodeTrack
                    </span>
                </Link>

                {session && (
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            href="/dashboard"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pathname === "/dashboard"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/problems"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pathname === "/problems"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            Problems
                        </Link>
                        <Link
                            href="/leaderboard"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pathname === "/leaderboard"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            College Rank
                        </Link>
                        {(session?.user as any)?.role === "ADMIN" && (
                            <Link
                                href="/admin"
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    pathname === "/admin"
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                            >
                                Admin Console
                            </Link>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {session ? (
                        <>
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                            >
                                <User size={16} />
                                <span className="hidden sm:inline-block">
                                    {session.user?.name}
                                </span>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-gray-700 hover:text-gray-900 text-sm font-medium px-4 py-2 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link href="/register">
                                <Button
                                    color="primary"
                                    size="sm"
                                    className="font-semibold rounded-lg px-5"
                                >
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
