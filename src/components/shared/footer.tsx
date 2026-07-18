import Link from "next/link";
import Image from "next/image";
import {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench,
  Phone, Mail, MapPin, ChevronUp, ChevronRight,
} from "lucide-react";
import { ScrollToTop } from "./scroll-to-top";
import { getPublishedServicePages, getSiteSettings } from "@/lib/db";

const iconMap: Record<string, React.ElementType> = {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench,
};

const companyLinks = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "Hizmetler", href: "/hizmetler" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/contact" },
];

export async function Footer() {
  const [services, settings] = await Promise.all([
    getPublishedServicePages(),
    getSiteSettings(),
  ]);



  return (
    <footer className="bg-gradient-to-r from-dark-900 via-amber-900/50 to-dark-900 pt-20 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-ark-red/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-16">
          {/* 1 — Brand */}
          <div>
            <Link href="/" className="inline-block mb-5">
              <Image src="/ark-logo.png" alt="ARK Global" width={120} height={40} className="h-10 w-auto" />
            </Link>
            <p className="text-white/65 text-sm leading-relaxed mb-6">{settings.footerDescription}</p>
            <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 px-4 py-2.5 rounded-sm">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse-slow" />
              <span className="text-teal-400 text-xs font-semibold uppercase tracking-wider">
                7/24 Destek
              </span>
            </div>
          </div>

          {/* 2 — Hizmetler */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase text-white tracking-wider mb-5">
              Hizmetler
            </h4>
            <ul className="space-y-2.5">
              {services.map((s) => {
                const Icon = iconMap[s.icon] ?? Shield;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/hizmetler/${s.slug}`}
                      className="flex items-center gap-2 text-white/55 hover:text-teal-500 text-sm transition-colors duration-200"
                    >
                      <Icon size={12} className="text-teal-500 flex-shrink-0" />
                      {s.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 3 — Şirket */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase text-white tracking-wider mb-5">
              Şirket
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-white/55 hover:text-teal-500 text-sm transition-colors duration-200"
                  >
                    <ChevronRight size={12} className="text-teal-500 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4 — İletişim */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase text-white tracking-wider mb-5">
              İletişim
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
                <a
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                  className="text-white/65 hover:text-white text-sm transition-colors"
                >
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${settings.email}`}
                  className="text-white/65 hover:text-white text-sm transition-colors"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
                <span className="text-white/65 text-sm">{settings.address}</span>
              </li>
            </ul>
          </div>
        </div>



        {/* Bottom bar */}
        <div className="border-t border-amber-500/10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs text-center sm:text-left">
            &copy; {new Date().getFullYear()} {settings.copyrightText}
          </p>
          <ScrollToTop />
        </div>
      </div>
    </footer>
  );
}
