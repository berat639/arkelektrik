import { getPublishedCatalogs } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { FileText, Download } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Kataloglar | ARK Global",
  description: "Ürün ve çözüm kataloglarımızı indirin.",
};

export default async function CatalogsPage() {
  const catalogs = await getPublishedCatalogs();

  return (
    <>
      <PageHero
        title="Kataloglar"
        subtitle="Ürün ve çözüm kataloglarımız"
        breadcrumbs={[{ label: "Kataloglar" }]}
        image="/katalog-banner.jpeg"
      />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {catalogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catalogs.map((catalog) => (
                <a
                  key={catalog.id}
                  href={catalog.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-ark-red/40 hover:shadow-xl transition-all duration-300"
                >
                  {/* Cover Image / Logo */}
                  <div className="relative h-48 bg-gray-50 flex items-center justify-center p-6">
                    {catalog.cover_image_url ? (
                      <Image
                        src={catalog.cover_image_url}
                        alt={catalog.title}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <FileText size={48} className="text-gray-300" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-ark-red/0 group-hover:bg-ark-red/5 transition-colors duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-4 border-t border-gray-100">
                    <h3 className="font-heading font-bold text-sm uppercase text-gray-900 group-hover:text-ark-red transition-colors duration-300 mb-3">
                      {catalog.title}
                    </h3>
                    <div className="flex items-center gap-2 text-ark-red text-xs font-semibold uppercase tracking-wider">
                      <Download size={14} />
                      <span>PDF İndir</span>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-ark-red opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Henüz katalog eklenmemiş.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
