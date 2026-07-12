import { redirect } from "next/navigation";
import { getAllSlides } from "@/lib/db";
import { SlideForm } from "@/components/admin/slide-form";

export default async function NewSlidePage() {
  const slides = await getAllSlides();

  if (slides.length >= 3) {
    redirect("/admin/homepage");
  }

  return <SlideForm />;
}
