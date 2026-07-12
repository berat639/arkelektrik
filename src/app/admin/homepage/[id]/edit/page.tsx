import { notFound } from "next/navigation";
import { getSlideById } from "@/lib/db";
import { SlideForm } from "@/components/admin/slide-form";

export default async function EditSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slide = await getSlideById(id);

  if (!slide) notFound();

  return <SlideForm slide={slide} />;
}
