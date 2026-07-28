import { notFound } from "next/navigation";
import Link from "next/link";
import { getServicePageById, getSubProductById } from "@/lib/db";
import { SubProductForm } from "@/components/admin/subproduct-form";

interface Props {
  params: Promise<{ id: string; subId: string }>;
}

export default async function EditSubProductPage({ params }: Props) {
  const { id, subId } = await params;
  const service = await getServicePageById(id);
  const subProduct = await getSubProductById(subId);

  if (!service || !subProduct) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/services/${id}/edit`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {service.title}
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Alt Ürün Düzenle: {subProduct.title}</h1>
      <SubProductForm
        serviceId={id}
        initialData={{
          id: subProduct.id,
          title: subProduct.title,
          slug: subProduct.slug,
          description: subProduct.description,
          features: subProduct.features,
          is_published: subProduct.is_published,
          cover_image_url: subProduct.cover_image_url,
        }}
      />
    </div>
  );
}
