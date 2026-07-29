import { redis, KEYS } from "./upstash";
import type {
  Post,
  PostWithRelations,
  Category,
  Tag,
  ContactMessage,
  PaginatedResponse,
  Slide,
  ServicePage,
  SubProduct,
  AboutPage,
  SiteSettings,
  Catalog,
} from "./types";

// ============================================
// POSTS
// ============================================

export async function createPost(
  post: Omit<Post, "id" | "created_at" | "updated_at">
): Promise<Post> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const fullPost: Post = { ...post, id, created_at: now, updated_at: now };

  const pipeline = redis.pipeline();
  pipeline.set(KEYS.post(id), JSON.stringify(fullPost));
  pipeline.set(KEYS.postBySlug(fullPost.slug), id);

  const score = fullPost.published_at
    ? new Date(fullPost.published_at).getTime()
    : Date.now();

  if (fullPost.status === "published") {
    pipeline.zadd(KEYS.postsPublished, { score, member: id });
  } else {
    pipeline.zadd(KEYS.postsDraft, { score, member: id });
  }

  if (fullPost.category_id) {
    pipeline.zadd(KEYS.postsByCategory(fullPost.category_id), {
      score,
      member: id,
    });
  }

  await pipeline.exec();
  return fullPost;
}

export async function updatePost(
  id: string,
  data: Partial<Omit<Post, "id" | "created_at">>
): Promise<Post | null> {
  const existing = await getPostById(id);
  if (!existing) return null;

  const updated: Post = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  const pipeline = redis.pipeline();

  // If slug changed, remove old slug mapping
  if (data.slug && data.slug !== existing.slug) {
    pipeline.del(KEYS.postBySlug(existing.slug));
    pipeline.set(KEYS.postBySlug(updated.slug), id);
  }

  pipeline.set(KEYS.post(id), JSON.stringify(updated));

  // Handle status change
  if (data.status && data.status !== existing.status) {
    if (data.status === "published") {
      pipeline.zrem(KEYS.postsDraft, id);
      pipeline.zadd(KEYS.postsPublished, {
        score: updated.published_at
          ? new Date(updated.published_at).getTime()
          : Date.now(),
        member: id,
      });
    } else {
      pipeline.zrem(KEYS.postsPublished, id);
      pipeline.zadd(KEYS.postsDraft, { score: Date.now(), member: id });
    }
  }

  // Handle category change
  if (data.category_id !== undefined && data.category_id !== existing.category_id) {
    if (existing.category_id) {
      pipeline.zrem(KEYS.postsByCategory(existing.category_id), id);
    }
    if (data.category_id) {
      pipeline.zadd(KEYS.postsByCategory(data.category_id), {
        score: Date.now(),
        member: id,
      });
    }
  }

  await pipeline.exec();
  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  const post = await getPostById(id);
  if (!post) return false;

  const pipeline = redis.pipeline();
  pipeline.del(KEYS.post(id));
  pipeline.del(KEYS.postBySlug(post.slug));
  pipeline.zrem(KEYS.postsPublished, id);
  pipeline.zrem(KEYS.postsDraft, id);
  if (post.category_id) {
    pipeline.zrem(KEYS.postsByCategory(post.category_id), id);
  }

  // Remove tag associations
  const tagIds = await redis.smembers(KEYS.postTags(id));
  for (const tagId of tagIds) {
    pipeline.srem(KEYS.tagPosts(tagId), id);
  }
  pipeline.del(KEYS.postTags(id));

  await pipeline.exec();
  return true;
}

export async function getPostById(id: string): Promise<Post | null> {
  const data = await redis.get<string>(KEYS.post(id));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const id = await redis.get<string>(KEYS.postBySlug(slug));
  if (!id) return null;
  return getPostById(id);
}

