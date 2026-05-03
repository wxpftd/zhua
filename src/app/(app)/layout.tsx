import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ZHUA — Founder Log",
  description: "Daily founder log: notes, decisions, weekly review, hypothesis ledger.",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/today" className="brand">
          ZHUA
        </Link>
        <nav>
          <Link href="/today">Today</Link>
          <Link href="/review">Weekly review</Link>
          <Link href="/hypotheses">Hypotheses</Link>
        </nav>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
