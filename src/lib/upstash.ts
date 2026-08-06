import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
});

// Key prefixes
export const KEYS = {
  // Posts
  post: (id: string) => `post:${id}`,
  postBySlug: (slug: string) => `post:slug:${slug}`,
  postsPublished: "posts:published",
  postsDraft: "posts:draft",
  postsByCategory: (categoryId: string) => `posts:cat:${categoryId}`,
  postTags: (postId: string) => `post:tags:${postId}`,
  tagPosts: (tagId: string) => `tag:posts:${tagId}`,

  // Categories
  category: (id: string) => `cat:${id}`,
  categoryBySlug: (slug: string) => `cat:slug:${slug}`,
  categoriesAll: "categories:all",

  // Tags
  tag: (id: string) => `tag:${id}`,
  tagBySlug: (slug: string) => `tag:slug:${slug}`,
  tagsAll: "tags:all",

  // Contact Messages
  message: (id: string) => `msg:${id}`,
  messagesAll: "messages:all",
  messagesUnread: "messages:unread",

  // Views
  postViews: "post_views",

  // Slides
  slide: (id: string) => `slide:${id}`,
  slidesAll: "slides:all",

  // Services
  service: (id: string) => `service:${id}`,
  serviceBySlug: (slug: string) => `service:slug:${slug}`,
  servicesAll: "services:all",
  servicesSeedVersion: "services:seed_version",

  // Sub-Products
  subProduct: (id: string) => `subproduct:${id}`,
  subProductBySlug: (slug: string) => `subproduct:slug:${slug}`,
  subProductsByService: (serviceId: string) => `subproducts:service:${serviceId}`,
  subProductsSeedVersion: "subproducts:seed_version",

  // Static Pages
  pageAbout: "page:about",

  // Catalogs
  catalog: (id: string) => `catalog:${id}`,
  catalogsAll: "catalogs:all",

  // Site Settings
  siteSettings: "site:settings",
} as const;
