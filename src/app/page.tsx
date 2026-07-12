import { getAllSlides, getPublishedServicePages, getSiteSettings, getAboutPage } from "@/lib/db";
import { HeroSlider } from "@/components/ui/hero-slider";
import { AboutTeaser } from "@/components/ui/about-teaser";
import { ServicesSection } from "@/components/ui/services-section";
import { WhyArk } from "@/components/ui/why-ark";
import { StandardsSection } from "@/components/ui/standards-section";
import { FixedStandards } from "@/components/ui/fixed-standards";
import { CtaBanner } from "@/components/ui/cta-banner";

export default async function HomePage() {
  const [slides, services, settings, about] = await Promise.all([
    getAllSlides(),
    getPublishedServicePages(),
    getSiteSettings(),
    getAboutPage(),
  ]);

  return (
    <>
      <HeroSlider slides={slides} stats={settings.stats} />
      <AboutTeaser
        aboutImage={settings.aboutTeaserImage || about.cover_image_url || undefined}
        title={settings.aboutTeaserTitle}
        subtitle={settings.aboutTeaserSubtitle}
        text={settings.aboutTeaserText}
        quote={settings.aboutTeaserQuote}
      />
      <ServicesSection
        services={services}
        title={settings.servicesSectionTitle}
        subtitle={settings.servicesSectionSubtitle}
        text={settings.servicesSectionText}
      />
      <WhyArk
        subtitle={settings.whyArkSubtitle}
        description={settings.whyArkDescription}
        image={settings.whyArkImage}
        quote={settings.whyArkQuote}
        reasonsMDX={settings.whyArkReasonsMDX}
        sectorsTitle={settings.sectorsSectionTitle}
        sectors={settings.sectors}
      />
      <FixedStandards />
      <StandardsSection
        title={settings.standardsSectionTitle}
        brands={settings.carouselBrands}
      />
      <CtaBanner settings={settings} />
    </>
  );
}
