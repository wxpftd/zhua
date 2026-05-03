import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Research Reports — ZHUA",
  description: "Public research reports published by the ZHUA research team.",
  robots: { index: true, follow: true },
};

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="reports-shell">
      <header className="reports-topbar">
        <Link href="/reports" className="reports-brand">
          ZHUA · Research
        </Link>
        <p className="reports-tagline">Public reports from the ZHUA research team.</p>
      </header>
      {children}
    </div>
  );
}
