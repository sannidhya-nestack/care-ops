"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDemoLoginId,
  getDemoLoginPass,
  getDemoSession,
  setDemoSession,
  validateDemoCredentials,
} from "@/lib/demo-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(getDemoLoginId());
  const [password, setPassword] = useState(getDemoLoginPass());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already signed in, skip the login screen.
  useEffect(() => {
    if (getDemoSession()) {
      router.replace("/");
    }
  }, [router]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateDemoCredentials(email, password)) {
      setError("Invalid credentials. Check your email and password.");
      setLoading(false);
      return;
    }

    setDemoSession(email);
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-background to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-soft">
            <HeartPulse className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">CareOps AI</h1>
            <p className="text-sm text-muted-foreground">Senior Care Operations Suite</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the platform.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@careops.ai"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Demo credentials</p>
              <p className="text-xs text-muted-foreground">Email: {getDemoLoginId()}</p>
              <p className="text-xs text-muted-foreground">Password: {getDemoLoginPass()}</p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          CareOps AI · Senior Care Operations
        </p>
      </div>
    </div>
  );
}
