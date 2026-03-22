import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ProblemSection from "../components/ProblemSection";
import FlowSection from "../components/FlowSection";
import KeyFeatures from "../components/KeyFeatures";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <ProblemSection />
      <FlowSection />
      <KeyFeatures />
      <Footer />
    </div>
  );
}