export async function getPublishedPosts(
  page: number = 1,
  pageSize: number = 9
): Promise<PaginatedResponse<PostWithRelations>> {
  const total = await redis.zcard(KEYS.postsPublished);
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const ids = await redis.zrange<string[]>(KEYS.postsPublished, start, end, {
    rev: true,
  });

  const posts = await Promise.all(ids.map((id) => getPostWithRelations(id)));
  const data = posts.filter(Boolean) as PostWithRelations[];

  return {
    data,
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const publishedIds = await redis.zrange<string[]>(KEYS.postsPublished, 0, -1, { rev: true });
  const draftIds = await redis.zrange<string[]>(KEYS.postsDraft, 0, -1, { rev: true });
  const allIds = [...publishedIds, ...draftIds];

  const posts = await Promise.all(allIds.map((id) => getPostById(id)));
  return posts.filter(Boolean) as Post[];
}

export async function getPostsByCategory(
  categoryId: string,
  page: number = 1,
  pageSize: number = 9
): Promise<PaginatedResponse<PostWithRelations>> {
  const allIds = await redis.zrange<string[]>(
    KEYS.postsByCategory(categoryId),
    0,
    -1,
    { rev: true }
  );

  // Filter only published
  const publishedIds: string[] = [];
  for (const id of allIds) {
    const post = await getPostById(id);
    if (post?.status === "published") publishedIds.push(id);
  }

  const total = publishedIds.length;
  const start = (page - 1) * pageSize;
  const paginatedIds = publishedIds.slice(start, start + pageSize);

  const posts = await Promise.all(
    paginatedIds.map((id) => getPostWithRelations(id))
  );

  return {
    data: posts.filter(Boolean) as PostWithRelations[],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPostsByTag(
  tagId: string,
  page: number = 1,
  pageSize: number = 9
): Promise<PaginatedResponse<PostWithRelations>> {
  const allIds = await redis.smembers<string[]>(KEYS.tagPosts(tagId));

  // Filter only published
  const publishedIds: string[] = [];
  for (const id of allIds) {
    const post = await getPostById(id);
    if (post?.status === "published") publishedIds.push(id);
  }

  const total = publishedIds.length;
  const start = (page - 1) * pageSize;
  const paginatedIds = publishedIds.slice(start, start + pageSize);

  const posts = await Promise.all(
    paginatedIds.map((id) => getPostWithRelations(id))
  );

  return {
    data: posts.filter(Boolean) as PostWithRelations[],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPostWithRelations(
  id: string
): Promise<PostWithRelations | null> {
  const post = await getPostById(id);
  if (!post) return null;

  const [category, tagIds] = await Promise.all([
    post.category_id ? getCategoryById(post.category_id) : null,
    redis.smembers<string[]>(KEYS.postTags(id)),
  ]);

  const tags = await Promise.all(tagIds.map((tid) => getTagById(tid)));

  return {
    ...post,
    category: category || null,
    author: null,
    tags: tags.filter(Boolean) as Tag[],
  };
}

// Post-Tag associations
export async function setPostTags(
  postId: string,
  tagIds: string[]
): Promise<void> {
  // Remove old tags
  const oldTagIds = await redis.smembers<string[]>(KEYS.postTags(postId));
  const pipeline = redis.pipeline();

  for (const tagId of oldTagIds) {
    pipeline.srem(KEYS.tagPosts(tagId), postId);
  }
  pipeline.del(KEYS.postTags(postId));

  // Add new tags
  for (const tagId of tagIds) {
    pipeline.sadd(KEYS.postTags(postId), postId);
    pipeline.sadd(KEYS.tagPosts(tagId), postId);
  }
  for (const tagId of tagIds) {
    pipeline.sadd(KEYS.postTags(postId), tagId);
  }

  await pipeline.exec();
}

// ============================================
// CATEGORIES
// ============================================

export async function createCategory(
  data: Omit<Category, "id" | "created_at">
): Promise<Category> {
  const id = crypto.randomUUID();
  const category: Category = {
    ...data,
    id,
    created_at: new Date().toISOString(),
  };

  const pipeline = redis.pipeline();
  pipeline.set(KEYS.category(id), JSON.stringify(category));
  pipeline.set(KEYS.categoryBySlug(category.slug), id);
  pipeline.sadd(KEYS.categoriesAll, id);
  await pipeline.exec();

  return category;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const data = await redis.get<string>(KEYS.category(id));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const id = await redis.get<string>(KEYS.categoryBySlug(slug));
  if (!id) return null;
  return getCategoryById(id);
}

export async function getAllCategories(): Promise<Category[]> {
  const ids = await redis.smembers<string[]>(KEYS.categoriesAll);
  const categories = await Promise.all(ids.map((id) => getCategoryById(id)));
  return (categories.filter(Boolean) as Category[]).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function deleteCategory(id: string): Promise<boolean> {
  const category = await getCategoryById(id);
  if (!category) return false;

  const pipeline = redis.pipeline();
  pipeline.del(KEYS.category(id));
  pipeline.del(KEYS.categoryBySlug(category.slug));
  pipeline.srem(KEYS.categoriesAll, id);
  pipeline.del(KEYS.postsByCategory(id));
  await pipeline.exec();

  return true;
}

// ============================================
// TAGS
// ============================================

export async function createTag(
  data: Omit<Tag, "id">
): Promise<Tag> {
  const id = crypto.randomUUID();
  const tag: Tag = { ...data, id };

  const pipeline = redis.pipeline();
  pipeline.set(KEYS.tag(id), JSON.stringify(tag));
  pipeline.set(KEYS.tagBySlug(tag.slug), id);
  pipeline.sadd(KEYS.tagsAll, id);
  await pipeline.exec();

  return tag;
}

export async function getTagById(id: string): Promise<Tag | null> {
  const data = await redis.get<string>(KEYS.tag(id));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const id = await redis.get<string>(KEYS.tagBySlug(slug));
  if (!id) return null;
  return getTagById(id);
}

export async function getAllTags(): Promise<Tag[]> {
  const ids = await redis.smembers<string[]>(KEYS.tagsAll);
  const tags = await Promise.all(ids.map((id) => getTagById(id)));
  return (tags.filter(Boolean) as Tag[]).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function deleteTag(id: string): Promise<boolean> {
  const tag = await getTagById(id);
  if (!tag) return false;

  const pipeline = redis.pipeline();
  pipeline.del(KEYS.tag(id));
  pipeline.del(KEYS.tagBySlug(tag.slug));
  pipeline.srem(KEYS.tagsAll, id);

  // Remove tag from all posts
  const postIds = await redis.smembers<string[]>(KEYS.tagPosts(id));
  for (const postId of postIds) {
    pipeline.srem(KEYS.postTags(postId), id);
  }
  pipeline.del(KEYS.tagPosts(id));
  await pipeline.exec();

  return true;
}

// ============================================
// CONTACT MESSAGES
// ============================================

export async function createMessage(
  data: Omit<ContactMessage, "id" | "is_read" | "created_at">
): Promise<ContactMessage> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const message: ContactMessage = {
    ...data,
    id,
    is_read: false,
    created_at: now,
  };

  const pipeline = redis.pipeline();
  pipeline.set(KEYS.message(id), JSON.stringify(message));
  pipeline.zadd(KEYS.messagesAll, {
    score: new Date(now).getTime(),
    member: id,
  });
  pipeline.sadd(KEYS.messagesUnread, id);
  await pipeline.exec();

  return message;
}

export async function getAllMessages(): Promise<ContactMessage[]> {
  const ids = await redis.zrange<string[]>(KEYS.messagesAll, 0, -1, {
    rev: true,
  });
  const messages = await Promise.all(
    ids.map(async (id) => {
      const data = await redis.get<string>(KEYS.message(id));
      if (!data) return null;
      return typeof data === "string" ? JSON.parse(data) : data;
    })
  );
  return messages.filter(Boolean) as ContactMessage[];
}

export async function markMessageRead(id: string): Promise<void> {
  const data = await redis.get<string>(KEYS.message(id));
  if (!data) return;
  const message: ContactMessage =
    typeof data === "string" ? JSON.parse(data) : data;
  message.is_read = true;
  await redis.set(KEYS.message(id), JSON.stringify(message));
  await redis.srem(KEYS.messagesUnread, id);
}

export async function deleteMessage(id: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.del(KEYS.message(id));
  pipeline.zrem(KEYS.messagesAll, id);
  pipeline.srem(KEYS.messagesUnread, id);
  await pipeline.exec();
}

export async function getUnreadMessageCount(): Promise<number> {
  return redis.scard(KEYS.messagesUnread);
}

// ============================================
// STATS
// ============================================

export async function getDashboardStats() {
  const [publishedCount, draftCount, unreadMessages] = await Promise.all([
    redis.zcard(KEYS.postsPublished),
    redis.zcard(KEYS.postsDraft),
    redis.scard(KEYS.messagesUnread),
  ]);

  return {
    totalPosts: publishedCount + draftCount,
    publishedCount,
    draftCount,
    unreadMessages,
  };
}

// ============================================
// SLIDES
// ============================================

export async function createSlide(
  data: Omit<Slide, "id" | "order" | "created_at" | "updated_at">
): Promise<Slide> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Get current max order
  const existingIds = await redis.zrange<string[]>(KEYS.slidesAll, 0, -1);
  const order = existingIds.length + 1;

  const slide: Slide = { ...data, id, order, created_at: now, updated_at: now };

  const pipeline = redis.pipeline();
  pipeline.set(KEYS.slide(id), JSON.stringify(slide));
  pipeline.zadd(KEYS.slidesAll, { score: order, member: id });
  await pipeline.exec();

  return slide;
}

export async function updateSlide(
  id: string,
  data: Partial<Omit<Slide, "id" | "created_at">>
): Promise<Slide | null> {
  const existing = await getSlideById(id);
  if (!existing) return null;

  const updated: Slide = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  await redis.set(KEYS.slide(id), JSON.stringify(updated));
  return updated;
}

export async function deleteSlide(id: string): Promise<boolean> {
  const existing = await getSlideById(id);
  if (!existing) return false;

  const pipeline = redis.pipeline();
  pipeline.del(KEYS.slide(id));
  pipeline.zrem(KEYS.slidesAll, id);
  await pipeline.exec();

  // Re-order remaining slides
  const remainingIds = await redis.zrange<string[]>(KEYS.slidesAll, 0, -1);
  if (remainingIds.length > 0) {
    const reorderPipeline = redis.pipeline();
    for (let i = 0; i < remainingIds.length; i++) {
      reorderPipeline.zadd(KEYS.slidesAll, { score: i + 1, member: remainingIds[i] });
      const slide = await getSlideById(remainingIds[i]);
      if (slide) {
        slide.order = i + 1;
        reorderPipeline.set(KEYS.slide(remainingIds[i]), JSON.stringify(slide));
      }
    }
    await reorderPipeline.exec();
  }

  return true;
}

export async function getSlideById(id: string): Promise<Slide | null> {
  const data = await redis.get<string>(KEYS.slide(id));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data as unknown as Slide;
}

export async function getAllSlides(): Promise<Slide[]> {
  const ids = await redis.zrange<string[]>(KEYS.slidesAll, 0, -1);
  if (!ids.length) return [];

  const slides = await Promise.all(ids.map((id) => getSlideById(id)));
  return slides.filter(Boolean) as Slide[];
}

export async function reorderSlides(orderedIds: string[]): Promise<void> {
  const pipeline = redis.pipeline();
  for (let i = 0; i < orderedIds.length; i++) {
    const newOrder = i + 1;
    pipeline.zadd(KEYS.slidesAll, { score: newOrder, member: orderedIds[i] });
  }
  await pipeline.exec();

  // Update order field in each slide
  for (let i = 0; i < orderedIds.length; i++) {
    const slide = await getSlideById(orderedIds[i]);
    if (slide) {
      slide.order = i + 1;
      slide.updated_at = new Date().toISOString();
      await redis.set(KEYS.slide(orderedIds[i]), JSON.stringify(slide));
    }
  }
}

// ============================================
// SERVICE PAGES (Faaliyet Alanları) - Sabit 7 sayfa
// ============================================

const DEFAULT_SERVICES: Array<{
  title: string;
  slug: string;
  icon: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  standards: string[];
  applications: string[];
  content?: string;
  cover_image_url?: string;
}> = [
  {
    title: "Yangın Algılama ve İhbar Sistemleri",
    slug: "yangin-algilama-ve-ihbar-sistemleri",
    icon: "Bell",
    shortDesc: "Kablo tipi, hava örneklemeli, alev dedektörleri ve adresli/konvansiyonel yangın alarm sistemleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "/yangin_algilama.png",
  },
  {
    title: "Gaz Algılama Sistemleri",
    slug: "gaz-algilama-sistemleri",
    icon: "Wind",
    shortDesc: "Endüstriyel tesislerde patlayıcı ve zehirli gazların hızlı ve güvenilir algılanması için gelişmiş dedektör çözümleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "/basinctan_koruma.jpeg",
  },
  {
    title: "Kıvılcım Algılama Söndürme",
    slug: "kivilcim-algilama-sondurme",
    icon: "Zap",
    shortDesc: "Kıvılcım ve kor parçacıklarının erken tespiti ile patlama ve yangın riskini ortadan kaldıran sistemler.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "/k%C4%B1v%C4%B1lc%C4%B1m_algilama.jpeg",
  },
  {
    title: "Görüntü Tabanlı Yangın Algılama",
    slug: "goruntu-tabanli-yangin-algilama",
    icon: "Eye",
    shortDesc: "Video analiz ile duman ve alev algılama; klasik sistemlerin yetersiz kaldığı yerlerde çok erken algılama imkanı.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "",
  },
  {
    title: "Exproof Çözümler",
    slug: "exproof-cozumler",
    icon: "Lock",
    shortDesc: "Patlama riski olan tehlikeli alanlarda güvenli ekipman ve aydınlatma çözümleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "/exproof.jpeg",
  },
  {
    title: "Yangın Söndürme Sistemleri",
    slug: "yangin-sondurme-sistemleri",
    icon: "Flame",
    shortDesc: "Sulu, gazlı, köpüklü ve pano içi söndürme sistemleri ile tesislerinizi yangına karşı koruyoruz.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "",
  },
  {
    title: "Patlamadan Korunma",
    slug: "patlamadan-korunma",
    icon: "Shield",
    shortDesc: "Patlama tehlikesi bulunan ortamlarda güvenlik standartlarına uygun koruma çözümleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "/patlamadan_korunma.jpeg",
  },
  {
    title: "Aşırı Basınçtan Korunma",
    slug: "asiri-basinctan-korunma",
    icon: "Gauge",
    shortDesc: "Yüksek basınç ortamlarında güvenliği sağlayan basınç tahliye ve koruma sistemleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "/asiri_basinctan_korunma.jpeg",
  },
  {
    title: "Servis ve Bakım Hizmetleri",
    slug: "servis-ve-bakim-hizmetleri",
    icon: "Wrench",
    shortDesc: "Periyodik bakım, test, eğitim ve devreye alma hizmetleri ile sistemlerinizin sürekli çalışmasını sağlıyoruz.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: "",
    cover_image_url: "/servis_bakim.webp",
  },
];

// Bump this version whenever DEFAULT_SERVICES change to trigger a reseed
const SERVICES_SEED_VERSION = 10;

async function ensureServicePages(): Promise<void> {
  const storedVersion = await redis.get<number>(KEYS.servicesSeedVersion);
  if (storedVersion === SERVICES_SEED_VERSION) return;

  // Clear old data
  const existingIds = await redis.zrange<string[]>(KEYS.servicesAll, 0, -1);
  if (existingIds.length > 0) {
    const cleanPipeline = redis.pipeline();
    for (const id of existingIds) {
      const svc = await redis.get<string>(KEYS.service(id));
      if (svc) {
        try {
          const parsed = typeof svc === "string" ? JSON.parse(svc) : svc;
          cleanPipeline.del(KEYS.serviceBySlug(parsed.slug));
        } catch { /* ignore */ }
      }
      cleanPipeline.del(KEYS.service(id));
    }
    cleanPipeline.del(KEYS.servicesAll);
    await cleanPipeline.exec();
  }

  // Seed all services
  const seedPipeline = redis.pipeline();
  for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
    const def = DEFAULT_SERVICES[i];
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const service: ServicePage = {
      id,
      title: def.title,
      slug: def.slug,
      content: def.content || "",
      excerpt: def.shortDesc,
      cover_image_url: def.cover_image_url || null,
      order: i + 1,
      is_published: true,
      icon: def.icon,
      shortDesc: def.shortDesc,
      longDesc: def.longDesc,
      features: def.features,
      standards: def.standards,
      applications: def.applications,
      created_at: now,
      updated_at: now,
    };
    seedPipeline.set(KEYS.service(id), JSON.stringify(service));
    seedPipeline.set(KEYS.serviceBySlug(def.slug), id);
    seedPipeline.zadd(KEYS.servicesAll, { score: i + 1, member: id });
  }
  seedPipeline.set(KEYS.servicesSeedVersion, SERVICES_SEED_VERSION);
  await seedPipeline.exec();
}

export async function updateServicePage(
  id: string,
  data: Partial<Omit<ServicePage, "id" | "created_at" | "slug" | "order">>
): Promise<ServicePage | null> {
  const existing = await getServicePageById(id);
  if (!existing) return null;

  const updated: ServicePage = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  await redis.set(KEYS.service(id), JSON.stringify(updated));
  return updated;
}

export async function getServicePageById(id: string): Promise<ServicePage | null> {
  const data = await redis.get<string>(KEYS.service(id));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data as unknown as ServicePage;
}

export async function getServicePageBySlug(slug: string): Promise<ServicePage | null> {
  await ensureServicePages();
  const id = await redis.get<string>(KEYS.serviceBySlug(slug));
  if (!id) return null;
  return getServicePageById(id);
}

export async function getAllServicePages(): Promise<ServicePage[]> {
  await ensureServicePages();
  const ids = await redis.zrange<string[]>(KEYS.servicesAll, 0, -1);
  if (!ids.length) return [];

  const services = await Promise.all(ids.map((id) => getServicePageById(id)));
  // Deduplicate by slug (keep first occurrence)
  const seen = new Set<string>();
  return (services.filter(Boolean) as ServicePage[]).filter((s) => {
    if (seen.has(s.slug)) return false;
    seen.add(s.slug);
    return true;
  });
}

export async function getPublishedServicePages(): Promise<ServicePage[]> {
  const all = await getAllServicePages();
  return all.filter((s) => s.is_published);
}

// ============================================
// SUB-PRODUCTS (Alt Ürünler / Alt Hizmetler)
// ============================================

const DEFAULT_SUBPRODUCTS: Array<{
  serviceSlug: string;
  title: string;
  slug: string;
  description: string;
  features: string[];
  cover_image_url?: string;
}> = [
  // ─── Exproof Çözümler ───
  {
    serviceSlug: "exproof-cozumler",
    title: "Exproof Kamera Sistemleri",
    slug: "exproof-kamera-sistemleri",
    description: "Patlama riski olan tehlikeli alanlarda güvenli görüntüleme sağlayan patlamaya dayanıklı kamera sistemleri. CCTV, termal kamera ve video analiz çözümleri ile tesislerinizi 7/24 izleyin.",
    features: [
      "Patlamaya dayanıklı CCTV kamera sistemleri",
      "Termal görüntüleme kameraları",
      "Video analiz ve uzaktan izleme",
      "IP ve analog kamera seçenekleri",
      "Gece görüş ve IR aydınlatma",
      "ATEX/IECEx sertifikalı ekipmanlar",
    ],
  },
  {
    serviceSlug: "exproof-cozumler",
    title: "Exproof Aydınlatma",
    slug: "exproof-aydinlatma",
    description: "Tehlikeli alanlarda güvenli aydınlatma sağlayan patlamaya dayanıklı armatür ve ekipmanlar. LED, floresan ve acil durum aydınlatma çözümleri.",
    features: [
      "LED armatürler",
      "Floresan armatürler",
      "Projektörler",
      "Acil durum aydınlatma ve çıkış işaretleri",
      "Aydınlatma askıları ve aksesuarları",
      "Taşınabilir aydınlatma",
      "ATEX/IECEx sertifikalı ürünler",
    ],
  },
];

const SUBPRODUCTS_SEED_VERSION = 2;

async function ensureSubProducts(): Promise<void> {
  const storedVersion = await redis.get<number>(KEYS.subProductsSeedVersion);
  if (storedVersion === SUBPRODUCTS_SEED_VERSION) return;

  // Make sure services are seeded first
  await ensureServicePages();

  // Clear ALL old subproducts before reseeding
  const allServices = await redis.zrange<string[]>(KEYS.servicesAll, 0, -1);
  const cleanPipeline = redis.pipeline();
  for (const serviceId of allServices) {
    const subIds = await redis.zrange<string[]>(KEYS.subProductsByService(serviceId), 0, -1);
    for (const subId of subIds) {
      const sub = await redis.get<string>(KEYS.subProduct(subId));
      if (sub) {
        try {
          const parsed = typeof sub === "string" ? JSON.parse(sub) : sub;
          cleanPipeline.del(KEYS.subProductBySlug(parsed.slug));
        } catch { /* ignore */ }
      }
      cleanPipeline.del(KEYS.subProduct(subId));
    }
    cleanPipeline.del(KEYS.subProductsByService(serviceId));
  }
  await cleanPipeline.exec();

  // Seed sub-products
  const seedPipeline = redis.pipeline();
  for (let i = 0; i < DEFAULT_SUBPRODUCTS.length; i++) {
    const def = DEFAULT_SUBPRODUCTS[i];
    // Resolve serviceId from slug
    const serviceId = await redis.get<string>(KEYS.serviceBySlug(def.serviceSlug));
    if (!serviceId) continue;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const subProduct: SubProduct = {
      id,
      serviceId,
      title: def.title,
      slug: def.slug,
      description: def.description,
      features: def.features,
      order: i + 1,
      is_published: true,
      cover_image_url: def.cover_image_url || null,
      created_at: now,
      updated_at: now,
    };
    seedPipeline.set(KEYS.subProduct(id), JSON.stringify(subProduct));
    seedPipeline.set(KEYS.subProductBySlug(def.slug), id);
    seedPipeline.zadd(KEYS.subProductsByService(serviceId), { score: i + 1, member: id });
  }
  seedPipeline.set(KEYS.subProductsSeedVersion, SUBPRODUCTS_SEED_VERSION);
  await seedPipeline.exec();
}

export async function getSubProductById(id: string): Promise<SubProduct | null> {
  const data = await redis.get<string>(KEYS.subProduct(id));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data as unknown as SubProduct;
}

export async function getSubProductBySlug(slug: string): Promise<SubProduct | null> {
  await ensureSubProducts();
  const id = await redis.get<string>(KEYS.subProductBySlug(slug));
  if (!id) return null;
  return getSubProductById(id);
}

export async function getSubProductsByServiceId(serviceId: string): Promise<SubProduct[]> {
  await ensureSubProducts();
  const ids = await redis.zrange<string[]>(KEYS.subProductsByService(serviceId), 0, -1);
  if (!ids.length) return [];
  const items = await Promise.all(ids.map((id) => getSubProductById(id)));
  return items.filter(Boolean) as SubProduct[];
}

export async function getSubProductsByServiceSlug(serviceSlug: string): Promise<SubProduct[]> {
  const serviceId = await redis.get<string>(KEYS.serviceBySlug(serviceSlug));
  if (!serviceId) return [];
  return getSubProductsByServiceId(serviceId);
}

export async function createSubProduct(
  data: Omit<SubProduct, "id" | "order" | "created_at" | "updated_at">
): Promise<SubProduct> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Get current max order for this service
  const existingIds = await redis.zrange<string[]>(KEYS.subProductsByService(data.serviceId), 0, -1);
  const order = existingIds.length + 1;

  const subProduct: SubProduct = { ...data, id, order, created_at: now, updated_at: now };

  const pipeline = redis.pipeline();
  pipeline.set(KEYS.subProduct(id), JSON.stringify(subProduct));
  pipeline.set(KEYS.subProductBySlug(data.slug), id);
  pipeline.zadd(KEYS.subProductsByService(data.serviceId), { score: order, member: id });
  await pipeline.exec();

  return subProduct;
}

export async function updateSubProduct(
  id: string,
  data: Partial<Omit<SubProduct, "id" | "serviceId" | "created_at">>
): Promise<SubProduct | null> {
  const existing = await getSubProductById(id);
  if (!existing) return null;

  const updated: SubProduct = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  const pipeline = redis.pipeline();
  if (data.slug && data.slug !== existing.slug) {
    pipeline.del(KEYS.subProductBySlug(existing.slug));
    pipeline.set(KEYS.subProductBySlug(updated.slug), id);
  }
  pipeline.set(KEYS.subProduct(id), JSON.stringify(updated));
  await pipeline.exec();

  return updated;
}

export async function deleteSubProduct(id: string): Promise<boolean> {
  const existing = await getSubProductById(id);
  if (!existing) return false;

  const pipeline = redis.pipeline();
  pipeline.del(KEYS.subProduct(id));
  pipeline.del(KEYS.subProductBySlug(existing.slug));
  pipeline.zrem(KEYS.subProductsByService(existing.serviceId), id);
  await pipeline.exec();

  return true;
}

// ============================================
// CATALOGS (Kataloglar)
// ============================================

export async function getAllCatalogs(): Promise<Catalog[]> {
  const ids = await redis.zrange<string[]>(KEYS.catalogsAll, 0, -1);
  if (!ids.length) return [];
  const items = await Promise.all(ids.map((id) => redis.get<string>(KEYS.catalog(id))));
  return items
    .filter(Boolean)
    .map((item) => (typeof item === "string" ? JSON.parse(item) : item) as Catalog)
    .sort((a, b) => a.order - b.order);
}

export async function getPublishedCatalogs(): Promise<Catalog[]> {
  const all = await getAllCatalogs();
  return all.filter((c) => c.is_published);
}

export async function createCatalog(
  data: Omit<Catalog, "id" | "order" | "created_at" | "updated_at">
): Promise<Catalog> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const existingIds = await redis.zrange<string[]>(KEYS.catalogsAll, 0, -1);
  const order = existingIds.length + 1;

  const catalog: Catalog = { ...data, id, order, created_at: now, updated_at: now };

  const pipeline = redis.pipeline();
  pipeline.set(KEYS.catalog(id), JSON.stringify(catalog));
  pipeline.zadd(KEYS.catalogsAll, { score: order, member: id });
  await pipeline.exec();

  return catalog;
}

export async function updateCatalog(
  id: string,
  data: Partial<Omit<Catalog, "id" | "created_at">>
): Promise<Catalog | null> {
  const existing = await redis.get<string>(KEYS.catalog(id));
  if (!existing) return null;
  const parsed: Catalog = typeof existing === "string" ? JSON.parse(existing) : existing;

  const updated: Catalog = { ...parsed, ...data, updated_at: new Date().toISOString() };
  await redis.set(KEYS.catalog(id), JSON.stringify(updated));
  return updated;
}

export async function deleteCatalog(id: string): Promise<boolean> {
  const existing = await redis.get<string>(KEYS.catalog(id));
  if (!existing) return false;

  const pipeline = redis.pipeline();
  pipeline.del(KEYS.catalog(id));
  pipeline.zrem(KEYS.catalogsAll, id);
  await pipeline.exec();
  return true;
}

// ============================================
// ABOUT PAGE (Hakkımızda)
// ============================================

export async function getAboutPage(): Promise<AboutPage> {
  const data = await redis.get<string>(KEYS.pageAbout);
  if (!data) {
    return { content: "", cover_image_url: null, updated_at: new Date().toISOString() };
  }
  return typeof data === "string" ? JSON.parse(data) : data as unknown as AboutPage;
}

export async function updateAboutPage(
  data: Partial<Pick<AboutPage, "content" | "cover_image_url">>
): Promise<AboutPage> {
  const existing = await getAboutPage();
  const updated: AboutPage = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };
  await redis.set(KEYS.pageAbout, JSON.stringify(updated));
  return updated;
}

// ============================================
// SITE SETTINGS
// ============================================

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  stats: [
    { value: "15+", label: "Yıllık Tecrübe" },
    { value: "200+", label: "Tamamlanan Proje" },
    { value: "7", label: "Uzmanlık Alanı" },
    { value: "24/7", label: "Teknik Destek" },
  ],
  phone: "+90 (312) 557 43 28",
  email: "info@arkelk.com.tr",
  address: "Altay Mah. Ayaş Ankara Yolu Blv. Platinum No: 212, 10. Kat No: 49, Etimesgut, Ankara, Türkiye",
  whyArkDescription:
    "Sadece ürün temin eden bir tedarikçi değil; risk analizinden devreye almaya kadar tüm süreci yöneten bir mühendislik partneriyiz. Her proje, tesisin özgün tehlike profiline göre tasarlanır.",
  whyArkImage:
    "https://images.pexels.com/photos/3862634/pexels-photo-3862634.jpeg?auto=compress&cs=tinysrgb&w=900",
  sectors: [
    { name: "Petrokimya & Rafineri", image: "https://images.pexels.com/photos/162568/oil-pump-industry-petroleum-162568.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { name: "Enerji Santralleri", image: "https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { name: "Madencilik", image: "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { name: "Gıda & Tahıl Tesisleri", image: "https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg?auto=compress&cs=tinysrgb&w=600" },
  ],


  footerDescription:
    "Endüstriyel tesisler için uçtan uca güvenlik mühendisliği ve anahtar teslim projeler.",
  copyrightText: "ARK Global Elektrik Tic. Ltd. Şti. Tüm hakları saklıdır.",
  
  milestones: [
    { year: '2009', event: 'Kurucu kadronun Tyco Fire & Security bünyesinde uzmanlık kazanması' },
    { year: '2014', event: 'Honeywell ve UTC Fire Safety portföyünde proje ve entegrasyon deneyimi' },
    { year: '2018', event: 'Det-Tronics yüksek güvenlik sistemleri alanında özelleşme' },
    { year: '2021', event: 'ARK Global Elektrik\'in kurulması, uçtan uca mühendislik modeli' },
    { year: '2024', event: '200+ tamamlanmış proje, 7 uzmanlık alanı, ulusal referanslar' },
    { year: '2026', event: 'Bölgesel büyüme ve yeni teknoloji ortaklıkları' },
  ],
  values: [
    { icon: 'Shield', title: 'Güvenlik Önce', desc: 'Her kararımızda insan hayatının ve tesisin güvenliği en üst önceliktir.' },
    { icon: 'Award', title: 'Teknik Mükemmellik', desc: 'Uluslararası standartlara tam uyum ve sektörün en yüksek mühendislik kalitesi.' },
    { icon: 'Users', title: 'Ortaklık Anlayışı', desc: 'Müşterilerimizi proje boyu bilgilendiriyor, uzun vadeli ilişkiler kuruyoruz.' },
    { icon: 'Zap', title: 'İnovasyon', desc: 'Yeni teknolojileri takip ediyor, projelerimize en gelişmiş çözümleri entegre ediyoruz.' },
    { icon: 'Globe', title: 'Global Bakış', desc: 'Dünya standartlarında bilgi ve deneyimi Türkiye endüstrisine aktarıyoruz.' },
    { icon: 'Target', title: 'Sonuç Odaklılık', desc: 'Söz verdiğimiz sonuçları, belirlenen takvim ve bütçe dahilinde teslim ediyoruz.' },
  ],
  expertiseItems: [
    'Risk analizi ve HAZOP çalışmaları',
    'Sahaya özel proses mühendisliği',
    'NFPA, EN, ATEX standartlarında tasarım',
    'Det-Tronics yüksek teknoloji sistemleri entegrasyonu',
    'Anahtar teslim kurulum ve devreye alma',
    '7/24 bakım ve teknik destek',
  ],
  expertiseImage: "https://images.pexels.com/photos/3862634/pexels-photo-3862634.jpeg?auto=compress&cs=tinysrgb&w=900",
  certPartners: [
    { name: 'Det-Tronics', desc: 'Yetkili Entegratör' },
    { name: 'ATEX', desc: 'Direktif Uyumlu' },
    { name: 'NFPA', desc: 'Üye & Uygulayıcı' },
    { name: 'IECEx', desc: 'Sertifika Uzmanı' },
  ],
  servicesPageImage: "https://images.pexels.com/photos/2760241/pexels-photo-2760241.jpeg?auto=compress&cs=tinysrgb&w=1920",
  contactPageImage: "/about-engineering.png",
  aboutPageSubtitle: "15 yılı aşkın endüstriyel güvenlik tecrübesiyle, standart bir tedarikçiden öte uçtan uca mühendislik partneri.",

  ctaBannerImage:
    "https://images.pexels.com/photos/2760241/pexels-photo-2760241.jpeg?auto=compress&cs=tinysrgb&w=1920",
  ctaBannerBadge: "Projeniz için hazırız",
  ctaBannerTitle: "Tesisiniz için",
  ctaBannerAccent: "Doğru Çözümü Bulalım",
  ctaBannerDescription:
    "Risk analizinden anahtar teslim kuruluma kadar tüm süreci sizin yanınızda yönetiyoruz. Ücretsiz ön değerlendirme için bugün iletişime geçin.",

  // YENİ: Ana Sayfa Dinamik Alanları
  aboutTeaserTitle: "Hakkımızda",
  aboutTeaserSubtitle: "Mühendislik Partneri",
  aboutTeaserText: "ARK Global, endüstriyel tesislerin güvenliğini en üst düzeye çıkarmak amacıyla Endüstriyel Kazalardan Korunma Sistemleri alanında ileri mühendislik ve anahtar teslim projeler sunan vizyoner bir kuruluştur.\n\nKurucu kadrosunun 15 yılı aşkın sektör tecrübesine dayanan birikimimiz; Tyco, Honeywell ve UTC gibi dünya devi markalarda kazanılmış global deneyim üzerine inşa edilmiştir.",
  aboutTeaserImage: "",
  aboutTeaserQuote: "Her kararımızda insan hayatının ve tesisin güvenliği en üst önceliktir.",

  servicesSectionTitle: "Uzmanlık Alanlarımız",
  servicesSectionSubtitle: "Hizmetlerimiz",
  servicesSectionText: "Endüstriyel tesislerinizin tüm güvenlik ihtiyaçları için kapsamlı ve entegre çözümler sunuyoruz. Her proje tesisinizin özgün gereksinimlerine göre özel olarak tasarlanmaktadır.",

  whyArkSubtitle: "Farkımız Mühendislikte",
  whyArkQuote: "\"Sadece ürün temini değil; risk analizi ile başlayan, uluslararası standartlarda hazırlanan detaylı projelendirme süreçlerimizle fark yaratıyoruz.\"",
  whyArkReasonsMDX: `- Uluslararası standartlarda (NFPA, EN, ATEX) tasarım ve uygulama.
- Det-Tronics gibi dünya lideri markalarla doğrudan çözüm ortaklığı.
- Anahtar teslim projelerde 15 yılı aşkın saha ve entegrasyon deneyimi.
- Tesisinizin risk profiline özel, terzi işi güvenlik çözümleri.`,

  standardsSectionTitle: "Standartlar & Markalar",
  carouselBrands: [
    { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/NFPA_logo.svg/1200px-NFPA_logo.svg.png", title: "NFPA" },
    { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/ATEX_logo.svg/1200px-ATEX_logo.svg.png", title: "ATEX" },
    { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/IECEx_logo.svg/1200px-IECEx_logo.svg.png", title: "IECEx" },
    { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/CE_mark.svg/1200px-CE_mark.svg.png", title: "CE" },
  ],


  // Blog Sayfası
  blogPageImage: "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1920",
  blogPageSubtitle: "En son yazılar ve teknoloji içerikleri",

  // SEO
  seoTitle: "ARK Global — Endüstriyel Güvenlik Mühendisliği",
  seoDescription: "Endüstriyel tesisler için uçtan uca kazalardan korunma sistemleri. Risk analizinden anahtar teslim projeye, uluslararası standartlarda mühendislik.",
  seoKeywords: "Endüstriyel Güvenlik, Yangın Algılama, Patlamadan Korunma, ARK Global",

  // Sectors
  sectorsSectionTitle: "Hizmet Verdiğimiz Sektörler",

  // Hakkımızda Page Details
  aboutHeroImage: "https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=1920",
  aboutStoryTitle: "Deneyimden Doğan Uzmanlık",
  aboutStoryText: "ARK Global'in temeli, kurucu kadrosunun Tyco, Honeywell ve UTC Fire Safety gibi dünya devi markalarda bizzat sahada kazandığı 15 yılı aşkın deneyime dayanmaktadır.",
  aboutExpertiseSubtitle: "Yetkinliklerimiz",
  aboutExpertiseTitle: "Neden Biz?",
  aboutExpertiseDescription: "Sadece ürün temini değil; risk analizi ile başlayan, tesisin ihtiyaçlarına özel proses mühendisliği ile şekillenen ve uluslararası standartlarda hazırlanan detaylı projelendirme süreçlerimizle fark yaratıyoruz.",

  updated_at: new Date().toISOString(),
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const data = await redis.get<string>(KEYS.siteSettings);
  if (!data) {
    // Seed default settings on first read
    await redis.set(KEYS.siteSettings, JSON.stringify(DEFAULT_SITE_SETTINGS));
    return DEFAULT_SITE_SETTINGS;
  }
  const parsed = typeof data === "string" ? JSON.parse(data) : data as unknown as SiteSettings;
  // Always use latest contact info from defaults
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...parsed,
    phone: DEFAULT_SITE_SETTINGS.phone,
    email: DEFAULT_SITE_SETTINGS.email,
    address: DEFAULT_SITE_SETTINGS.address,
    copyrightText: DEFAULT_SITE_SETTINGS.copyrightText,
  };
}

export async function updateSiteSettings(
  data: Partial<Omit<SiteSettings, "updated_at">>
): Promise<SiteSettings> {
  const existing = await getSiteSettings();
  const updated: SiteSettings = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };
  await redis.set(KEYS.siteSettings, JSON.stringify(updated));
  return updated;
}
