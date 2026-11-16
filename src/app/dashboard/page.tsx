import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard — Velox",
  description: "Your Velox card, loans, spending analytics and credit score in one place.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
