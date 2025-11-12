import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import HowItWorks from "@/components/HowItWorks";
import ResultsSection from "@/components/ResultsSection";
import AIDemoSection from "@/components/AIDemoSection";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import TrustSection from "@/components/TrustSection";
import FinalCTA from "@/components/FinalCTA";
import CookieConsent from "@/components/CookieConsent";
import ChatWidget from "@/components/ChatWidget";
import BackToTop from "@/components/BackToTop";
import AnimatedSection from "@/components/AnimatedSection";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      
      <AnimatedSection animation="slide-up">
        <ProblemSection />
      </AnimatedSection>
      
      <AnimatedSection animation="fade-in-scale" delay={100}>
        <HowItWorks />
      </AnimatedSection>
      
      <ResultsSection />
      
      <AnimatedSection animation="slide-up" delay={100}>
        <AIDemoSection />
      </AnimatedSection>
      
      <AnimatedSection animation="fade-in" delay={100}>
        <Pricing />
      </AnimatedSection>
      
      <AnimatedSection animation="slide-up">
        <Testimonials />
      </AnimatedSection>
      
      <AnimatedSection animation="fade-in-scale" delay={100}>
        <TrustSection />
      </AnimatedSection>
      
      <FinalCTA />
      
      <CookieConsent />
      
      {/* Footer */}
      <footer className="border-t py-10 md:py-12 px-4 bg-background">
        <div className="container mx-auto text-muted-foreground font-poppins">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-6 md:mb-8">
            {/* Company Info */}
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-foreground mb-2 md:mb-3">Promotley UF</h3>
              <p className="text-xs md:text-sm">AI-driven marknadsföring för UF-företag</p>
              <p className="text-xs md:text-sm mt-1.5 md:mt-2">En del av Ung Företagsamhet Sverige</p>
              <p className="text-xs md:text-sm mt-2 md:mt-3">Borgarfjordsgatan 6C<br />164 40 Kista, Sverige</p>
            </div>

            {/* Contact */}
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-foreground mb-2 md:mb-3">Kontakt</h3>
              <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                <div>
                  <a href="mailto:uf@promotley.se" className="hover:text-foreground transition-colors">
                    uf@promotley.se
                  </a>
                </div>
                <div>
                  <a href="mailto:support@promotley.se" className="hover:text-foreground transition-colors">
                    support@promotley.se
                  </a>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="text-center sm:text-left md:text-right sm:col-span-2 md:col-span-1">
              <h3 className="font-bold text-foreground mb-2 md:mb-3">Länkar</h3>
              <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                <div>
                  <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                    Integritetspolicy
                  </Link>
                </div>
                <div>
                  <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
                    Användarvillkor
                  </Link>
                </div>
                <div className="mt-3 md:mt-4 flex gap-3 md:gap-4 justify-center md:justify-end">
                  <a 
                    href="https://www.instagram.com/promotley.se" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-foreground transition-all duration-300 hover:scale-110 animate-fade-in opacity-0" 
                    style={{ animationDelay: "0ms", animationFillMode: "forwards" }}
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a 
                    href="https://www.tiktok.com/@promotley.se" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-foreground transition-all duration-300 hover:scale-110 animate-fade-in opacity-0" 
                    style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
                    aria-label="TikTok"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs md:text-sm pt-5 md:pt-6 border-t">
            <p>© 2025 Promotley UF. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
      
      {/* Chat Widget */}
      <ChatWidget />
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default Index;
