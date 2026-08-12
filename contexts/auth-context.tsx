"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { subscribeDemoAuth, type DemoUser } from "@/lib/demo-auth";

interface AuthContextValue {
  user: DemoUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeDemoAuth((demoUser) => {
      setUser(demoUser);
      setLoading(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
