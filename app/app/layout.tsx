import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Agent Console",
  description: "Remote control for Claude Code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500/30`}>
        <div className="max-w-4xl mx-auto p-6">
          <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Agent Console
            </h1>
            <div className="flex gap-4">
              <a href="/" className="text-sm font-medium hover:text-white text-slate-400 transition-colors">Dashboard</a>
              <a href="/new" className="text-sm font-medium hover:text-white text-slate-400 transition-colors">New Job</a>
              <a href="/settings" className="text-sm font-medium hover:text-white text-slate-400 transition-colors">Settings</a>
              <a href="/antigravity" className="text-sm font-medium hover:text-white text-slate-400 transition-colors">Brain</a>
            </div>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
