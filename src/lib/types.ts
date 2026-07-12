export type PostStatus = "draft" | "published";
export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  category_id: string | null;
  status: PostStatus;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithRelations extends Post {
  category: Category | null;
  author: Profile | null;
  tags: Tag[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  topic?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Hero Slide (template-compatible) ───
export interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  // Extended fields for template design
  badge: string;
  headline: string[];
  highlightIndex: number;
  description: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  tags: string[];
  order: number;
  created_at: string;
  updated_at: string;
}

// ─── Service Page (template-compatible) ───
export interface ServicePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  order: number;
  is_published: boolean;
  // Extended fields for template design
  icon: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  standards: string[];
  applications: string[];
  created_at: string;
  updated_at: string;
}

export interface AboutPage {
  content: string;
  cover_image_url: string | null;
  updated_at: string;
}

// ─── Site Settings (global editable content) ───
export interface StatItem {
  value: string;
  label: string;
}

export interface ComplianceStandard {
  code: string;
  name: string;
}

export interface Partner {
  name: string;
  role: string;
  image: string;
}

export interface Milestone {
  year: string;
  event: string;
}

export interface ValueCard {
  icon: string;
  title: string;
  desc: string;
}

export interface Sector {
  name: string;
  image: string;
}

export interface SiteSettings {
  // Stats bar
  stats: StatItem[];
  // Contact info
  phone: string;
  email: string;
  address: string;
  // Sectors
  sectors: Sector[];

  // Why ARK
  whyArkDescription: string;
  whyArkImage: string;
  whyArkReasonsMDX: string;
  whyArkSubtitle: string;
  whyArkQuote: string;

  // Standards Section
  standardsSectionTitle: string;
  carouselBrands: { image: string; title: string }[];

  // Footer
  footerDescription: string;
  copyrightText: string;

  // CTA Banner
  ctaBannerImage: string;
  ctaBannerBadge: string;
  ctaBannerTitle: string;
  ctaBannerAccent: string;
  ctaBannerDescription: string;

  // YENİ: Hakkımızda sayfası için
  milestones: Milestone[];
  values: ValueCard[];
  expertiseItems: string[];
  expertiseImage: string;
  certPartners: { name: string; desc: string }[];
  
  // YENİ: Hizmetler & İletişim sayfası hero görselleri
  servicesPageImage: string;
  contactPageImage: string;
  
  // YENİ: Ana Sayfa Dinamik Alanları
  aboutTeaserTitle: string;
  aboutTeaserSubtitle: string;
  aboutTeaserText: string;
  aboutTeaserImage: string;
  aboutTeaserQuote: string;

  servicesSectionTitle: string;
  servicesSectionSubtitle: string;
  servicesSectionText: string;


  // Blog Sayfası
  blogPageImage: string;
  blogPageSubtitle: string;
  aboutPageSubtitle: string;

  // SEO
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;

  // Sectors
  sectorsSectionTitle: string;

  // Timestamps
  updated_at: string;
}
