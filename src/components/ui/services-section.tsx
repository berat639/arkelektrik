"use client";

import Link from "next/link";
import Image from "next/image";
import { Compass, Search, Award, Layers, FileText, PlayCircle, Lock, Wrench, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "./scroll-animation";
import type { ServicePage } from "@/lib/types";

const CAPABILITIES = [
  {
    title: "Projelendirme ve Tasarım",
    image: "/projelendirme-ve-tasarim.jpeg",
    icon: Compass,
  },
  {
    title: "Keşif ve Uygulama",
    image: "/kesif-ve-uygulama.jpeg",
    icon: Search,
  },
  {
    title: "Sertifikalı ve Standartlara Uygun Ürün Tedariği",
    image: "/patlamadan_korunma.jpeg",
    icon: Award,
  },
  {
    title: "Sistem Entegrasyonu",
    image: "/basinctan_koruma.jpeg",
    icon: Layers,
  },
  {
    title: "Dökümantasyon",
    image: "/dokumantasyon.jpeg",
    icon: FileText,
  },
  {
    title: "Test, Devreye Alma",
    image: "/test-ve-devreye-alma.jpeg",
    icon: PlayCircle,
  },
  {
    title: "Exproof Çözümler ve Mühendislik",
    image: "/exproof.jpeg",
    icon: Lock,
  },
  {
    title: "Servis ve Bakım",
    image: "/servis_bakim.jpeg",
    icon: Wrench,
  },
];

function CapabilityCard({ item, index }: { item: typeof CAPABILITIES[number]; index: number }) {
  const { ref, isVisible } = useScrollAnimation();
  const Icon = item.icon;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`group relative overflow-hidden animate-on-scroll ${isVisible ? "is-visible" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/90 transition-all duration-300" />

        {/* Icon */}
        <div className="absolute top-4 left-4 w-10 h-10 bg-ark-red/90 flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
          <Icon size={18} className="text-white" />
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-heading font-bold text-base uppercase text-white leading-tight group-hover:text-ark-red-light transition-colors duration-300">
            {item.title}
          </h3>
          <div className="w-8 h-0.5 bg-ark-red mt-2 transition-all duration-300 group-hover:w-12" />
        </div>
      </div>
    </div>
  );
}

interface ServicesSectionProps {
  services: ServicePage[];
  title: string;
  subtitle: string;
  text: string;
}

export function ServicesSection({ title, subtitle, text }: ServicesSectionProps) {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  return (
    <section id="services" className="bg-gradient-to-br from-ark-red-muted via-ark-red to-ark-red-muted py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
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
          <span className="text-white text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
            {title}
          </span>
          <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase text-white mb-4">
            {subtitle}
          </h2>
          <div className="w-16 h-1 bg-white mx-auto" />
          <p className="text-white/70 max-w-2xl mx-auto mt-6 leading-relaxed">
            {text}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAPABILITIES.map((item, i) => (
            <CapabilityCard key={item.title} item={item} index={i} />
          ))}
        </div>

        <div className={`text-center mt-12 animate-on-scroll ${titleVisible ? "is-visible" : ""}`}>
          <Link href="/hizmetler" className="btn-outline inline-flex">
            Faaliyet Alanlarımız <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
