import { notFound } from "next/navigation";
import { getServicePageById } from "@/lib/db";
import { ServiceForm } from "@/components/admin/service-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const service = await getServicePageById(id);

  if (!service) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{service.title}</h1>
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
  );
}
