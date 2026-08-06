"use client";

import Image from "next/image";
import { useScrollAnimation } from "./scroll-animation";

const STANDARDS = [
  { name: "NFPA", description: "National Fire Protection Association", logo: "/nfpa.png" },
  { name: "VdS", description: "VdS Approved", logo: "/vds.png" },
  { name: "FM Global", description: "FM Global Approved", logo: "/fmglobal.png" },
  { name: "LPCB", description: "Loss Prevention Certification Board", logo: "/lpcb.png" },
  { name: "ISO", description: "International Organization for Standardization", logo: "/%C4%B1so.png" },
  { name: "UL", description: "UL Listed", logo: "/ul.png" },
  { name: "EN", description: "European Standards", logo: "/en-logo.jpg" },
  { name: "ATEX", description: "ATEX Certified", logo: "/atex.png" },
  { name: "SIL", description: "Safety Integrity Level", logo: "/sil.png" },
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

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-on-scroll delay-100 ${isVisible ? "is-visible" : ""}`}>
          {STANDARDS.map((std, index) => (
            <div
              key={index}
              className="relative bg-white border border-gray-200 px-4 py-6 flex flex-col items-center justify-center text-center hover:border-ark-red/30 hover:shadow-lg transition-all duration-300 group"
              style={{
                clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))"
              }}
            >
              {/* Logo */}
              <div className="relative w-full h-16 mb-4 flex items-center justify-center">
                <Image
                  src={std.logo}
                  alt={std.name}
                  width={96}
                  height={64}
                  className="object-contain max-h-16 w-auto"
                />
              </div>

              <div className="text-sm font-heading font-bold text-gray-900 tracking-wider">
                {std.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
