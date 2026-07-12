import Link from "next/link";
import Image from "next/image";
import { HeaderNav } from "./header-nav";
import { getPublishedServicePages } from "@/lib/db";

export async function Header() {
  let serviceLinks: { href: string; label: string }[] = [];

  const fallbackLinks = [
    { href: "/hizmetler/yangin-algilama-sondurme", label: "Yangın Algılama & Söndürme" },
    { href: "/hizmetler/kivilcim-algilama-sondurme", label: "Kıvılcım Algılama & Söndürme" },
    { href: "/hizmetler/patlamadan-korunma", label: "Patlamadan Korunma" },
    { href: "/hizmetler/asiri-basinctan-korunma", label: "Aşırı Basınçtan Korunma" },
    { href: "/hizmetler/gaz-algilama", label: "Gaz Algılama" },
    { href: "/hizmetler/ex-proof-cozumler", label: "Ex Proof Çözümler" },
    { href: "/hizmetler/servis-ve-bakim-hizmetleri", label: "Servis ve Bakım Hizmetleri" },
  ];

  try {
    const services = await getPublishedServicePages();
    if (services && services.length > 0) {
      serviceLinks = services.map((s) => ({
        href: `/hizmetler/${s.slug}`,
        label: s.title,
      }));
    } else {
      serviceLinks = fallbackLinks;
    }
  } catch {
    // Fallback: static service links if Redis is unavailable
    serviceLinks = fallbackLinks;
  }

  return (
    <HeaderNav serviceLinks={serviceLinks} />
  );
}
