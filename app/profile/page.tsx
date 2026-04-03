"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Save } from "lucide-react";
import { Card, CardContent } from "@/components/tailgrids/core/card";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [preferredLang, setPreferredLang] = useState("cpp");

    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const isAdmin = (session?.user as any)?.role === "admin";

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (session?.user) {
            const userId = (session.user as { id: string }).id;
            fetch(`/api/users/${userId}`)
                .then((r) => r.json())
                .then((data) => {
                    if (data.username) setUsername(data.username);
                    if (data.preferredLang)
                        setPreferredLang(data.preferredLang);
                });
        }
    }, [session, status, router]);

    const handleSave = async () => {
        setSaving(true);
        setMessage("");

        if (newPassword || currentPassword) {
            if (!currentPassword) {
                setMessage(
                    "❌ Please enter your current password to change it.",
                );
                setSaving(false);
                return;
            }
            if (newPassword !== confirmPassword) {
                setMessage("❌ New passwords do not match.");
                setSaving(false);
                return;
            }
        }

        const userId = (session?.user as { id: string })?.id;

        const res = await fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                preferredLang,
                currentPassword,
                newPassword,
            }),
        });

        if (res.ok) {
            setMessage(
                "✅ Profile updated! (You may need to re-login if you changed your username.)",
            );
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            const errorData = await res.json().catch(() => ({}));
            setMessage(`❌ ${errorData.error || "Update failed"}`);
        }
        setSaving(false);
    };

    const handleDeleteAccount = async () => {
        if (
            confirm(
                "Are you sure you want to permanently delete your account? This action cannot be undone.",
            )
        ) {
            const userId = (session?.user as { id: string })?.id;
            if (!userId) return;
            const res = await fetch(`/api/users/${userId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                signOut({ callbackUrl: "/register" });
            } else {
                setMessage("❌ Failed to delete account.");
            }
        }
    };

    if (status === "loading")
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin text-blue-600"></div>
            </div>
        );

    return (
        <div className="container mx-auto px-6 py-12 max-w-2xl bg-gray-50 min-h-screen">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-3">
                    Profile Settings
                </h1>
                <p className="text-lg text-gray-600">
                    Manage your account and preferences
                </p>
            </div>

            <Card className="shadow-xl">
                <CardContent className="pt-8">
                    <div className="flex items-center gap-5 pb-6 border-b border-gray-200 mb-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <User size={32} />
                        </div>
                        <div>
                            <div className="font-bold text-xl text-gray-900">
                                {session?.user?.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                {session?.user?.email}
                                {isAdmin && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-semibold tracking-wide">
                                        ADMIN
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Preferred Language
                            </label>
                            <select
                                className="w-full bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg px-4 py-2.5 outline-none"
                                value={preferredLang}
                                onChange={(e) =>
                                    setPreferredLang(e.target.value)
                                }
                            >
                                <option value="cpp">C++</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="javascript">JavaScript</option>
                                <option value="c">C</option>
                            </select>
                        </div>

                        <div className="pt-6 mt-6 border-t border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">
                                Security Settings
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Current Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        placeholder="Enter current password"
                                        className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Required only if you are changing your
                                        password.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            New Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(e.target.value)
                                            }
                                            placeholder="Enter new password"
                                            className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Confirm New Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Confirm new password"
                                            className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <Button
                                color="primary"
                                onClick={handleSave}
                                disabled={saving}
                                className="py-2.5 px-6 font-bold flex items-center justify-center gap-2 rounded-lg shadow-md"
                            >
                                <Save size={18} />
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>

                            {message && (
                                <span
                                    className={`text-sm font-medium ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}
                                >
                                    {message}
                                </span>
                            )}
                        </div>

                        <div className="pt-10 mt-10 border-t border-red-200">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-red-50 rounded-xl border border-red-100">
                                <div>
                                    <h3 className="text-lg font-bold text-red-700">
                                        Delete Account
                                    </h3>
                                    <p className="text-sm text-red-600 mt-1">
                                        Permanently delete your account and all
                                        associated data.
                                    </p>
                                </div>
                                <Button
                                    color="error"
                                    onClick={handleDeleteAccount}
                                    className="w-full sm:w-auto font-semibold shadow-md whitespace-nowrap px-6 py-2.5 rounded-lg border border-red-200"
                                >
                                    Delete My Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
