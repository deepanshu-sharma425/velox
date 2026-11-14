import type { Metadata, Viewport } from "next";
import "./globals.css";
import LenisSmoothScroll from "@/components/LenisSmoothScroll";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BankProvider } from "@/lib/bankStore";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080808" },
    { media: "(prefers-color-scheme: light)", color: "#F8F8F7" },
  ],
};

export const metadata: Metadata = {
  title: "VELOX — Modern Neobank & Digital Lending Platform",
  description:
    "Choose your comfortable credit plan here. Velox is an effortless digital lending platform with instant algorithmic approvals, physical velvet debit cards, and transparent terms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[var(--bg-page)] text-[var(--text-primary)] min-h-screen relative overflow-x-hidden selection:bg-orange-500 selection:text-white transition-colors duration-300 font-sans antialiased">
        <ThemeProvider>
          <BankProvider>
            <LenisSmoothScroll>
              {children}
            </LenisSmoothScroll>
          </BankProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
