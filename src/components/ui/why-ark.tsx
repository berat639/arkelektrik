"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "./scroll-animation";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";

const HARDCODED_SECTORS = [
  { name: "Petrol ve Gaz", image: "https://images.pexels.com/photos/2760241/pexels-photo-2760241.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { name: "Enerji Tesisleri", image: "https://images.pexels.com/photos/157511/pexels-photo-157511.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { name: "Petrokimya", image: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { name: "Ağır Sanayi", image: "https://images.pexels.com/photos/110813/pexels-photo-110813.jpeg?auto=compress&cs=tinysrgb&w=800" },
];

const HARDCODED_TITLE = "Neden ARK Global?";
const HARDCODED_SECTORS_TITLE = "Hizmet Verdiğimiz Sektörler";

interface WhyArkProps {
  description: string;
  image: string;
  subtitle: string;
  quote: string;
  reasonsMDX: string;
}

export function WhyArk({
  description,
  image,
  subtitle,
  quote,
  reasonsMDX,
}: WhyArkProps) {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation();
  const { ref: sectorRef, isVisible: sectorVisible } = useScrollAnimation();

  return (
    <section id="why-ark" className="bg-slate-50 py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Text */}
          <div
            ref={leftRef as React.RefObject<HTMLDivElement>}
            className={`animate-on-scroll-left ${leftVisible ? "is-visible" : ""}`}
          >
            <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
              {HARDCODED_TITLE}
            </span>
            <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase leading-tight text-gray-900 mb-4 whitespace-pre-wrap">
              {subtitle.includes(" ") ? (
                <>
                  {subtitle.split(" ")[0]} <span className="text-teal-500">{subtitle.substring(subtitle.indexOf(" ") + 1)}</span>
                </>
              ) : (
                subtitle
              )}
            </h2>
            <div className="divider-teal" />
            
            <div className="mb-8">
              <MarkdownRenderer 
                content={description}
                className="prose prose-neutral prose-p:text-gray-600 prose-p:leading-relaxed max-w-none"
              />
            </div>

            <div className="mb-8">
              <MarkdownRenderer 
                content={reasonsMDX}
                className=""
                components={{
                  ul: ({ children }) => <ul className="space-y-3">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-3">
                      <CheckCircle size={18} className="text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm leading-relaxed">{children}</span>
                    </li>
                  ),
                  p: ({ children }) => <>{children}</>,
                }}
              />
            </div>

            <Link href="/contact" className="btn-primary mt-4 inline-flex">
              Uzmanımızla Görüşün <ArrowRight size={16} />
            </Link>
          </div>

          {/* Image */}
          <div
            ref={rightRef as React.RefObject<HTMLDivElement>}
            className={`animate-on-scroll-right ${rightVisible ? "is-visible" : ""}`}
          >
            <div className="relative">
              <img
                src={image}
                alt="Endüstriyel güvenlik mühendisliği"
                className="w-full h-[560px] object-cover"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))",
                }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-dark-800/60 via-transparent to-transparent"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))",
                }}
              />
              <div
                className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm border border-gray-200 p-5"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                }}
              >
                <p className="text-gray-700 text-sm italic leading-relaxed">
                  {quote}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-8 h-px bg-teal-500" />
                  <span className="text-teal-500 text-xs font-semibold uppercase tracking-wider">
                    ARK Global
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sectors */}
        {HARDCODED_SECTORS.length > 0 && (
          <div
            ref={sectorRef as React.RefObject<HTMLDivElement>}
            className={`animate-on-scroll ${sectorVisible ? "is-visible" : ""}`}
          >
            <h3 className="font-heading font-bold text-2xl uppercase text-gray-900 text-center mb-8">
              {HARDCODED_SECTORS_TITLE}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HARDCODED_SECTORS.map(({ name, image: img }, i) => (
                <div
                  key={name}
                  className={`relative overflow-hidden group h-48 animate-on-scroll ${
                    sectorVisible ? "is-visible" : ""
                  }`}
                  style={{
                    transitionDelay: `${i * 80}ms`,
                    clipPath:
                      "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                  }}
                >
                  <img
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/85 via-dark-900/20 to-transparent" />
                  <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/20 transition-colors duration-300" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                      {name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
