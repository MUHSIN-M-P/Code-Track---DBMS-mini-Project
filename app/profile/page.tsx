"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { User, Save, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/tailgrids/core/card";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [preferredLang, setPreferredLang] = useState("cpp");
  const [codeforcesHandle, setCodeforcesHandle] = useState("");
  const [leetcodeHandle, setLeetcodeHandle] = useState("");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Validation states
  const [validatingCF, setValidatingCF] = useState(false);
  const [validatingLC, setValidatingLC] = useState(false);
  const [cfValid, setCfValid] = useState<boolean | null>(null);
  const [lcValid, setLcValid] = useState<boolean | null>(null);
  const [cfError, setCfError] = useState("");
  const [lcError, setLcError] = useState("");

  // Track the original saved handles to avoid re-validating unchanged values
  const [savedCF, setSavedCF] = useState("");
  const [savedLC, setSavedLC] = useState("");

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user) {
      const userId = (session.user as { id: string }).id;
      fetch(`/api/users/${userId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.name) setName(data.name);
          if (data.preferredLang) setPreferredLang(data.preferredLang);
          if (data.codeforcesHandle) {
            setCodeforcesHandle(data.codeforcesHandle);
            setSavedCF(data.codeforcesHandle);
            setCfValid(true); // Already saved = already valid
          }
          if (data.leetcodeHandle) {
            setLeetcodeHandle(data.leetcodeHandle);
            setSavedLC(data.leetcodeHandle);
            setLcValid(true);
          }
        });
    }
  }, [session, status, router]);

  // Validate a handle via the server-side API
  const validateHandle = useCallback(async (platform: "codeforces" | "leetcode", handle: string) => {
    if (!handle.trim()) return { valid: true, error: "" };
    try {
      const res = await fetch(`/api/validate-handle?platform=${platform}&handle=${encodeURIComponent(handle)}`);
      const data = await res.json();
      return { valid: data.valid as boolean, error: data.error || "" };
    } catch {
      return { valid: false, error: `Could not validate ${platform} handle` };
    }
  }, []);

  // On-blur validation for Codeforces
  const handleCFBlur = useCallback(async () => {
    const handle = codeforcesHandle.trim();
    if (!handle) {
      setCfValid(null);
      setCfError("");
      return;
    }
    // Skip if unchanged from saved value
    if (handle === savedCF) {
      setCfValid(true);
      setCfError("");
      return;
    }
    setValidatingCF(true);
    setCfError("");
    const result = await validateHandle("codeforces", handle);
    setCfValid(result.valid);
    setCfError(result.valid ? "" : result.error);
    setValidatingCF(false);
  }, [codeforcesHandle, savedCF, validateHandle]);

  // On-blur validation for LeetCode
  const handleLCBlur = useCallback(async () => {
    const handle = leetcodeHandle.trim();
    if (!handle) {
      setLcValid(null);
      setLcError("");
      return;
    }
    if (handle === savedLC) {
      setLcValid(true);
      setLcError("");
      return;
    }
    setValidatingLC(true);
    setLcError("");
    const result = await validateHandle("leetcode", handle);
    setLcValid(result.valid);
    setLcError(result.valid ? "" : result.error);
    setValidatingLC(false);
  }, [leetcodeHandle, savedLC, validateHandle]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        setMessage("❌ Please enter your current password to change it.");
        setSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage("❌ New passwords do not match.");
        setSaving(false);
        return;
      }
    }

    if (!isAdmin) {
      // Run validation if not already validated
      if (codeforcesHandle.trim() && cfValid === null) {
        setValidatingCF(true);
        const result = await validateHandle("codeforces", codeforcesHandle);
        setCfValid(result.valid);
        setCfError(result.valid ? "" : result.error);
        setValidatingCF(false);
        if (!result.valid) {
          setSaving(false);
          return;
        }
      } else if (cfValid === false) {
        setMessage("❌ Fix the invalid Codeforces handle first");
        setSaving(false);
        return;
      }

      if (leetcodeHandle.trim() && lcValid === null) {
        setValidatingLC(true);
        const result = await validateHandle("leetcode", leetcodeHandle);
        setLcValid(result.valid);
        setLcError(result.valid ? "" : result.error);
        setValidatingLC(false);
        if (!result.valid) {
          setSaving(false);
          return;
        }
      } else if (lcValid === false) {
        setMessage("❌ Fix the invalid LeetCode username first");
        setSaving(false);
        return;
      }
    }

    const userId = (session?.user as { id: string })?.id;

    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name, 
        preferredLang, 
        ...(!isAdmin ? { codeforcesHandle, leetcodeHandle } : {}),
        currentPassword,
        newPassword
      }),
    });

    if (res.ok) {
      setMessage("✅ Profile updated!");
      setSavedCF(codeforcesHandle);
      setSavedLC(leetcodeHandle);
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
    if (confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      const userId = (session?.user as { id: string })?.id;
      if (!userId) return;
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
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
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-3">Profile Settings</h1>
        <p className="text-lg text-gray-600">Manage your account and preferences</p>
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
                {isAdmin && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-semibold tracking-wide">ADMIN</span>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Display Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Preferred Language</label>
              <select
                className="w-full bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg px-4 py-2.5 outline-none"
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
              >
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="c">C</option>
              </select>
            </div>

            {!isAdmin && (
              <div className="pt-6 mt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Platform Integrations</h3>

                <div className="space-y-6">
                  {/* Codeforces Handle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Codeforces Handle</label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="e.g., tourist"
                        value={codeforcesHandle}
                        onChange={(e) => {
                          setCodeforcesHandle(e.target.value);
                          setCfValid(null);
                          setCfError("");
                        }}
                        onBlur={handleCFBlur}
                        className={`w-full bg-white text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5 pr-10 ${
                          cfValid === false ? "border-red-400" : cfValid === true ? "border-green-400" : "border-gray-300"
                        }`}
                      />
                      {validatingCF && (
                        <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-spin" />
                      )}
                      {!validatingCF && cfValid === true && (
                        <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                      )}
                      {!validatingCF && cfValid === false && (
                        <XCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600" />
                      )}
                    </div>
                    {cfError ? (
                      <p className="text-xs text-red-500 font-medium">{cfError}</p>
                    ) : (
                      <p className="text-xs text-gray-500">Requires a public Codeforces profile.</p>
                    )}
                  </div>

                  {/* LeetCode Handle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">LeetCode Username</label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="e.g., alex_123"
                        value={leetcodeHandle}
                        onChange={(e) => {
                          setCodeforcesHandle(e.target.value);
                          setLcValid(null);
                          setLcError("");
                        }}
                        onBlur={handleLCBlur}
                        className={`w-full bg-white text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5 pr-10 ${
                          lcValid === false ? "border-red-400" : lcValid === true ? "border-green-400" : "border-gray-300"
                        }`}
                      />
                      {validatingLC && (
                        <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-spin" />
                      )}
                      {!validatingLC && lcValid === true && (
                        <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                      )}
                      {!validatingLC && lcValid === false && (
                        <XCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600" />
                      )}
                    </div>
                    {lcError && (
                      <p className="text-xs text-red-500 font-medium">{lcError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                  />
                  <p className="text-xs text-gray-500">Required only if you are changing your password.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 rounded-lg px-4 py-2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={saving || validatingCF || validatingLC || cfValid === false || lcValid === false}
                className="py-2.5 px-6 font-bold flex items-center justify-center gap-2 rounded-lg shadow-md"
              >
                <Save size={18} />
                {saving ? "Saving..." : validatingCF || validatingLC ? "Validating..." : "Save Changes"}
              </Button>

              {message && (
                <span className={`text-sm font-medium ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                  {message}
                </span>
              )}
            </div>
            
            <div className="pt-10 mt-10 border-t border-red-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <h3 className="text-lg font-bold text-red-700">Delete Account</h3>
                  <p className="text-sm text-red-600 mt-1">Permanently delete your account and all associated data.</p>
                </div>
                <Button color="error" onClick={handleDeleteAccount} className="w-full sm:w-auto font-semibold shadow-md whitespace-nowrap px-6 py-2.5 rounded-lg border border-red-200">
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
