import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

interface CtaBannerProps {
  settings: Pick<SiteSettings, "ctaBannerImage" | "ctaBannerBadge" | "ctaBannerTitle" | "ctaBannerAccent" | "ctaBannerDescription">;
}

export function CtaBanner({ settings }: CtaBannerProps) {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={settings.ctaBannerImage}
          alt="Industrial"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ark-red-muted/80 via-ark-red/40 to-ark-red-muted/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-ark-red/5 via-transparent to-transparent" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-ark-red via-ark-red/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-ark-red via-ark-red/40 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <span className="inline-flex items-center gap-2 bg-white/15 border border-white/40 px-4 py-2 mb-6">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
          <span className="text-white text-xs font-semibold uppercase tracking-[0.2em]">
            {settings.ctaBannerBadge}
          </span>
        </span>

        <h2 className="font-heading font-bold text-4xl lg:text-6xl uppercase text-white leading-tight mb-6">
          {settings.ctaBannerTitle}
          <br />
          <span className="text-white">{settings.ctaBannerAccent}</span>
        </h2>

        <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {settings.ctaBannerDescription}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/hizmetler" className="btn-outline">
            Hizmetlerimizi İnceleyin
          </Link>
        </div>
      </div>
    </section>
  );
}
