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
  AboutPage,
  SiteSettings,
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
}> = [
  {
    title: "Yangın Algılama & Söndürme",
    slug: "yangin-algilama-sondurme",
    icon: "Flame",
    shortDesc: "Endüstriyel tesisler için ileri yangın algılama teknolojileri ve otomatik söndürme sistemleri. Erken uyarı ile hasarı minimize edin.",
    longDesc: "Endüstriyel tesislerde yangın; salt bir tesis kaybı değil, insan hayatları ve çevre için ciddi bir tehlikedir. ARK Global olarak, riski kaynağında bastırmaya odaklanan, çok katmanlı ve entegre yangın algılama & söndürme çözümleri sunuyoruz.",
    features: ["Alev, duman, ısı ve çok sensörlü dedektörler", "Otomatik gazlı, köpüklü ve su sisi söndürme sistemleri", "Adreslenebilir yangın alarm panelleri ve kontrol üniteleri", "Acil tahliye, sesli & görsel uyarı sistemleri", "Yangın kapı ve kapama damper entegrasyonu", "Uzaktan izleme ve SCADA entegrasyonu"],
    standards: ["NFPA 72", "NFPA 2001", "EN 54", "EN 12094", "ISO 7240"],
    applications: ["Petrokimya ve rafineri tesisleri", "Enerji santralleri", "Gemi ve offshor platformları", "Veri merkezleri", "Endüstriyel üretim tesisleri"],
  },
  {
    title: "Kıvılcım Algılama & Söndürme",
    slug: "kivilcim-algilama-sondurme",
    icon: "Zap",
    shortDesc: "Konveyör hatları ve pnömatik taşıma sistemlerinde kıvılcım ve akkor parçacıklarını milisaniyeler içinde tespit edip söndürme.",
    longDesc: "Toz, talaş, lif veya tahıl taşıyan pnömatik konveyör hatları, kıvılcım kaynaklı yangın ve patlamalara karşı son derece savunmasızdır. ARK Global'ın kıvılcım algılama ve söndürme sistemleri, taşıma hattı üzerindeki kıvılcım veya akkor parçacıkları milisaniyeler içinde tespit ederek otomatik su sisi veya CO₂ söndürme mekanizmalarını devreye alır.",
    features: ["UV/IR kıvılcım algılama sensörleri", "Yüksek hızlı otomatik söndürme valfleri", "Konveyör hız bağımlı söndürme optimizasyonu", "Erken uyarı ve otomatik durdurma entegrasyonu", "Lokal kontrol ve uzaktan izleme paneli", "Silo, siklon ve filtre üniteleri için koruma"],
    standards: ["NFPA 654", "EN 16447", "ATEX 2014/34/EU", "VdS"],
    applications: ["Tahıl ve un değirmenleri", "Ahşap işleme ve pellet tesisleri", "Tekstil üretimi", "Madencilik ve maden işleme", "Geri dönüşüm tesisleri"],
  },
  {
    title: "Patlamadan Korunma",
    slug: "patlamadan-korunma",
    icon: "Shield",
    shortDesc: "Toz ve gaz patlamalarına karşı kapsamlı koruma sistemleri. ATEX direktiflerine ve NFPA 69 standartlarına uyumlu çözümler.",
    longDesc: "Endüstriyel ortamlarda gaz, buhar veya toz bulutlarının ateşlenmesi, tesis genelinde yıkıcı hasara yol açabilecek zincir patlamalara neden olabilir. ARK Global, patlama riski olan tesisler için kapsamlı koruma paketleri sunar.",
    features: ["Patlama tahliye panelleri ve kapakları", "Kimyasal patlama bastırma sistemleri (HRD)", "Patlama izolasyon vanaları ve kimyasal bariyer", "Rotary-valve ve çabuk kapama düzenekleri", "Patlama risk analizi ve zone sınıflandırması", "Entegre kontrol ve erken uyarı sistemleri"],
    standards: ["NFPA 69", "EN 14491", "EN 14373", "ATEX", "IECEx"],
    applications: ["Kimya ve ilaç fabrikaları", "Tahıl siloları ve unlu mamuller", "Kömür işleme tesisleri", "Plastik ve kauçuk üretimi", "Boya ve vernik tesisleri"],
  },
  {
    title: "Aşırı Basınçtan Korunma",
    slug: "asiri-basinctan-korunma",
    icon: "Gauge",
    shortDesc: "Basınçlı ekipmanlar ve boru hatları için ani basınç artışlarına karşı koruma sistemleri ve acil tahliye çözümleri.",
    longDesc: "Endüstriyel süreçlerde beklenmedik basınç artışları; boru hatları, tanklar ve reaktörlerde felaket boyutunda hasara yol açabilir. ARK Global, bu risklere karşı birden fazla katmanlı koruma mimarisi kurar.",
    features: ["Basınç tahliye ve emniyet valfleri", "Patlama (kırılma) plakaları tasarımı ve seçimi", "Dijital basınç izleme ve alarm sistemleri", "Proses güvenlik analizi (HAZOP, LOPA)", "Acil tahliye hat tasarımı", "SIL sertifikalı güvenlik enstrümantasyon sistemleri (SIS)"],
    standards: ["API 521", "EN 4126", "ASME VIII", "IEC 61511 (SIL)", "ISO 4126"],
    applications: ["Kimyasal reaktörler ve distilasyon kolonları", "Basınçlı depolama tankları", "Boru hatları ve kompresör istasyonları", "Kazan ve ısı değiştiriciler", "Enerji santralleri"],
  },
  {
    title: "Gaz Algılama",
    slug: "gaz-algilama",
    icon: "Wind",
    shortDesc: "Yanıcı, toksik ve oksijen yoksunluğu gazlarına karşı sabit ve taşınabilir gaz algılama sistemleri. Sürekli ortam izleme.",
    longDesc: "Pek çok endüstriyel ortamda görünmez tehlikeler gizlenmektedir: doğalgaz sızıntıları, H₂S gibi toksik gazlar veya oksijen azalması saniyeler içinde hayatı tehdit edebilir. ARK Global'ın gaz algılama sistemleri; katalitik, elektrokimyasal ve kızılötesi sensör teknolojilerini bir arada kullanarak tespit eder.",
    features: ["Sabit çok noktalı gaz dedektör sistemleri", "Katalitik bead, IR ve elektrokimyasal sensörler", "Merkezi kontrol ve gaz alarm panelleri", "Taşınabilir (kişisel) gaz dedektörleri", "Açık hat IR gaz dedektörleri (uzun mesafe)", "SCADA ve DCS entegrasyonu"],
    standards: ["EN 60079-29", "IEC 60079-29", "ATEX", "NFPA 72"],
    applications: ["Doğalgaz ve LPG tesisleri", "Rafineri ve petrokimya", "Boya, solvent ve kimyasal üretim", "Kapalı otopark ve tünel sistemleri", "Soğutma ve amonyak sistemleri"],
  },
  {
    title: "Ex Proof Çözümler",
    slug: "ex-proof-cozumler",
    icon: "Lock",
    shortDesc: "Patlayıcı atmosfer içeren Zone 0, 1, 2 ve Zone 20, 21, 22 bölgeler için sertifikalı EX-proof ekipman temini ve entegrasyonu.",
    longDesc: "Patlayıcı gaz, buhar veya toz bulutlarının bulunabildiği bölgelerde kullanılan her elektrikli ekipman, ATEX/IECEx direktiflerine uygun \"Ex-proof\" sertifikasına sahip olmalıdır. ARK Global tüm Ex-proof sürecini yönetir.",
    features: ["ATEX ve IECEx sertifikalı ekipman temini", "Patlayıcı atmosfer zone sınıflandırması (Ex Zone)", "Flame-proof (Exd), intrinsically safe (Exi), pressurized (Exp) çözümler", "Ex-proof kablo rekorları, pano ve junction boxlar", "Teknik dosya ve uygunluk belgesi hazırlığı", "Periyodik Ex denetimi ve sertifikasyon desteği"],
    standards: ["ATEX 2014/34/EU", "IECEx", "EN 60079 serisi", "IEC 60079 serisi"],
    applications: ["Petrokimya ve rafineri Zone 0/1/2", "Gaz dolum istasyonları", "Hammadde depolama tankları", "Spray boya kabinleri ve solvent depoları", "Madencilik (metan zone)"],
  },
  {
    title: "Servis ve Bakım Hizmetleri",
    slug: "servis-ve-bakim-hizmetleri",
    icon: "Wrench",
    shortDesc: "Kurulu sistemlerin periyodik bakımı, kalibrasyonu, test ve devreye alma hizmetleri. 7/24 acil müdahale desteği.",
    longDesc: "Güvenlik sistemlerinin etkinliği, yalnızca doğru kurulumla değil; düzenli bakım ve kalibrasyon ile sürdürülebilir. ARK Global, kurduğu ya da devir aldığı tüm sistemler için kapsamlı bir bakım programı sunar.",
    features: ["Yıllık ve periyodik bakım sözleşmeleri", "Gaz dedektörü kalibrasyonu ve sertifikasyonu", "Yangın alarmı ve söndürme sistemi fonksiyon testleri", "Arıza tespiti ve acil müdahale (7/24)", "Yedek parça temini ve stok yönetimi", "Bakım kayıt ve raporlama sistemi"],
    standards: ["EN 15004", "NFPA 25", "NFPA 72 Bölüm 14", "EN 54-14"],
    applications: ["Tüm sektörlerdeki kurulu sistemler", "Devralınan ve modernize edilecek sistemler", "Fabrika kabul testleri (FAT / SAT)", "Yıllık zorunlu denetim ve sigorta raporları", "Operatör eğitim programları"],
  },
];

