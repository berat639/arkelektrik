import Link from "next/link";
import Image from "next/image";
import {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, Eye, Bell,
  Phone, Mail, MapPin, ChevronUp, ChevronRight,
} from "lucide-react";
import { ScrollToTop } from "./scroll-to-top";
import { getPublishedServicePages, getSiteSettings } from "@/lib/db";

const iconMap: Record<string, React.ElementType> = {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, Eye, Bell,
};

const companyLinks = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "Hizmetler", href: "/hizmetler" },
  { label: "Referanslar", href: "/blog" },
  { label: "İletişim", href: "/contact" },
];

export async function Footer() {
  const [services, settings] = await Promise.all([
    getPublishedServicePages(),
    getSiteSettings(),
  ]);



  return (
    <footer className="bg-gray-100 pt-20 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ark-red via-ark-red/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-16">
          {/* 1 — Brand */}
          <div>
            <Link href="/" className="inline-block mb-5">
              <Image src="/ark-logo.png" alt="ARK Global" width={120} height={40} className="h-10 w-auto" />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{settings.footerDescription}</p>
            
          </div>

          {/* 2 — Hizmetler */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-5">
              Hizmetler
            </h4>
            <ul className="space-y-2.5">
              {services.map((s) => {
                const Icon = iconMap[s.icon] ?? Shield;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/hizmetler/${s.slug}`}
                      className="flex items-center gap-2 text-gray-500 hover:text-ark-red text-sm transition-colors duration-200"
                    >
                      <Icon size={12} className="text-ark-red flex-shrink-0" />
                      {s.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 3 — Şirket */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-5">
              Şirket
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-gray-500 hover:text-ark-red text-sm transition-colors duration-200"
                  >
                    <ChevronRight size={12} className="text-ark-red flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4 — İletişim */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-5">
              İletişim
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-ark-red flex-shrink-0 mt-0.5" />
                <a
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                  className="text-gray-600 hover:text-ark-red text-sm transition-colors"
                >
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-ark-red flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${settings.email}`}
                  className="text-gray-600 hover:text-ark-red text-sm transition-colors"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-ark-red flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">{settings.address}</span>
              </li>
            </ul>
          </div>
        </div>



        {/* Bottom bar */}
        <div className="border-t border-gray-200 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs text-center sm:text-left">
            &copy; {new Date().getFullYear()} {settings.copyrightText}
          </p>
          <ScrollToTop />
        </div>
      </div>
    </footer>
  );
}
