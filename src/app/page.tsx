import Hero from "@/components/Hero";
import CardShowcase from "@/components/CardShowcase";
import CreditInfo from "@/components/CreditInfo";
import Stats from "@/components/Stats";
import Calculator from "@/components/Calculator";
import Loyalty from "@/components/Loyalty";
import Plans from "@/components/Plans";
import Licensed from "@/components/Licensed";
import Footer from "@/components/Footer";
import Modals from "@/components/Modals";
import { MobileTabBar } from "@/components/Header";
import Fx from "@/components/Fx";

export default function Page() {
  return (
    <main className="page">
      <Hero />
      <CardShowcase />
      <div className="page-rest">
        <div className="ambient" aria-hidden />
        <CreditInfo />
        <Stats />
        <Calculator />
        <Loyalty />
        <Plans />
        <Licensed />
        <Footer />
      </div>
      <MobileTabBar />
      <Fx />
      <Modals />
    </main>
  );
}