async function ensureServicePages(): Promise<void> {
  // Check if already seeded correctly (all 7 slugs exist and count matches)
  const existingCount = await redis.zcard(KEYS.servicesAll);
  if (existingCount === DEFAULT_SERVICES.length) {
    const firstSlugId = await redis.get<string>(KEYS.serviceBySlug(DEFAULT_SERVICES[0].slug));
    const lastSlugId = await redis.get<string>(KEYS.serviceBySlug(DEFAULT_SERVICES[6].slug));
    if (firstSlugId && lastSlugId) {
      const score1 = await redis.zscore(KEYS.servicesAll, firstSlugId);
      const score2 = await redis.zscore(KEYS.servicesAll, lastSlugId);
      if (score1 !== null && score2 !== null) return;
    }
  }

  // Clear and reseed to avoid duplicates
  const existingIds = await redis.zrange<string[]>(KEYS.servicesAll, 0, -1);
  if (existingIds.length > 0) {
    const cleanPipeline = redis.pipeline();
    for (const id of existingIds) {
      cleanPipeline.del(KEYS.service(id));
    }
    cleanPipeline.del(KEYS.servicesAll);
    for (const def of DEFAULT_SERVICES) {
      cleanPipeline.del(KEYS.serviceBySlug(def.slug));
    }
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
      content: "",
      excerpt: def.shortDesc,
      cover_image_url: null,
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
  await seedPipeline.exec();
}

export async function updateServicePage(
  id: string,
  data: Partial<Omit<ServicePage, "id" | "created_at" | "slug" | "title" | "order">>
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
  return services.filter(Boolean) as ServicePage[];
}

export async function getPublishedServicePages(): Promise<ServicePage[]> {
  const all = await getAllServicePages();
  return all.filter((s) => s.is_published);
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
  phone: "+90 (212) 123 45 67",
  email: "info@arkglobal.com.tr",
  address: "Istanbul, Türkiye",
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
  contactPageImage: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1920",
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
  return { ...DEFAULT_SITE_SETTINGS, ...parsed };
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
