"use client";

import { useScrollAnimation } from "./scroll-animation";
import { TechBackground } from "./tech-background";

interface StandardsSectionProps {
  title: string;
  brands: { image: string; title: string }[];
}

export function StandardsSection({ title, brands }: StandardsSectionProps) {
  const { ref, isVisible } = useScrollAnimation();

  // Duplicate items to ensure smooth infinite scroll
  const duplicatedItems = [...brands, ...brands, ...brands, ...brands, ...brands, ...brands];

  return (
    <section className="bg-slate-50 py-28 relative overflow-hidden">
      <TechBackground />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-500/60 to-transparent z-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 animate-on-scroll ${isVisible ? "is-visible" : ""}`}
        >
          <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
            Çözüm Ortakları & Markalar
          </span>
          <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase leading-tight text-gray-900 mb-4">
            {title}
          </h2>
          <div className="divider-teal mx-auto" />
          <p className="text-gray-600 max-w-xl mx-auto mt-6 text-sm leading-relaxed whitespace-pre-wrap">
            Alanında dünya lideri markalar ve teknoloji üreticileriyle doğrudan çözüm ortaklığı yaparak projelerinize en güvenilir sistemleri entegre ediyoruz.
          </p>
        </div>
      </div>

      {/* Infinite Carousel */}
      <div className="relative w-full overflow-hidden brand-carousel z-10 py-4">
        {/* Left/Right Fade Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max brand-carousel-track hover:animation-paused">
          {duplicatedItems.map((brand, index) => (
            <div key={index} className="px-4 flex-shrink-0">
              <div
                className="relative bg-white border-t border-b border-gray-200 hover:border-teal-500/40 hover:shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-center items-center h-32 w-64 group"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                }}
              >
                {/* Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-center bg-contain bg-no-repeat opacity-40 group-hover:opacity-100 transition-opacity duration-300 filter grayscale group-hover:grayscale-0 m-6"
                  style={{ backgroundImage: `url(${brand.image})` }}
                />
                
                {/* Brand Title Overlay */}
                <div 
                  className="relative z-10 font-heading font-bold text-sm uppercase text-gray-900 tracking-widest transition-colors duration-300 group-hover:text-teal-600 bg-white/95 px-4 py-1.5 mt-auto mb-3 shadow-md"
                  style={{
                    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))"
                  }}
                >
                  {brand.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
