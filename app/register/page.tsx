"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/tailgrids/core/card";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed");
                setLoading(false);
                return;
            }

            // Auto-login after registration
            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Card className="max-w-md w-full shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl font-extrabold text-gray-900">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Join CodeTrack and start practicing today
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <Input
                                type="text"
                                placeholder="john_doe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <Input
                                type="password"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            color="primary"
                            disabled={loading}
                            className="w-full py-2.5 mt-2 font-bold flex items-center justify-center gap-2 rounded-lg shadow-md"
                        >
                            <UserPlus size={18} />
                            {loading ? "Creating account..." : "Create Account"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                        >
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
