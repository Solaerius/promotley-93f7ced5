import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Emma Andersson",
    company: "GreenTech UF",
    text: "Promotley skapade en postningsplan som passade vår budget perfekt. Vi gick från 300 till 12 000 visningar på två veckor!",
    rating: 5,
  },
  {
    name: "Oscar Nilsson",
    company: "StreetStyle AB",
    text: "Äntligen vet jag exakt när och hur ofta jag ska posta. Ingen gissning längre - bara en strategi som funkar!",
    rating: 5,
  },
  {
    name: "Lisa Bergström",
    company: "FoodieBox UF",
    text: "De anpassade strategin efter vår bransch och budget på 400 kr/mån. Vårt engagemang har mer än fördubblats!",
    rating: 5,
  },
  {
    name: "Viktor Larsson",
    company: "TechHub Startup",
    text: "Komplett innehållskalender varje vecka, anpassad efter hur mycket tid vi har. Sparat oss timmar av planering!",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-warm font-poppins relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-accent/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white px-2 leading-tight">
            Vad säger andra företag?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
            Hundratals UF-företag och startups växer redan med oss
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-5 md:p-6 bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 rounded-2xl"
            >
              <div className="space-y-3 md:space-y-4">
                {/* Rating */}
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-sm md:text-base text-white leading-relaxed mt-3 md:mt-4">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="pt-3 md:pt-4 border-t border-white/20">
                  <div className="font-bold text-sm md:text-base text-white">{testimonial.name}</div>
                  <div className="text-xs md:text-sm text-white/70">{testimonial.company}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
