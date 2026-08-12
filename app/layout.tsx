import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareOps AI",
  description: "CareOps AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${dmSans.variable} font-sans`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
