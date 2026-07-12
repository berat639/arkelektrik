import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  image?: string;
  accent?: string;
}

export function PageHero({
  title,
  subtitle,
  breadcrumbs,
  image = "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920",
  accent,
}: PageHeroProps) {
  return (
    <section className="relative pt-36 pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-dark-900/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/70 via-dark-900/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/20 via-transparent to-dark-900/80" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Red accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-teal-500 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 mb-6 text-xs uppercase tracking-wider">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">
              Ana Sayfa
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <ChevronRight size={12} className="text-white/25" />
                {crumb.href ? (
                  <Link href={crumb.href} className="text-white/40 hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-teal-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl uppercase text-white leading-tight mb-4">
          {accent ? (
            <>
              {title} <span className="text-teal-500">{accent}</span>
            </>
          ) : (
            title
          )}
        </h1>

        {/* Divider */}
        <div className="w-16 h-1 bg-teal-500 mb-6" />

        {subtitle && (
          <p className="text-white/70 text-lg max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
