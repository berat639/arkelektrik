import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, Eye, Bell, CheckCircle2,
} from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { getServicePageBySlug, getSubProductBySlug, getSubProductsByServiceSlug } from "@/lib/db";
import { TechBackground } from "@/components/ui/tech-background";

const iconMap: Record<string, React.ElementType> = {
  Flame, Zap, Shield, Gauge, Wind, Lock, Wrench, Eye, Bell,
};

interface Props {
  params: Promise<{ slug: string; subSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { subSlug } = await params;
  const subProduct = await getSubProductBySlug(subSlug);
  if (!subProduct) return {};
  return {
    title: subProduct.title,
    description: subProduct.description?.slice(0, 160) || subProduct.title,
  };
}

export default async function SubProductDetailPage({ params }: Props) {
  const { slug, subSlug } = await params;
  const service = await getServicePageBySlug(slug);
  const subProduct = await getSubProductBySlug(subSlug);

  if (!service || !service.is_published || !subProduct || !subProduct.is_published) {
    notFound();
  }

  // Verify sub-product belongs to this service
  if (subProduct.serviceId !== service.id) {
    notFound();
  }

  const allSubProducts = await getSubProductsByServiceSlug(slug);
  const publishedSubs = allSubProducts.filter((sp) => sp.is_published);
  const currentIndex = publishedSubs.findIndex((sp) => sp.slug === subSlug);
  const prevSub = currentIndex > 0 ? publishedSubs[currentIndex - 1] : null;
  const nextSub = currentIndex < publishedSubs.length - 1 ? publishedSubs[currentIndex + 1] : null;

  const Icon = iconMap[service.icon] ?? Shield;

  return (
    <>
      <PageHero
        title={subProduct.title}
        subtitle={subProduct.description?.slice(0, 120)}
        breadcrumbs={[
          { label: "Hizmetler", href: "/hizmetler" },
          { label: service.title, href: `/hizmetler/${slug}` },
          { label: subProduct.title },
        ]}
        image={
          subProduct.cover_image_url ||
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
                    {subProduct.title}
                  </h2>
                  <div className="w-12 h-0.5 bg-ark-red mt-1" />
                </div>
              </div>

              {/* Cover image */}
              {subProduct.cover_image_url && (
                <div
                  className="relative mb-8 overflow-hidden"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
                  }}
                >
                  <img src={subProduct.cover_image_url} alt={subProduct.title} className="w-full h-72 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 to-transparent" />
                </div>
              )}

              {/* Description */}
              {subProduct.description && (
                <div className="mb-8">
                  <p className="text-gray-600 leading-relaxed text-base">
                    {subProduct.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {subProduct.features.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-heading font-bold text-lg uppercase text-gray-900 mb-4">
                    Özellikler & Ürünler
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {subProduct.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white border border-gray-100 p-4"
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                        }}
                      >
                        <CheckCircle2 size={16} className="text-ark-red flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
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
                  Teklif Alın
                </h4>
                <p className="text-white/85 text-sm mb-4">
                  {subProduct.title} hakkında detaylı bilgi ve fiyat teklifi için bize ulaşın.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-ark-red font-semibold text-sm px-4 py-2 hover:bg-gray-100 transition-colors"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                  }}
                >
                  İletişime Geçin <ArrowRight size={14} />
                </Link>
              </div>

              {/* Sibling sub-products */}
              {publishedSubs.length > 1 && (
                <div
                  className="bg-white border border-gray-200 p-6"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                  }}
                >
                  <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-4">
                    Diğer Alt Ürünler
                  </h4>
                  <ul className="space-y-2">
                    {publishedSubs
                      .filter((sp) => sp.slug !== subSlug)
                      .map((sp) => (
                        <li key={sp.id}>
                          <Link
                            href={`/hizmetler/${slug}/${sp.slug}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-ark-red-light transition-colors py-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-ark-red flex-shrink-0" />
                            {sp.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Back to parent service */}
              <div
                className="bg-gray-50 border border-gray-200 p-6"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                }}
              >
                <h4 className="font-heading font-bold text-sm uppercase text-gray-900 tracking-wider mb-3">
                  Üst Hizmet
                </h4>
                <Link
                  href={`/hizmetler/${slug}`}
                  className="flex items-center gap-2 text-sm text-ark-red-light font-medium hover:underline"
                >
                  <Icon size={14} />
                  {service.title}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prev / Next navigation */}
      <section className="bg-gradient-to-t from-ark-red-muted to-ark-red-muted/60 border-t border-ark-red/15 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-4">
          {prevSub ? (
            <Link
              href={`/hizmetler/${slug}/${prevSub.slug}`}
              className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
              <div>
                <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">Önceki</div>
                <div className="text-sm font-medium">{prevSub.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          <Link href={`/hizmetler/${slug}`} className="text-ark-red-light text-xs uppercase tracking-wider font-semibold hover:underline">
            Tüm Alt Ürünler
          </Link>

          {nextSub ? (
            <Link
              href={`/hizmetler/${slug}/${nextSub.slug}`}
              className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group text-right"
            >
              <div>
                <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">Sonraki</div>
                <div className="text-sm font-medium">{nextSub.title}</div>
              </div>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-3xl uppercase text-gray-900 mb-4">
            Projenizi Değerlendirelim
          </h2>
          <p className="text-gray-500 mb-8">
            <strong>{subProduct.title}</strong> konusunda tesisinize özel analiz ve teklif için bizimle iletişime geçin.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/contact" className="btn-primary">
              İletişim <ArrowRight size={16} />
            </Link>
            <Link href={`/hizmetler/${slug}`} className="btn-outline !border-gray-300 !text-gray-700">
              {service.title} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
