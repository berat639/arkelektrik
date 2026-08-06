import { notFound } from "next/navigation";
import Link from "next/link";
import { getServicePageById, getSubProductsByServiceId } from "@/lib/db";
import { ServiceForm } from "@/components/admin/service-form";
import { SubProductsList } from "@/components/admin/subproducts-list";
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const service = await getServicePageById(id);

  if (!service) {
    notFound();
  }

  const subProducts = await getSubProductsByServiceId(id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{service.title}</h1>

      {/* Sub-Products Section */}
      <div className="mb-10 bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Alt Ürünler / Alt Hizmetler</h2>
          <Link
            href={`/admin/services/${id}/subproducts/new`}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 font-medium"
          >
            + Yeni Alt Ürün
          </Link>
        </div>
        <SubProductsList serviceId={id} subProducts={subProducts} />
      </div>

      {/* Service Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sayfa İçeriği</h2>
        <ServiceForm
          initialData={{
            id: service.id,
            title: service.title,
            content: service.content,
            excerpt: service.excerpt,
            cover_image_url: service.cover_image_url,
            icon: service.icon,
            shortDesc: service.shortDesc,
            is_published: service.is_published,
          }}
        />
      </div>
    </div>
  );
}
