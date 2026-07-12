"use client";

import Link from "next/link";
import { ArrowRight, Award, Target, Users, Globe } from "lucide-react";
import { useScrollAnimation } from "./scroll-animation";
import { TechBackground } from "./tech-background";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";

const iconMap: Record<string, React.ElementType> = { Award, Target, Users, Globe };

const HARDCODED_HIGHLIGHTS = [
  { icon: 'Shield', title: 'Güvenlik Önce', desc: 'Her kararımızda insan hayatının ve tesisin güvenliği en üst önceliktir.' },
  { icon: 'Award', title: 'Teknik Mükemmellik', desc: 'Uluslararası standartlara tam uyum ve sektörün en yüksek mühendislik kalitesi.' },
  { icon: 'Users', title: 'Ortaklık Anlayışı', desc: 'Müşterilerimizi proje boyu bilgilendiriyor, uzun vadeli ilişkiler kuruyoruz.' },
  { icon: 'Zap', title: 'İnovasyon', desc: 'Yeni teknolojileri takip ediyor, projelerimize en gelişmiş çözümleri entegre ediyoruz.' },
];

interface AboutTeaserProps {
  aboutImage?: string;
  title: string;
  subtitle: string;
  text: string;
  quote?: string;
}

export function AboutTeaser({ aboutImage, title, subtitle, text, quote }: AboutTeaserProps) {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation();

  const img =
    aboutImage ||
    "https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=900";

  // Split text into paragraphs
  const paragraphs = text.split("\n").filter((p) => p.trim() !== "");

  return (
    <section id="about" className="bg-slate-50 py-28 relative overflow-hidden">
      <TechBackground />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-500/60 to-transparent z-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div
            ref={leftRef as React.RefObject<HTMLDivElement>}
            className={`animate-on-scroll-left ${leftVisible ? "is-visible" : ""}`}
          >
            <div className="relative">
              <img
                src={img}
                alt="ARK Global mühendisler"
                className="w-full h-[480px] object-cover shadow-2xl"
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
                className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm border border-gray-200 p-5 shadow-2xl"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                }}
              >
                <p className="text-gray-700 text-sm italic leading-relaxed">
                  {quote || "Her kararımızda insan hayatının ve tesisin güvenliği en üst önceliktir."}
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

          {/* Text */}
          <div
            ref={rightRef as React.RefObject<HTMLDivElement>}
            className={`animate-on-scroll-right ${rightVisible ? "is-visible" : ""}`}
          >
            <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
              {title}
            </span>
            <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase leading-tight text-gray-900 mb-4 whitespace-pre-wrap">
              {subtitle.includes(" ") ? (
                <>
                  {subtitle.split(" ")[0]}
                  <br />
                  <span className="text-teal-500">{subtitle.substring(subtitle.indexOf(" ") + 1)}</span>
                </>
              ) : (
                subtitle
              )}
            </h2>
            <div className="divider-teal" />

            <div className="mb-8">
              <MarkdownRenderer 
                content={text}
                className="prose prose-neutral prose-p:text-gray-600 prose-p:leading-relaxed max-w-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {HARDCODED_HIGHLIGHTS.map(({ icon, title, desc }) => {
                const Icon = iconMap[icon] ?? Award;
                return (
                  <div key={title} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 bg-teal-500/10 border border-teal-500/20 flex items-center justify-center transition-colors duration-300 group-hover:bg-teal-500/20">
                      <Icon size={18} className="text-teal-500" />
                    </div>
                    <div>
                      <h4 className="text-gray-800 font-semibold text-sm mb-1">{title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href="/hakkimizda" className="btn-primary inline-flex !text-white">
              Daha Fazla Öğren <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
