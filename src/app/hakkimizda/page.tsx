import { PageHero } from "@/components/ui/page-hero";
import { getAboutPage, getSiteSettings } from "@/lib/db";
import { AboutSections } from "@/components/ui/about-sections";

export const metadata = {
  title: "Hakkımızda",
  description: "ARK Global hakkında bilgi edinin — Endüstriyel güvenlik mühendisliği alanında 15+ yıllık tecrübe.",
};

export default async function AboutPage() {
  const [about, settings] = await Promise.all([
    getAboutPage(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHero
        title="Hakkımızda"
        accent="ARK Global"
        subtitle={settings.aboutPageSubtitle || "15 yılı aşkın endüstriyel güvenlik tecrübesiyle, standart bir tedarikçiden öte uçtan uca mühendislik partneri."}
        breadcrumbs={[{ label: "Hakkımızda" }]}
        image={settings.aboutHeroImage || about.cover_image_url || "https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=1920"}
      />

      <AboutSections 
        settings={settings} 
        aboutContent={about.content} 
        aboutImage={about.cover_image_url} 
      />
    </>
  );
}
