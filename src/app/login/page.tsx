import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = { title: "Log in — Velox" };

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
