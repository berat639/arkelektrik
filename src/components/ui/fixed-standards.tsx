"use client";

import { useScrollAnimation } from "./scroll-animation";

const STANDARDS = [
  { name: "NFPA 2001", description: "Clean Agent Fire Protection Systems" },
  { name: "VdS", description: "VdS Approved" },
  { name: "FM", description: "FM Global Approved" },
  { name: "LPCB", description: "Loss Prevention Certification Board" },
  { name: "ISO 14520", description: "Gaseous Fire Extinguishing Systems" },
  { name: "UL", description: "UL Listed" },
];

export function FixedStandards() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-gradient-to-r from-ark-red-muted via-ark-red to-ark-red-muted py-16 relative border-y border-ark-red/25">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-10 animate-on-scroll ${isVisible ? "is-visible" : ""}`}
        >
          <span className="text-white text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
            Ulusal & Uluslararası Standartlar
          </span>
          <h2 className="font-heading font-bold text-3xl uppercase text-white mb-4">
            Uyumlu Olduğumuz Standartlar
          </h2>
          <div className="w-16 h-1 bg-white mx-auto" />
          <p className="text-white/65 max-w-xl mx-auto mt-6 text-sm leading-relaxed whitespace-pre-wrap">
            Tüm projelerimiz ulusal ve uluslararası güvenlik standartlarına tam uyumlu olarak dizayn edilmekte ve uygulanmaktadır.
          </p>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 animate-on-scroll delay-100 ${isVisible ? "is-visible" : ""}`}>
          {STANDARDS.map((std, index) => (
            <div
              key={index}
              className="relative bg-gray-100 border border-gray-200 p-6 flex flex-col items-center justify-center text-center hover:border-ark-red/30 hover:bg-white hover:shadow-xl transition-all duration-300 group"
              style={{
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
              }}
            >
              {/* Accent corner */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-ark-red opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                   style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} 
              />
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-ark-red opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ clipPath: "polygon(0 100%, 100% 100%, 0 0)" }}
              />

              <div className="text-xl font-heading font-bold text-gray-900 mb-2 tracking-wider">
                {std.name}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                {std.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
