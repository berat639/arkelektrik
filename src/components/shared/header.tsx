import Link from "next/link";
import Image from "next/image";
import { HeaderNav } from "./header-nav";
import { getPublishedServicePages, getPublishedPosts } from "@/lib/db";

export async function Header() {
  let serviceLinks: { href: string; label: string }[] = [];

  const fallbackLinks = [
    { href: "/hizmetler/yangin-algilama-ve-ihbar-sistemleri", label: "Yangın Algılama ve İhbar Sistemleri" },
    { href: "/hizmetler/gaz-algilama-sistemleri", label: "Gaz Algılama Sistemleri" },
    { href: "/hizmetler/kivilcim-algilama-sondurme", label: "Kıvılcım Algılama Söndürme" },
    { href: "/hizmetler/goruntu-tabanli-yangin-algilama", label: "Görüntü Tabanlı Yangın Algılama" },
    { href: "/hizmetler/exproof-cozumler", label: "Exproof Çözümler" },
    { href: "/hizmetler/yangin-sondurme-sistemleri", label: "Yangın Söndürme Sistemleri" },
    { href: "/hizmetler/patlamadan-korunma", label: "Patlamadan Korunma" },
    { href: "/hizmetler/asiri-basinctan-korunma", label: "Aşırı Basınçtan Korunma" },
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

  let hasReferences = false;
  try {
    const { count } = await getPublishedPosts(1, 1);
    hasReferences = count > 0;
  } catch {
    hasReferences = false;
  }

  return (
    <HeaderNav serviceLinks={serviceLinks} hasReferences={hasReferences} />
  );
}
