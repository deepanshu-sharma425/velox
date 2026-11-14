"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CardUnboxingScroll from "@/components/CardUnboxingScroll";
import LoanCalculator from "@/components/LoanCalculator";
import Plans from "@/components/Plans";
import StatsFeatures from "@/components/StatsFeatures";
import Footer from "@/components/Footer";
import LoanApplyModal from "@/components/LoanApplyModal";
import DashboardView from "@/components/DashboardView";
import FlutedCanvas from "@/components/FlutedCanvas";

export default function HomePage() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedLoanAmount, setSelectedLoanAmount] = useState(15000);
  const [selectedLoanDuration, setSelectedLoanDuration] = useState(18);
  const [selectedLoanPurpose, setSelectedLoanPurpose] = useState("Personal / Travel");

  const handleApplyWithDetails = (amount: number, months: number, _monthly?: number, purpose?: string) => {
    setSelectedLoanAmount(amount);
    setSelectedLoanDuration(months);
    if (purpose) setSelectedLoanPurpose(purpose);
    setApplyModalOpen(true);
  };

  const handleSelectPlan = (planName: string) => {
    if (planName.includes("Starter")) {
      setSelectedLoanAmount(3500);
      setSelectedLoanDuration(6);
      setSelectedLoanPurpose("Starter Credit Plan");
    } else if (planName.includes("Standard")) {
      setSelectedLoanAmount(15000);
      setSelectedLoanDuration(18);
      setSelectedLoanPurpose("Standard Line Credit");
    } else {
      setSelectedLoanAmount(40000);
      setSelectedLoanDuration(24);
      setSelectedLoanPurpose("Executive Elite Credit");
    }
    setApplyModalOpen(true);
  };

  // If user opened the full in-page Dashboard View: Clean, sober, NO orangish fluted canvas
  if (showDashboard) {
    return (
      <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] relative z-10 transition-colors duration-300">
        <Navbar 
          onOpenDashboard={() => setShowDashboard(true)} 
          onOpenApplyModal={() => setApplyModalOpen(true)}
          isDashboardActive={true}
        />
        <DashboardView 
          onBackToHome={() => setShowDashboard(false)}
          isStandalonePage={false}
        />
        <LoanApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          initialAmount={selectedLoanAmount}
          initialDuration={selectedLoanDuration}
          loanPurpose={selectedLoanPurpose}
          onSuccessOpenDashboard={() => setShowDashboard(true)}
        />
      </main>
    );
  }

  // First Home Page View: Features the ambient orangish rays & spotlight effect!
  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Orangish ambient fluted rays ONLY on the first home page */}
      <FlutedCanvas />

      {/* High-end Glassmorphic Navbar with Currency & Theme Switcher */}
      <Navbar 
        onOpenDashboard={() => setShowDashboard(true)}
        onOpenApplyModal={() => setApplyModalOpen(true)}
        isDashboardActive={false}
      />

      {/* Hero Section */}
      <Hero 
        onOpenApplyModal={() => setApplyModalOpen(true)}
        onOpenDashboard={() => setShowDashboard(true)}
      />

      {/* The Masterpiece: 3D Card Unboxing Scroll Experience */}
      <CardUnboxingScroll />

      {/* Interactive Dynamic Loan Calculator */}
      <LoanCalculator onApplyWithDetails={handleApplyWithDetails} />

      {/* Tailored Credit Plans */}
      <Plans onSelectPlan={handleSelectPlan} />

      {/* Stats & Trust Features & FAQ */}
      <StatsFeatures />

      {/* Footer */}
      <Footer onOpenDashboard={() => setShowDashboard(true)} />

      {/* Dynamic Loan Application Modal */}
      <LoanApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        initialAmount={selectedLoanAmount}
        initialDuration={selectedLoanDuration}
        loanPurpose={selectedLoanPurpose}
        onSuccessOpenDashboard={() => setShowDashboard(true)}
      />
    </main>
  );
}
