import { getAllSlides } from "@/lib/db";
import { HomepageSectionsForm } from "@/components/admin/homepage-sections-form";

export default async function AdminHomepagePage() {
  const slides = await getAllSlides();

  return (
    <div>
      <HomepageSectionsForm initialSlides={slides} />
    </div>
  );
}
