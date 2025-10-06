import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";

const BeforeAfterSlider = () => {
  const [sliderValue, setSliderValue] = useState([50]);
  const containerRef = useRef<HTMLDivElement>(null);

  const beforeStats = {
    visningar: 1200,
    likes: 45,
    kommentarer: 3,
  };

  const afterStats = {
    visningar: 5280,
    likes: 420,
    kommentarer: 38,
  };

  // Interpolate values based on slider position
  const getInterpolatedValue = (before: number, after: number) => {
    const progress = sliderValue[0] / 100;
    return Math.round(before + (after - before) * progress);
  };

  const currentStats = {
    visningar: getInterpolatedValue(beforeStats.visningar, afterStats.visningar),
    likes: getInterpolatedValue(beforeStats.likes, afterStats.likes),
    kommentarer: getInterpolatedValue(beforeStats.kommentarer, afterStats.kommentarer),
  };

  return (
    <div ref={containerRef} className="relative p-8">
      {/* Labels */}
      <div className="flex justify-between mb-8">
        <div className="text-white/60 font-semibold text-sm uppercase tracking-wide">
          Före
        </div>
        <div className="text-primary-glow font-semibold text-sm uppercase tracking-wide">
          Efter
        </div>
      </div>

      {/* Stats Display with Transition */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between text-lg">
          <span className="text-white/80">Visningar:</span>
          <span 
            className="font-bold text-2xl transition-all duration-300"
            style={{
              color: sliderValue[0] > 50 
                ? `hsl(var(--primary-glow))` 
                : `hsl(var(--foreground) / 0.8)`
            }}
          >
            {currentStats.visningar.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-lg">
          <span className="text-white/80">Likes:</span>
          <span 
            className="font-bold text-2xl transition-all duration-300"
            style={{
              color: sliderValue[0] > 50 
                ? `hsl(var(--primary-glow))` 
                : `hsl(var(--foreground) / 0.8)`
            }}
          >
            {currentStats.likes.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-lg">
          <span className="text-white/80">Kommentarer:</span>
          <span 
            className="font-bold text-2xl transition-all duration-300"
            style={{
              color: sliderValue[0] > 50 
                ? `hsl(var(--primary-glow))` 
                : `hsl(var(--foreground) / 0.8)`
            }}
          >
            {currentStats.kommentarer.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="relative h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-primary transition-all duration-300 ease-out"
          style={{ width: `${sliderValue[0]}%` }}
        />
      </div>

      {/* Slider Control */}
      <div className="relative">
        <Slider
          value={sliderValue}
          onValueChange={setSliderValue}
          max={100}
          step={1}
          className="cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Helper Text */}
      <div className="text-center mt-6 text-white/60 text-sm">
        Dra slidern för att se förbättringen
      </div>

      {/* Animated Glow Effect */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl transition-all duration-500 pointer-events-none"
        style={{
          left: `${sliderValue[0]}%`,
          transform: `translate(-50%, -50%)`,
          background: `hsl(var(--primary) / ${sliderValue[0] / 100 * 0.3})`,
          opacity: sliderValue[0] / 100,
        }}
      />
    </div>
  );
};

export default BeforeAfterSlider;