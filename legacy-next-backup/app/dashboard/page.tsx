"use client";

import Navbar from "@/components/Navbar";
import DashboardView from "@/components/DashboardView";

export default function DedicatedDashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] relative z-10 transition-colors duration-300">
      <Navbar isDashboardActive={true} />
      <DashboardView isStandalonePage={true} />
    </main>
  );
}
