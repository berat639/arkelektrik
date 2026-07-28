import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, Eye, Bell,
} from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { getServicePageBySlug, getAllServicePages, getSubProductsByServiceSlug } from "@/lib/db";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";
import { TechBackground } from "@/components/ui/tech-background";

const iconMap: Record<string, React.ElementType> = {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, Eye, Bell,
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

  const subProducts = await getSubProductsByServiceSlug(slug);
  const publishedSubProducts = subProducts.filter((sp) => sp.is_published);

  const Icon = iconMap[service.icon] ?? Shield;

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
                  className="w-14 h-14 bg-ark-red flex items-center justify-center flex-shrink-0"
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
                  <div className="w-12 h-0.5 bg-ark-red mt-1" />
                </div>
              </div>

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

              {/* Markdown content */}
              {service.content && (
                <div className="prose prose-neutral max-w-none prose-headings:font-heading prose-headings:uppercase prose-h2:text-xl prose-h2:text-gray-900 prose-h3:text-lg prose-h3:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-hr:border-gray-200">
                  <MarkdownRenderer content={service.content} />
                </div>
              )}

              {/* Sub-Products */}
              {publishedSubProducts.length > 0 && (
                <div className="mt-12">
                  <h3 className="font-heading font-bold text-xl uppercase text-gray-900 mb-6">
                    Ürün ve Hizmetlerimiz
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {publishedSubProducts.map((sp) => (
                      <Link
                        key={sp.id}
                        href={`/hizmetler/${slug}/${sp.slug}`}
                        className="bg-white border border-gray-200 p-5 hover:border-red-200 hover:shadow-md transition-all group block"
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                        }}
                      >
                        <h4 className="font-heading font-bold text-sm uppercase text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                          {sp.title}
                        </h4>
                        {sp.description && (
                          <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-3">
                            {sp.description}
                          </p>
                        )}
                        {sp.features.length > 0 && (
                          <ul className="space-y-1">
                            {sp.features.slice(0, 5).map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                            {sp.features.length > 5 && (
                              <li className="text-xs text-gray-400 pl-3">
                                +{sp.features.length - 5} daha...
                              </li>
                            )}
                          </ul>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* CTA */}
              <div
                className="bg-ark-red p-6"
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
                    .map((s) => {
                      const SIcon = iconMap[s.icon] ?? Shield;
                      return (
                        <li key={s.id}>
                          <Link
                            href={`/hizmetler/${s.slug}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-ark-red-light transition-colors py-1"
                          >
                            <SIcon size={12} className="text-ark-red-light flex-shrink-0" />
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
      <section className="bg-gradient-to-br from-ark-red-muted via-ark-red to-ark-red-muted/25 py-20 relative overflow-hidden">
        <TechBackground variant="dark" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <span className="text-ark-red-light text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
              Nasıl Çalışırız
            </span>
            <h2 className="font-heading font-bold text-3xl uppercase text-white mb-4">Proje Sürecimiz</h2>
            <div className="w-16 h-1 bg-ark-red mx-auto" />
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
                className="bg-gradient-to-br from-ark-red-dark/50 to-ark-red-muted/40 border border-ark-red/15 p-6 relative"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                }}
              >
                <div className="font-heading font-bold text-5xl text-ark-red-light/20 leading-none mb-4">
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
      <section className="bg-gradient-to-t from-ark-red-muted to-ark-red-muted/60 border-t border-ark-red/15 py-8">
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

          <Link href="/hizmetler" className="text-ark-red-light text-xs uppercase tracking-wider font-semibold hover:underline">
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
              İletişim <ArrowRight size={16} />
            </Link>
            <Link href="/hizmetler" className="btn-outline !border-gray-300 !text-gray-700 !hover:text-ark-red-light !hover:border-ark-red">
              Tüm Hizmetler <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
