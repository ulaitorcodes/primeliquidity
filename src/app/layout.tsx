import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SessionRestorer } from "@/components/auth/session-restorer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Prime Liquidity",
    template: "%s | Prime Liquidity",
  },
  description:
    "Trade and asset financing for businesses and families. Get what you need today and pay over time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ToastProvider>
          <SessionRestorer />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}