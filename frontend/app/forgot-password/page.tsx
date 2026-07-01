"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Resp = { message: string; reset_link?: string | null };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<Resp>("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
      setResetLink(res.reset_link || null);
      setDone(true);
    } catch {
      setDone(true); // still show the generic success message
    } finally {
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
            {!done ? (
              <>
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <MailCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                <h1 className="text-xl font-bold">Check your email</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way (valid for 30 minutes).
                </p>
                {resetLink && (() => {
                  const path = resetLink.replace(/^https?:\/\/[^/]+/, "");
                  const display = typeof window !== "undefined" ? window.location.origin + path : resetLink;
                  return (
                    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-left">
                      <p className="text-xs font-semibold text-amber-400">Demo mode (no email service configured)</p>
                      <p className="mt-1 text-xs text-muted-foreground">Use this link to reset now:</p>
                      <Link href={path} className="mt-1 block break-all text-xs font-medium text-primary hover:underline">
                        {display}
                      </Link>
                    </div>
                  );
                })()}
              </div>
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
