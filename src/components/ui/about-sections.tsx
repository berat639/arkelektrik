"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Award, Target, Users, Globe, Shield, Zap } from "lucide-react";
import { useScrollAnimation } from "./scroll-animation";
import type { SiteSettings } from "@/lib/types";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";

const iconMap: Record<string, React.ElementType> = {
  Award, Target, Users, Globe, Shield, Zap, CheckCircle
};

interface AboutSectionsProps {
  settings: SiteSettings;
  aboutContent: string;
  aboutImage: string | null;
}

export function AboutSections({ settings, aboutContent, aboutImage }: AboutSectionsProps) {
  const { ref: ref1, isVisible: v1 } = useScrollAnimation();
  const { ref: ref2, isVisible: v2 } = useScrollAnimation();
  const { ref: ref3, isVisible: v3 } = useScrollAnimation();

  return (
    <>
      {/* Story & Milestones */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div
              ref={ref1 as React.RefObject<HTMLDivElement>}
              className={`animate-on-scroll-left ${v1 ? "is-visible" : ""}`}
            >
              <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">Hikayemiz</span>
              <h2 className="font-heading font-bold text-4xl uppercase text-gray-900 mb-4 whitespace-pre-wrap">
                {settings.aboutStoryTitle ? (
                  settings.aboutStoryTitle.includes(" ") ? (
                    <>
                      {settings.aboutStoryTitle.split(" ")[0]} <span className="text-teal-500">{settings.aboutStoryTitle.substring(settings.aboutStoryTitle.indexOf(" ") + 1)}</span>
                    </>
                  ) : (
                    settings.aboutStoryTitle
                  )
                ) : (
                  <>
                    Deneyimden Doğan <span className="text-teal-500">Uzmanlık</span>
                  </>
                )}
              </h2>
              <div className="w-16 h-1 bg-teal-500 mb-6" />
              
              <div className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
                {settings.aboutStoryText || "ARK Global'in temeli, kurucu kadrosunun Tyco, Honeywell ve UTC Fire Safety gibi dünya devi markalarda bizzat sahada kazandığı 15 yılı aşkın deneyime dayanmaktadır."}
              </div>

              {aboutContent && (
                <div className="prose prose-neutral max-w-none text-gray-600 mt-6 pt-6 border-t border-gray-100">
                  <MarkdownRenderer content={aboutContent} />
                </div>
              )}
            </div>

            {/* Milestones */}
            <div
              ref={ref1 as React.RefObject<HTMLDivElement>}
              className={`animate-on-scroll-right ${v1 ? "is-visible" : ""}`}
            >
              <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-6 block">Kilometre Taşları</span>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-6">
                  {settings.milestones.map(({ year, event }) => (
                    <div key={year} className="flex gap-6 pl-4 group">
                      <div className="relative flex-shrink-0">
                        <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-md mt-1 relative z-10 transition-transform duration-300 group-hover:scale-125" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-teal-500 text-lg leading-none mb-1">{year}</div>
                        <p className="text-gray-600 text-sm leading-relaxed">{event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-dark-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={ref2 as React.RefObject<HTMLDivElement>}
            className={`text-center mb-14 animate-on-scroll ${v2 ? "is-visible" : ""}`}
          >
            <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">Değerlerimiz</span>
            <h2 className="font-heading font-bold text-4xl uppercase text-white mb-4">İlkelerimiz</h2>
            <div className="w-16 h-1 bg-teal-500 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.values.map(({ icon, title, desc }, i) => {
              const Icon = iconMap[icon] || Award;
              return (
                <div
                  key={title}
                  className={`bg-dark-800 border border-dark-500 p-6 hover:border-teal-500/40 transition-all duration-300 hover:-translate-y-0.5 animate-on-scroll ${v2 ? "is-visible" : ""}`}
                  style={{
                    transitionDelay: `${i * 60}ms`,
                    clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                  }}
                >
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-teal-500" />
                  </div>
                  <h3 className="font-heading font-bold text-lg uppercase text-white mb-2">{title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="bg-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              ref={ref3 as React.RefObject<HTMLDivElement>}
              className={`animate-on-scroll-left ${v3 ? "is-visible" : ""}`}
            >
              <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
                {settings.aboutExpertiseSubtitle || "Yetkinliklerimiz"}
              </span>
              <h2 className="font-heading font-bold text-4xl uppercase text-gray-900 mb-4">
                {settings.aboutExpertiseTitle || "Neden Biz?"}
              </h2>
              <div className="w-16 h-1 bg-teal-500 mb-6" />
              <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
                {settings.aboutExpertiseDescription || "Sadece ürün temini değil; risk analizi ile başlayan, tesisin ihtiyaçlarına özel proses mühendisliği ile şekillenen ve uluslararası standartlarda hazırlanan detaylı projelendirme süreçlerimizle fark yaratıyoruz."}
              </p>
              <ul className="space-y-3">
                {settings.expertiseItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-4 mt-8 flex-wrap">
                {settings.certPartners.map(({ name, desc, image_url }) => (
                  <div
                    key={name}
                    className="relative bg-white border border-gray-200 px-6 py-4 text-center min-w-[160px] flex flex-col justify-center items-center overflow-hidden group"
                    style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
                  >
                    {image_url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none"
                        style={{ backgroundImage: `url(${image_url})` }}
                      />
                    )}
                    <div className="relative z-10 font-heading font-bold text-base text-gray-800">{name}</div>
                    <div className="relative z-10 text-teal-500 text-xs uppercase tracking-wide mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`animate-on-scroll-right ${v3 ? "is-visible" : ""}`}>
              <img
                src={aboutImage || settings.expertiseImage}
                alt="ARK Global mühendislik"
                className="w-full h-[500px] object-cover shadow-xl"
                style={{ clipPath: "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dark-900 py-20 border-t border-dark-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-3xl uppercase text-white mb-4">
            Projenizi Konuşalım
          </h2>
          <p className="text-white/65 mb-8">Tesisinizin güvenlik ihtiyaçlarını ücretsiz değerlendiriyoruz.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/contact" className="btn-primary inline-flex">
              İletişime Geçin <ArrowRight size={16} className="ml-2" />
            </Link>
            <Link href="/hizmetler" className="btn-outline inline-flex">
              Hizmetlerimiz
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
