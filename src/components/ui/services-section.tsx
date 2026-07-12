"use client";

import Link from "next/link";
import { Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "./scroll-animation";
import type { ServicePage } from "@/lib/types";

const iconMap: Record<string, React.ElementType> = {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench,
};

function ServiceCard({ service, index }: { service: ServicePage; index: number }) {
  const { ref, isVisible } = useScrollAnimation();
  const Icon = iconMap[service.icon] ?? Shield;

  return (
    <Link
      href={`/hizmetler/${service.slug}`}
      ref={ref as React.RefObject<HTMLAnchorElement>}
      className={`service-card group animate-on-scroll ${isVisible ? "is-visible" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[24px] border-l-transparent border-t-[24px] border-t-teal-500 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-teal-500 group-hover:border-teal-500">
          <Icon size={24} className="text-teal-500 group-hover:text-white transition-colors duration-300" />
        </div>

        <h3 className="font-heading font-bold text-xl uppercase text-white mb-3 group-hover:text-teal-500 transition-colors duration-300">
          {service.title}
        </h3>

        <p className="text-white/75 text-sm leading-relaxed mb-6">{service.shortDesc || service.excerpt}</p>

        <div className="flex items-center gap-2 text-teal-500 text-sm font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
          <span>Detay</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

interface ServicesSectionProps {
  services: ServicePage[];
  title: string;
  subtitle: string;
  text: string;
}

export function ServicesSection({ services, title, subtitle, text }: ServicesSectionProps) {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  return (
    <section id="services" className="bg-dark-900 py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(196,30,30,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 animate-on-scroll ${titleVisible ? "is-visible" : ""}`}
        >
          <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
            {title}
          </span>
          <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase text-white mb-4">
            {subtitle}
          </h2>
          <div className="divider-teal mx-auto" />
          <p className="text-white/70 max-w-2xl mx-auto mt-6 leading-relaxed">
            {text}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <ServiceCard key={service.id || service.slug} service={service} index={i} />
          ))}
        </div>

        <div className={`text-center mt-12 animate-on-scroll ${titleVisible ? "is-visible" : ""}`}>
          <Link href="/hizmetler" className="btn-outline inline-flex">
            Tüm Hizmetleri İnceleyin <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
