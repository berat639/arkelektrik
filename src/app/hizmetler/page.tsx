import Link from "next/link";
import { ArrowRight, Flame, Zap, Shield, Gauge, Wind, Lock, Wrench } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { getPublishedServicePages, getSiteSettings } from "@/lib/db";
import { TechBackground } from "@/components/ui/tech-background";
import type { ServicePage } from "@/lib/types";

export const metadata = {
  title: "Faaliyet Alanlarımız",
  description: "Yangın algılama, kıvılcım algılama, patlamadan korunma ve daha fazlası.",
};

const iconMap: Record<string, React.ElementType> = {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench,
};

function ServiceRow({ service, index }: { service: ServicePage; index: number }) {
  const Icon = iconMap[service.icon] ?? Shield;
  const isEven = index % 2 === 0;

  return (
    <div
      className="grid lg:grid-cols-2 gap-0 overflow-hidden border border-gray-200 hover:border-teal-500/30 transition-colors duration-300 relative z-10 shadow-sm"
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
      }}
    >
      {/* Image */}
      <div className={`relative h-64 lg:h-auto ${!isEven ? "lg:order-2" : ""}`}>
        <img
          src={
            service.cover_image_url ||
            "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=900"
          }
          alt={service.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-fire-950/60 to-transparent" />
      </div>

      {/* Content */}
      <div className={`bg-gradient-to-br from-dark-800 to-amber-900/25 p-10 flex flex-col justify-center ${!isEven ? "lg:order-1" : ""}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
            <Icon size={22} className="text-teal-500" />
          </div>
          <h3 className="font-heading font-bold text-2xl uppercase text-white">{service.title}</h3>
        </div>

        <p className="text-white/75 text-sm leading-relaxed mb-6">
          {(service.longDesc || service.shortDesc || service.excerpt || "").substring(0, 220)}...
        </p>

        {service.standards && service.standards.length > 0 && (
          <div className="mb-6">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Standartlar</p>
            <div className="flex flex-wrap gap-2">
              {service.standards.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 bg-amber-900/35 border border-amber-800/25 text-amber-400 text-xs font-semibold"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <Link href={`/hizmetler/${service.slug}`} className="btn-primary self-start text-xs">
          Detaylı İncele <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    getPublishedServicePages(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHero
        title="Hizmetlerimiz"
        subtitle="Endüstriyel tesisleriniz için uçtan uca güvenlik çözümleri. Her hizmet, tesisinizin özgün tehlike profiline göre tasarlanmaktadır."
        breadcrumbs={[{ label: "Hizmetler" }]}
        image={settings.servicesPageImage || "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920"}
      />

      <section className="bg-white py-24 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Quick nav */}
          <div className="flex flex-wrap gap-3 justify-center mb-16">
            {services.map(({ slug, title, icon }) => {
              const Icon = iconMap[icon] ?? Shield;
              return (
                <Link
                  key={slug}
                  href={`/hizmetler/${slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-teal-500/50 hover:bg-teal-500/5 text-gray-700 hover:text-gray-900 text-xs uppercase tracking-wider transition-all duration-200 shadow-sm"
                >
                  <Icon size={12} className="text-teal-500" />
                  {title}
                </Link>
              );
            })}
          </div>

          {/* Service rows */}
          <div className="space-y-6">
            {services.map((service, i) => (
              <ServiceRow key={service.slug} service={service} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-dark-900 to-amber-900/35 py-20 border-t border-amber-800/15 relative overflow-hidden">
        <TechBackground variant="alt" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-heading font-bold text-3xl uppercase text-white mb-4">
            Hangi Çözümü Arıyorsunuz?
          </h2>
          <p className="text-white/85 mb-8">Uzman ekibimiz tesisinize özel çözümü birlikte belirlesin.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-white font-semibold uppercase tracking-wider text-sm hover:bg-teal-600 transition-colors"
          >
            Ücretsiz Değerlendirme <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {services.length === 0 && (
        <div className="bg-gradient-to-br from-dark-900 to-amber-900/25 py-16 text-center">
          <p className="text-white/50">Henüz faaliyet alanı eklenmemiş.</p>
        </div>
      )}
    </>
  );
}
