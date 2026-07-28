import { notFound } from "next/navigation";
import Link from "next/link";
import { getServicePageById } from "@/lib/db";
import { SubProductForm } from "@/components/admin/subproduct-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewSubProductPage({ params }: Props) {
  const { id } = await params;
  const service = await getServicePageById(id);

  if (!service) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/services/${id}/edit`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {service.title}
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Yeni Alt Ürün Ekle</h1>
      <SubProductForm serviceId={id} />
    </div>
  );
}
