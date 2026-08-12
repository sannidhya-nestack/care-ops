import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthGate } from "@/components/auth/auth-gate";
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
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
