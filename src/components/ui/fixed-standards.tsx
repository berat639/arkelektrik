"use client";

import { useScrollAnimation } from "./scroll-animation";

const STANDARDS = [
  { name: "NFPA", description: "National Fire Protection Association" },
  { name: "EN", description: "European Standards" },
  { name: "ATEX", description: "Atmosphères Explosibles" },
  { name: "FM Global", description: "Factory Mutual" },
  { name: "UL", description: "Underwriters Laboratories" },
  { name: "VdS", description: "VdS Schadenverhütung" },
];

export function FixedStandards() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-gradient-to-r from-dark-900 via-amber-900/50 to-dark-900 py-16 relative border-y border-amber-800/25">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-10 animate-on-scroll ${isVisible ? "is-visible" : ""}`}
        >
          <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
            Ulusal & Uluslararası Standartlar
          </span>
          <h2 className="font-heading font-bold text-3xl uppercase text-white mb-4">
            Uyumlu Olduğumuz Standartlar
          </h2>
          <div className="divider-teal mx-auto" />
          <p className="text-white/65 max-w-xl mx-auto mt-6 text-sm leading-relaxed whitespace-pre-wrap">
            Tüm projelerimiz ulusal ve uluslararası güvenlik standartlarına tam uyumlu olarak dizayn edilmekte ve uygulanmaktadır.
          </p>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-on-scroll delay-100 ${isVisible ? "is-visible" : ""}`}>
          {STANDARDS.map((std, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-br from-dark-800 to-amber-900/35 border border-amber-800/20 p-6 flex flex-col items-center justify-center text-center hover:border-amber-500/30 hover:bg-amber-900/40 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 group"
              style={{
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
              }}
            >
              {/* Accent corner */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                   style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} 
              />
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ clipPath: "polygon(0 100%, 100% 100%, 0 0)" }}
              />

              <div className="text-xl font-heading font-bold text-white mb-2 tracking-wider">
                {std.name}
              </div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest">
                {std.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
