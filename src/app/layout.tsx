import type { Metadata, Viewport } from "next";
import { Dancing_Script, Inter } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import SmoothScroll from "@/components/SmoothScroll";
import { Toasts } from "@/components/Modals";
import AuthTransition from "@/components/AuthTransition";

const inter = Inter({ subsets: ["latin"], variable: "--font-fallback", display: "swap" });
const sign = Dancing_Script({ subsets: ["latin"], variable: "--font-sign", display: "swap", weight: ["600"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Velox — Choose your comfortable credit plan",
  description:
    "Explore customizable lending products with automated schedules, fixed rates, simple terms, and zero unexpected charges.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sign.variable}`}>
      <body>
        <StoreProvider>
          <SmoothScroll />
          {children}
          <AuthTransition />
          <Toasts />
        </StoreProvider>
      </body>
    </html>
  );
}
