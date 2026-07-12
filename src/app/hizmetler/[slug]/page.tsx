import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, CheckCircle,
} from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { getServicePageBySlug, getAllServicePages } from "@/lib/db";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";
import { TechBackground } from "@/components/ui/tech-background";

const iconMap: Record<string, React.ElementType> = {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench,
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const service = await getServicePageBySlug(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.excerpt || service.shortDesc || service.title,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getServicePageBySlug(slug);

  if (!service || !service.is_published) {
    notFound();
  }

  const allServices = await getAllServicePages();
  const publishedServices = allServices.filter((s) => s.is_published);
  const currentIndex = publishedServices.findIndex((s) => s.slug === slug);
  const prevService = currentIndex > 0 ? publishedServices[currentIndex - 1] : null;
  const nextService =
    currentIndex < publishedServices.length - 1 ? publishedServices[currentIndex + 1] : null;

  const Icon = iconMap[service.icon] ?? Shield;
  const features = service.features || [];
  const standards = service.standards || [];
  const applications = service.applications || [];
  const longDesc = service.longDesc || service.content || service.excerpt || "";

  return (
    <>
      <PageHero
        title={service.title}
        subtitle={service.shortDesc || service.excerpt}
        breadcrumbs={[
          { label: "Hizmetler", href: "/hizmetler" },
          { label: service.title },
        ]}
        image={
          service.cover_image_url ||
          "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920"
        }
      />

      {/* Main content */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left — main content */}
            <div className="lg:col-span-2">
              {/* Icon + heading */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 bg-teal-500 flex items-center justify-center flex-shrink-0"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                  }}
                >
                  <Icon size={26} className="text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-2xl uppercase text-gray-900">
                    {service.title}
                  </h2>
                  <div className="w-12 h-0.5 bg-teal-500 mt-1" />
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed text-base mb-8">{longDesc}</p>

              {/* Image */}
              {service.cover_image_url && (
                <div
                  className="relative mb-8 overflow-hidden"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
                  }}
                >
                  <img src={service.cover_image_url} alt={service.title} className="w-full h-72 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 to-transparent" />
                </div>
              )}

              {/* Markdown content if any */}
              {service.content && (
                <div className="prose prose-neutral max-w-none mb-8">
                  <MarkdownRenderer content={service.content} />
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <>
                  <h3 className="font-heading font-bold text-xl uppercase text-gray-900 mb-4">
                    Sistem Özellikleri
                  </h3>
                  <div className="w-12 h-0.5 bg-teal-500 mb-6" />
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Standards */}
              {standards.length > 0 && (
                <div
                  className="bg-white border border-gray-200 p-6"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                  }}
                >
                  <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-4">
                    Uyumlu Standartlar
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {standards.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 bg-teal-500/5 border border-teal-500/20 text-teal-500 text-xs font-semibold uppercase tracking-wide"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Applications */}
              {applications.length > 0 && (
                <div
                  className="bg-white border border-gray-200 p-6"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                  }}
                >
                  <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-4">
                    Uygulama Alanları
                  </h4>
                  <ul className="space-y-2">
                    {applications.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div
                className="bg-teal-500 p-6"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                }}
              >
                <h4 className="font-heading font-bold text-lg uppercase text-white mb-3">
                  Bu Hizmet Hakkında Teklif Alın
                </h4>
                <p className="text-white/85 text-sm mb-4">
                  Uzmanımız tesisinizi değerlendirerek size özel çözüm sunsun.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white text-teal-500 font-semibold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors"
                >
                  Teklif Al <ArrowRight size={14} />
                </Link>
              </div>

              {/* Other services */}
              <div
                className="bg-white border border-gray-200 p-6"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                }}
              >
                <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-4">
                  Diğer Hizmetler
                </h4>
                <ul className="space-y-2">
                  {publishedServices
                    .filter((s) => s.slug !== slug)
                    .slice(0, 4)
                    .map((s) => {
                      const SIcon = iconMap[s.icon] ?? Shield;
                      return (
                        <li key={s.slug}>
                          <Link
                            href={`/hizmetler/${s.slug}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-500 transition-colors py-1"
                          >
                            <SIcon size={12} className="text-teal-500 flex-shrink-0" />
                            {s.title}
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process section */}
      <section className="bg-dark-900 py-20 relative overflow-hidden">
        <TechBackground variant="dark" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
              Nasıl Çalışırız
            </span>
            <h2 className="font-heading font-bold text-3xl uppercase text-white mb-4">Proje Sürecimiz</h2>
            <div className="w-16 h-1 bg-teal-500 mx-auto" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Risk Analizi", desc: "Tesisinizin tehlike profili ve gereksinimlerinin belirlenmesi" },
              { step: "02", title: "Tasarım", desc: "Uluslararası standartlarda özel sistem tasarımı ve mühendislik" },
              { step: "03", title: "Uygulama", desc: "Sertifikalı ekipman temini, kurulum ve kablo döşeme" },
              { step: "04", title: "Devreye Alma", desc: "Test, kalibrasyon, eğitim ve belgelendirme" },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="bg-dark-800 border border-dark-500 p-6 relative"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                }}
              >
                <div className="font-heading font-bold text-5xl text-teal-500/20 leading-none mb-4">
                  {step}
                </div>
                <h3 className="font-heading font-bold text-lg uppercase text-white mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prev / Next navigation */}
      <section className="bg-dark-800 border-t border-dark-600 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-4">
          {prevService ? (
            <Link
              href={`/hizmetler/${prevService.slug}`}
              className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
              <div>
                <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">Önceki Hizmet</div>
                <div className="text-sm font-medium">{prevService.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          <Link href="/hizmetler" className="text-teal-500 text-xs uppercase tracking-wider font-semibold hover:underline">
            Tüm Hizmetler
          </Link>

          {nextService ? (
            <Link
              href={`/hizmetler/${nextService.slug}`}
              className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group text-right"
            >
              <div>
                <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">Sonraki Hizmet</div>
                <div className="text-sm font-medium">{nextService.title}</div>
              </div>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>

      {/* Related CTA */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-3xl uppercase text-gray-900 mb-4">
            Projenizi Değerlendirelim
          </h2>
          <p className="text-gray-500 mb-8">
            <strong>{service.title}</strong> konusunda tesisinize özel analiz ve teklif için bizimle iletişime geçin.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/contact" className="btn-primary">
              Teklif Al <ArrowRight size={16} />
            </Link>
            <Link href="/hizmetler" className="btn-outline !border-gray-300 !text-gray-700 !hover:text-teal-500 !hover:border-teal-500">
              Diğer Hizmetler
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
