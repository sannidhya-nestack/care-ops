"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { useAuth } from "@/contexts/auth-context";

const PUBLIC_ROUTES = ["/login"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isPublic && !loading && !user) {
      router.replace("/login");
    }
  }, [isPublic, loading, user, router]);

  // Public routes (login) render standalone — no shell, no guard.
  if (isPublic) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
