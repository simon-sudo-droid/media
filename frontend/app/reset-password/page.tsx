"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { api, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setTok] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setTok(t);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const res = await api<{ access_token: string }>("/auth/reset-password", {
        method: "POST", body: { token, password }, auth: false,
      });
      setToken(res.access_token);   // log in with the new password
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "This reset link is invalid or has expired.");
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 glow" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">EditMentor<span className="text-gradient"> AI</span></span>
        </Link>
        <Card>
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
            {!token ? (
              <p className="mt-6 text-sm text-red-400">Missing reset token. Open the reset link from your email again.</p>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                  {loading ? "Resetting…" : "Reset password"}
                </Button>
              </form>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">Back to log in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
