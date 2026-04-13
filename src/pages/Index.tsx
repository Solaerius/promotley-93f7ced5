import { useRef, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Hero from "@/components/Hero";
import LogoStrip from "@/components/LogoStrip";
import ProblemSection from "@/components/ProblemSection";
import HowItWorks from "@/components/HowItWorks";
import ResultsSection from "@/components/ResultsSection";
import DemoPreviewSection from "@/components/DemoPreviewSection";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import TrustSection from "@/components/TrustSection";
import FinalCTA from "@/components/FinalCTA";
import CookieConsent from "@/components/CookieConsent";
import ChatWidget from "@/components/ChatWidget";
import BackToTop from "@/components/BackToTop";
import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
const Index = () => {
  const logoStripRef = useRef<HTMLDivElement>(null);
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  const [heroPassed, setHeroPassed] = useState(false);

  // Show chat bubble only after user scrolls past the hero section
  useEffect(() => {
    const sentinel = heroSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setHeroPassed(!entry.isIntersecting); },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return <div className="min-h-screen relative bg-[hsl(var(--gradient-hero-bg))]">
      {/* Single continuous grid texture for the whole page */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          zIndex: 0,
        }}
      />
      <Navbar logoStripRef={logoStripRef} />
      <Hero />
      {/* Sentinel: when this div leaves the viewport the chat bubble fades in */}
      <div ref={heroSentinelRef} style={{ height: 1, marginTop: -1 }} aria-hidden="true" />
      <LogoStrip ref={logoStripRef} />
      
      <AnimatedSection animation="slide-up">
        <ProblemSection />
      </AnimatedSection>
      
      <AnimatedSection animation="fade-in-scale" delay={100}>
        <HowItWorks />
      </AnimatedSection>
      
      <ResultsSection />
      
      <AnimatedSection animation="slide-up" delay={100}>
        <DemoPreviewSection />
      </AnimatedSection>
      
      <div id="pricing">
        <AnimatedSection animation="fade-in" delay={100}>
          <Pricing />
        </AnimatedSection>
      </div>
      
      <AnimatedSection animation="slide-up">
        <Testimonials />
      </AnimatedSection>
      
      <AnimatedSection animation="fade-in-scale" delay={100}>
        <TrustSection />
      </AnimatedSection>
      
      <FinalCTA />

      <Footer />

      <CookieConsent />

      {/* Chat Widget — only visible after scrolling past the hero */}
      <ChatWidget visible={heroPassed} />
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>;
};
export default Index;