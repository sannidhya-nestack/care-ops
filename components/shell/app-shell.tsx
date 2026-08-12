"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on path change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col h-full">
        {/* Mobile Header Bar */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 bg-white px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display text-lg font-semibold text-slate-900">CareOps AI</span>
          <div className="w-8" />
        </div>

        {!isDashboard && <TopBar />}
        <main className="min-h-0 flex-1 overflow-auto p-2 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

