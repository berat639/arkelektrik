import { getAboutPage } from "@/lib/db";
import { AboutAdminClient } from "@/components/admin/about-admin-client";

export default async function AdminAboutPage() {
  const about = await getAboutPage();

  return (
    <div>
      <AboutAdminClient
        initialAbout={{
          content: about.content,
          cover_image_url: about.cover_image_url,
        }}
      />
    </div>
  );
}
