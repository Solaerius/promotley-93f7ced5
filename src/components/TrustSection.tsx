import { Shield, Lock, Eye, FileCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const trustFeatures = [
  {
    icon: Lock,
    title: "AES-256 Kryptering",
    description: "All din data krypteras med samma standard som banker använder.",
  },
  {
    icon: Eye,
    title: "Du äger din data",
    description: "Vi delar aldrig din information. Du kan radera allt när som helst.",
  },
  {
    icon: Shield,
    title: "GDPR-kompatibelt",
    description: "Full transparens och kontroll enligt EU:s integritetslagar.",
  },
  {
    icon: FileCheck,
    title: "Säkra anslutningar",
    description: "OAuth-integration med Meta & TikTok - inga lösenord sparas.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-diagonal font-poppins">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white text-xs md:text-sm font-semibold mb-3 md:mb-4">
              <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Säkerhet & Integritet
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white px-2 leading-tight">
              Din data är trygg hos oss
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto px-4">
              Vi tar säkerhet och integritet på största allvar. Din information delas aldrig med tredje part.
            </p>
          </div>

          {/* Trust features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {trustFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-5 md:p-6 bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="space-y-3 md:space-y-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white">{feature.title}</h3>
                    <p className="text-white/70 text-xs md:text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Additional info */}
          <div className="mt-8 md:mt-12 p-6 md:p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 text-center">
            <p className="text-white/90 text-sm md:text-lg mb-2 md:mb-3 leading-relaxed">
              Vi använder samma säkerhetsstandarder som banker och följer alla GDPR-krav. 
              Din data är krypterad både i transit och i vila.
            </p>
            <p className="text-white/80 text-xs md:text-base">
              Data lagras säkert inom EU.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
