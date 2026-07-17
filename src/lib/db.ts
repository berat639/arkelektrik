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
  content?: string;
}> = [
  {
    title: "Yangından Korunma Sistemleri",
    slug: "yangindan-korunma-sistemleri",
    icon: "Flame",
    shortDesc: "Konvansiyonel ve adreslenebilir yangın algılama, Fire & Gas, görüntü işleme, hava örneklemeli sistemler, kablo/ışın tipi ve gaz/alev dedektörleriyle kapsamlı yangın koruması.",
    longDesc: "Endüstriyel tesislerde yangın riski; insan hayatı, çevre ve iş sürekliliği açısından en kritik tehditlerden biridir. ARK Global olarak, tesislerin risk profiline uygun çok katmanlı yangından korunma çözümleri sunuyoruz. Konvansiyonelden adreslenebilir sistemlere, Fire & Gas algılamadan görüntü işleme teknolojilerine kadar geniş bir ürün ve mühendislik yelpazesiyle, yangını kaynağında tespit edip müdahale sürelerini minimuma indiriyoruz.",
    features: ["Konvansiyonel ve adreslenebilir yangın algılama panelleri", "Fire & Gas entegre algılama sistemleri", "Video tabanlı yangın ve duman algılama (VID)", "Hava örneklemeli yüksek hassasiyetli duman algılama (ASD/VESDA)", "Lineer ısı algılamalı kablo tipi dedektörler", "Işın tipi (beam) duman dedektörleri", "Katalitik, IR ve elektrokimyasal gaz dedektörleri", "UV/IR ve multi-spektrum alev dedektörleri", "SCADA, BMS ve DCS entegrasyonu"],
    standards: ["NFPA 72", "EN 54", "ISO 7240", "EN 60079-29", "NFPA 720", "EN 54-20", "IEC 60079", "ATEX 2014/34/EU"],
    applications: ["Petrokimya ve rafineri tesisleri", "Enerji santralleri ve trafo merkezleri", "Gemi ve offshore platformları", "Veri merkezleri ve telekomünikasyon odaları", "Endüstriyel üretim ve depolama tesisleri", "Tüneller ve kapalı otopark yapıları", "Havalimanları ve alışveriş merkezleri"],
    content: `## Konvansiyonel Yangın Algılama Sistemleri

Konvansiyonel yangın algılama sistemleri, yangın güvenliğinin temel yapı taşını oluşturur. Bu sistemlerde dedektörler zone (bölge) bazında gruplandırılır ve panele bağlanır. Herhangi bir dedektör alarm verdiğinde, hangi zone'dan geldiği tespit edilir ancak bireysel dedektör adresi gösterilmez.

**Temel Özellikler:**
- Zone bazlı alarm bölgelendirmesi ile hızlı müdahale
- Duman, ısı ve multi-sensör dedektör seçenekleri
- Manuel ihbar butonları ve alarm zil/siren entegrasyonu
- Küçük ve orta ölçekli tesisler için maliyet etkin çözüm
- EN 54 ve NFPA 72 standartlarına tam uyumluluk

Konvansiyonel sistemler; depolar, küçük ölçekli üretim tesisleri, ofis binaları ve perakende mağazaları gibi alanlarda yaygın olarak tercih edilmektedir.

---

## Adreslenebilir Yangın Algılama Sistemleri

Adreslenebilir sistemlerde her dedektör ve modül benzersiz bir adrese sahiptir. Bu sayede yangın paneli, alarm veren cihazın tam konumunu belirleyerek müdahale süresini önemli ölçüde kısaltır. Büyük ve karmaşık tesislerde vazgeçilmez bir çözümdür.

**Temel Özellikler:**
- Her dedektöre özel adres ataması ile nokta bazlı algılama
- Gerçek zamanlı cihaz durum izleme ve arıza tespiti
- Akıllı algoritmalar ile yanlış alarm oranının minimuma indirilmesi
- Loop (halka) kablo topolojisi ile yüksek sistem güvenilirliği
- Geniş tesislerde binlerce cihazın tek panelden yönetimi
- Grafik harita gösterimi ve yangın senaryosu programlama

Adreslenebilir sistemler; hastaneler, havalimanları, alışveriş merkezleri, yüksek katlı binalar ve büyük endüstriyel tesislerde kritik önem taşır.

---

## Fire & Gas Algılama Sistemleri

Fire & Gas (F&G) sistemleri, özellikle petrokimya, rafineri ve offshore gibi yüksek riskli endüstriyel tesislerde yangın ve gaz kaçağı tehditlerini eş zamanlı olarak izler. Bu sistemler, yangın dedektörleri ile gaz algılama sensörlerini tek bir entegre platform üzerinde birleştirerek kapsamlı bir erken uyarı ağı oluşturur.

**Temel Özellikler:**
- Yangın ve gaz algılama fonksiyonlarının tek sistemde birleştirilmesi
- SIL 2/3 sertifikalı güvenlik döngüleri
- Cause & Effect (neden-sonuç) matris programlaması
- Otomatik söndürme, havalandırma ve izolasyon aksiyonları
- Merkezi F&G kontrol panelleri ve uzak I/O üniteleri
- DCS, ESD ve SCADA ile kesintisiz entegrasyon

F&G sistemleri; IEC 61511, NFPA 72 ve EN 54 standartlarına uygun olarak tasarlanır ve yaşam döngüsü boyunca yönetilir.

---

## Görüntü İşleme Teknolojisi ile Yangın Algılama Sistemleri

Video tabanlı yangın algılama (Video Image Detection — VID) sistemleri, gelişmiş görüntü işleme algoritmaları ve yapay zekâ kullanarak kamera görüntüleri üzerinden duman ve alev tespiti yapar. Geleneksel dedektörlerin yetersiz kaldığı geniş açık alanlar ve yüksek tavanlı mekânlarda üstün performans sunar.

**Temel Özellikler:**
- Yapay zekâ destekli duman ve alev tanıma algoritmaları
- Geniş açık alanlarda ve yüksek tavanlarda etkili algılama
- Mevcut CCTV altyapısı ile entegrasyon imkânı
- Çoklu kamera ile geniş alan kapsaması
- Düşük yanlış alarm oranı (yapay zekâ filtreleme)
- Gerçek zamanlı görüntü analizi ve alarm doğrulama

VID sistemleri; hangarlar, büyük depolar, atrium yapılar, tarihi binalar ve açık hava depolama alanlarında konvansiyonel dedektörlere güçlü bir alternatif sunar.

---

## Hava Örneklemeli Sistemler

Hava örneklemeli duman algılama (Aspirating Smoke Detection — ASD) sistemleri, ortam havasını aktif olarak örnekleyerek en erken aşamada duman tespiti yapar. VESDA ve benzeri teknolojiler, duman partiküllerini geleneksel dedektörlerden çok daha önce algılayarak kritik varlıkların korunmasını sağlar.

**Temel Özellikler:**
- Çok erken aşamada duman algılama (0,005 — 20 %obs/m hassasiyet)
- Boru ağı ile geniş alanlardan sürekli hava örneklemesi
- Hassasiyet seviyeleri programlanabilir (uyarı, aksiyon, yangın 1, yangın 2)
- Temiz oda, soğuk hava deposu gibi zorlu ortamlarda çalışabilme
- Çok düşük yanlış alarm oranı
- EN 54-20 ve NFPA 76 standartlarına uygunluk

Hava örneklemeli sistemler; veri merkezleri, müzeler, temiz odalar, soğuk hava depoları, telekomünikasyon odaları ve tarihi yapılar gibi kritik ve yüksek değerli mekânlarda tercih edilir.

---

## Kablo Tipi Dedektörler

Lineer ısı algılama kabloları (Linear Heat Detection — LHD), uzun mesafeler boyunca sürekli ısı izlemesi yapan özel kablolardır. Konveyör bantları, kablo tavaları, tüneller ve boru hatları gibi uzun ve dar alanlarda nokta tipi dedektörlerin yetersiz kaldığı uygulamalarda ideal çözüm sunar.

**Temel Özellikler:**
- Kablo boyunca sürekli ve kesintisiz ısı izleme
- Sabit sıcaklık ve sıcaklık artış hızı algılama modları
- Fiber optik ve bakır iletkenli seçenekler
- Zorlu çevre koşullarına (toz, nem, kimyasal) dayanıklılık
- Noktasal konum tespiti (fiber optik DTS sistemlerinde)
- Uzun ömürlü ve düşük bakım gereksinimi

Kablo tipi dedektörler; tünel yapıları, konveyör bantları, kablo kanalları, petrokimya boru hatları, enerji kablolarının geçtiği galeriler ve park alanlarında yaygın olarak kullanılmaktadır.

---

## Işın Tipi Dedektörler

Işın tipi (beam) duman dedektörleri, bir verici ve alıcı arasında oluşturulan kızılötesi ışın demetinin duman tarafından zayıflatılması prensibine dayanır. Yüksek tavanlı ve geniş açık alanlarda nokta tipi dedektörlerin montajının zor veya verimsiz olduğu durumlarda tercih edilir.

**Temel Özellikler:**
- 100 metreye kadar algılama mesafesi
- Yüksek tavanlı alanlarda (8 — 25 m) etkili duman algılama
- Reflektörlü (tek uçlu) ve verici-alıcı (çift uçlu) modeller
- Otomatik kirlilik telafisi ile yanlış alarm koruması
- Minimum kablolama ile kolay montaj
- EN 54-12 standardına uygunluk

Işın tipi dedektörler; fabrika üretim alanları, depolar, spor salonları, sergi alanları, kiliseler ve tarihi yapılar gibi geniş hacimli mekânlarda idealdir.

---

## Gaz Dedektörleri

Gaz dedektörleri, ortamdaki yanıcı, toksik veya oksijen yetersizliği durumlarını sürekli izleyerek erken uyarı sağlar. Farklı sensör teknolojileri (katalitik, elektrokimyasal, kızılötesi, yarı iletken) ile geniş bir gaz yelpazesine karşı koruma sunar.

**Temel Özellikler:**
- Katalitik bead sensörler (LEL — yanıcı gaz tespiti)
- Kızılötesi (NDIR) sensörler (metan, propan, CO₂)
- Elektrokimyasal sensörler (H₂S, CO, NH₃, Cl₂ gibi toksik gazlar)
- Açık hat (open-path) IR dedektörler ile geniş alan taraması
- Ultrasonik gaz kaçak dedektörleri
- SIL 2 sertifikalı modeller ve ATEX/IECEx uyumluluğu

Gaz dedektörleri; doğalgaz ve LPG tesisleri, rafineriler, kimya fabrikaları, kapalı otoparklar, atık su arıtma tesisleri ve soğutma sistemlerinde hayati öneme sahiptir.

---

## Alev Dedektörleri

Alev dedektörleri, alevin yaydığı ultraviyole (UV), kızılötesi (IR) veya her iki dalga boyundaki radyasyonu algılayarak yangının en erken aşamasında tespit sağlar. Özellikle hızla yayılan sıvı ve gaz yangınlarında milisaniyeler içinde alarm verir.

**Temel Özellikler:**
- UV, IR, UV/IR kombine ve multi-spektrum (IR³) algılama modelleri
- 0,1 saniyenin altında tepki süresi
- 60 metreye kadar algılama mesafesi
- Güneş ışığı ve kaynak arkı gibi yanlış alarm kaynaklarına karşı filtre
- ATEX/IECEx sertifikalı Ex-proof gövde seçenekleri
- SIL 2/3 uyumluluk ve kendini test etme fonksiyonu

Alev dedektörleri; rafineri ve petrokimya tesisleri, uçak hangarları, boya kabinleri, silah/mühimmat depoları, gaz dolum istasyonları ve offshore platformlarında vazgeçilmez koruma elemanıdır.`,
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
    content: `## Kıvılcım Algılama

Kıvılcım algılama sistemleri, pnömatik taşıma hatları, konveyör bantları ve kanal sistemleri içinde oluşan kıvılcım ve akkor parçacıklarını milisaniyeler içinde tespit eder. Bu sistemler, malzemenin filtre, silo veya depolama ünitesine ulaşmadan önce tutuşma kaynağının ortadan kaldırılmasını sağlar.

**Çalışma Prensibi:**

Kıvılcım dedektörleri, taşıma hattı boyunca stratejik noktalara yerleştirilir. IR (kızılötesi) sensörler, malzeme akışı içindeki sıcak parçacıkların yaydığı radyasyonu algılar ve alarm sinyalini kontrol ünitesine iletir. Sistem, algılama anından itibaren 50 milisaniyenin altında tepki verebilir.

**Temel Özellikler:**
- Yüksek hassasiyetli IR kıvılcım dedektörleri
- 1 mm²'ye kadar küçük akkor parçacıkları tespit edebilme
- 20 m/s'ye kadar taşıma hızlarında güvenilir algılama
- Toz, buhar ve yoğun ortam koşullarında çalışabilme
- Otomatik lens temizleme (hava üflemeli) sistemi
- Çoklu dedektör ile 360° kanal taraması

---

## Gün Işığında Alev Algılama

Gün ışığında alev algılama (Daylight Flame Detection) teknolojisi, açık hava ortamlarında veya doğal ışığa maruz kalan endüstriyel alanlarda, güneş ışığı ve diğer optik parazitlerden etkilenmeden alev tespiti yapabilen ileri seviye bir algılama sistemidir.

**Çalışma Prensibi:**

Multi-spektrum (UV/IR ve IR³) sensör teknolojisi kullanılarak alevin kendine özgü titreşim frekansı ve spektral imzası analiz edilir. Güneş ışığı, kaynak arkı, sıcak yüzeyler ve yapay aydınlatma gibi yanlış alarm kaynaklarından ayırt edici algoritmalar sayesinde, yalnızca gerçek alev durumlarında alarm üretilir.

**Temel Özellikler:**
- Multi-spektrum (IR³) ve UV/IR kombine algılama modelleri
- Güneş ışığı altında yanlış alarmsız çalışma
- 65 metreye kadar algılama mesafesi (0,1 m² alev kaynağı için)
- 180° geniş görüş açısı
- Sürekli kendini test etme (CIST) fonksiyonu
- ATEX/IECEx sertifikalı Ex-proof gövde seçenekleri
- SIL 2 uyumluluk

Gün ışığında alev algılama sistemleri; açık hava depolama alanları, yükleme/boşaltma terminalleri, boru hatları, offshore platformları ve rafineri sahalarında kritik güvenlik sağlar.

---

## Kıvılcım Sulu Söndürme

Kıvılcım sulu söndürme sistemleri, algılanan kıvılcım veya akkor parçacığının üzerine yüksek basınçlı su sisi püskürterek tutuşma kaynağını anında söndürür. Bu yöntem, malzeme akışının minimum düzeyde etkilenmesiyle hızlı ve etkili bir müdahale sağlar.

**Çalışma Prensibi:**

Kıvılcım dedektörü alarm verdiğinde, kontrol ünitesi kanal üzerindeki yüksek hızlı selenoid vanayı tetikler. Özel tasarım nozullar aracılığıyla ince su sisi (water mist) doğrudan tutuşma noktasına yönlendirilir. Söndürme süresi tipik olarak 100-500 milisaniye arasındadır.

**Temel Özellikler:**
- Yüksek hızlı selenoid vanalar (açılma süresi < 50 ms)
- İnce su sisi nozulları ile minimum malzeme ıslanması
- Malzeme hızına göre otomatik süre ayarlaması
- Su basınç ve debi izleme sistemi
- Otomatik vana sızıntı testi
- Çoklu söndürme bölgesi desteği (zone bazlı)
- Düşük su tüketimi ile çevre dostu çözüm

**Uygulama Alanları:**
- Tahıl, un ve yem taşıma hatları
- Ahşap talaşı ve pellet üretim tesisleri
- Tekstil lif taşıma kanalları
- Kağıt ve karton fabrikaları
- Geri dönüşüm tesis konveyörleri

---

## Kıvılcım Gazlı Söndürme

Kıvılcım gazlı söndürme sistemleri, su kullanımının uygun olmadığı ortamlarda kıvılcım ve akkor parçacıklarını inert gaz (CO₂, azot) ile söndürür. Özellikle neme duyarlı malzemelerin taşındığı hatlarda ve elektrikli ekipman yakınlarında tercih edilen bir çözümdür.

**Çalışma Prensibi:**

Algılama sonrası kontrol ünitesi, yüksek basınçlı CO₂ veya azot tüplerinden gaz salınımını tetikler. Gaz, özel nozullar aracılığıyla kanal içine enjekte edilerek oksijen konsantrasyonunu tutuşma eşiğinin altına düşürür ve kıvılcımı boğarak söndürür.

**Temel Özellikler:**
- CO₂ ve azot (N₂) söndürme ajanı seçenekleri
- Malzeme üzerinde sıfır nem etkisi
- Kapalı kanal ve silo uygulamalarında yüksek etkinlik
- Otomatik gaz tüp basınç izleme ve düşük basınç alarmı
- Çoklu salınım bölgesi programlama
- Elektrikli ekipman ve hassas malzeme uyumluluğu
- ATEX sertifikalı bileşenler

**Uygulama Alanları:**
- Kimyasal toz ve granül taşıma hatları
- İlaç ve gıda endüstrisi (neme duyarlı malzemeler)
- Elektronik bileşen üretimi
- Metal toz ve talaş taşıma sistemleri
- Solvent buharı riski olan ortamlar`,
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
    content: `## Patlama Tahliye (Venting) Sistemleri

Patlama tahliye sistemleri, kapalı ekipman içinde meydana gelen patlamanın kontrollü biçimde dışarıya yönlendirilmesini sağlayarak ekipman hasarını ve personel yaralanmasını önler. En yaygın ve maliyet etkin pasif koruma yöntemidir.

**Çalışma Prensibi:**

Patlama anında oluşan basınç artışı, ekipman üzerindeki tahliye panellerinin (rupture disc / explosion vent) önceden hesaplanmış açılma basıncında kırılmasını sağlar. Basınç ve alev güvenli bir şekilde dış ortama yönlendirilir. Bina içi uygulamalarda flameless (alevsiz) venting üniteleri kullanılarak alev ve basınç dışarıya çıkmadan söndürülür.

**Temel Özellikler:**
- Pasif çalışma prensibi — enerji kaynağı gerektirmez
- Düşük açılma basıncı (Pstat) ile hızlı tepki
- Flameless venting ile iç mekân uygulamaları
- Hijyenik tasarım seçenekleri (gıda ve ilaç sektörü)
- EN 14491 ve NFPA 68 hesaplama yöntemlerine uygun boyutlandırma
- Paslanmaz çelik ve karbon çelik malzeme seçenekleri

---

## Patlama Bastırma (Suppression) Sistemleri

Patlama bastırma sistemleri (HRD — High Rate Discharge), patlamayı milisaniyeler içinde algılayıp kimyasal söndürme ajanı enjekte ederek patlama basıncının yıkıcı seviyeye ulaşmasını engeller. Tahliye imkânı olmayan veya bina içi ekipmanlarda kritik bir aktif koruma yöntemidir.

**Çalışma Prensibi:**

Yüksek hassasiyetli dinamik basınç sensörleri, patlama başlangıcındaki basınç artış hızını algılar. Kontrol ünitesi 5 milisaniye içinde HRD bastırma ünitelerini tetikler. Yüksek basınçlı tüplerden sodyum bikarbonat veya monoamonyum fosfat bazlı söndürme ajanı ekipman içine püskürtülerek alev cephesi söndürülür.

**Temel Özellikler:**
- 5-15 ms arası tetikleme süresi
- Yüksek basınçlı (60 bar) HRD tüpler
- Sodyum bikarbonat ve MAP söndürme ajanları
- Birden fazla bastırma ünitesi ile büyük hacim koruması
- Otomatik basınç izleme ve sistem durum göstergesi
- EN 14373 ve VdS sertifikasyonu

---

## Patlama İzolasyon Sistemleri

Patlama izolasyon sistemleri, bir ekipmanda başlayan patlamanın boru hatları ve kanallar üzerinden diğer ekipmanlara yayılmasını (propagation) önler. Kimyasal bariyer, hızlı kapama vanaları ve mekanik izolasyon yöntemleri kullanılır.

**Çalışma Prensibi:**

Patlama algılandığında, bağlantı hatları üzerindeki izolasyon mekanizmaları devreye girerek alev cephesinin ilerlemesini durdurur. Kimyasal bariyerler söndürme ajanı enjekte ederek alevi boğar; mekanik vanalar fiziksel olarak hattı kapatır.

**Temel Özellikler:**
- Kimyasal izolasyon bariyerleri (ExtinguishingBarrier)
- Hızlı kapama vanaları (slam-shut valve) — kapanma süresi < 30 ms
- Çift yönlü izolasyon kapasitesi
- Rotary airlock (döner vana) izolasyon üniteleri
- Pinch valve ve flap valve seçenekleri
- Tüm boru çapları için uygun boyutlar (DN 50 — DN 1000)

---

## Patlama Risk Analizi ve Zone Sınıflandırması

Etkili bir patlamadan korunma stratejisi, doğru risk analizi ile başlar. ARK Global, tesislerde kapsamlı patlama risk değerlendirmesi yaparak uygun koruma seviyesini belirler.

**Hizmet Kapsamı:**
- Toz ve gaz patlama risk analizi (Kst, Pmax, MIE değerleri)
- ATEX Zone sınıflandırması (Zone 0, 1, 2 / Zone 20, 21, 22)
- Patlama koruma dokümanı (Explosion Protection Document) hazırlığı
- Koruma konsepti tasarımı ve ekipman seçimi
- HAZOP ve LOPA analizleri
- Mevcut sistemlerin uygunluk denetimi ve iyileştirme önerileri`,
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
    content: `## Emniyet Valfleri (Safety Relief Valves)

Emniyet valfleri, basınçlı ekipmanların birincil koruma hattını oluşturur. Sistem basıncı önceden ayarlanmış değeri aştığında otomatik olarak açılarak fazla basıncı güvenli biçimde tahliye eder ve ekipman bütünlüğünü korur.

**Çalışma Prensibi:**

Yay yüklü veya pilot kumandalı valf mekanizması, set basıncına ulaşıldığında otomatik olarak açılır. Fazla basınç tahliye hattına (flare veya atmosfer) yönlendirilir. Basınç normal seviyeye döndüğünde valf otomatik olarak kapanır.

**Temel Özellikler:**
- Yay yüklü (spring-loaded) ve pilot kumandalı tipler
- Konvansiyonel, dengeli körüklü (balanced bellows) ve pilot operated modeller
- Gaz, buhar ve sıvı servislerine uygun tasarımlar
- Yüksek sızdırmazlık sınıfları (API 527 uyumlu)
- Paslanmaz çelik, Inconel, Hastelloy gibi özel alaşım seçenekleri
- API 526, API 520 ve ASME Section VIII uyumlu boyutlandırma
- Set basıncı ve kapasite sertifikasyonu

---

## Patlama (Kırılma) Plakaları (Rupture Discs)

Kırılma plakaları, belirli bir basınç değerinde anlık olarak açılarak aşırı basıncın tahliyesini sağlayan tek kullanımlık basınç tahliye cihazlarıdır. Emniyet valflerinin yetersiz kaldığı hızlı basınç artışlarında veya valflerle birlikte ikincil koruma olarak kullanılır.

**Çalışma Prensibi:**

Önceden kalibre edilmiş ince metal membran, belirlenen kırılma basıncına ulaşıldığında anlık olarak açılır ve tam kesit tahliye sağlar. Açılma süresi milisaniye mertebesindedir, bu da emniyet valflerinden çok daha hızlı tepki anlamına gelir.

**Temel Özellikler:**
- Anlık tam kesit açılma (zero fragmentation tasarımlar)
- Forward-acting ve reverse-acting modeller
- Vakum ve basınç kombinasyonu için çift yönlü tasarımlar
- Korozif ve toksik medya için özel malzeme seçenekleri (Hastelloy, Tantalum, PTFE kaplama)
- Kırılma basıncı toleransı ±2% (EN ISO 4126-2)
- Emniyet valfi ile kombine (combination holder) uygulamalar
- Kırılma göstergesi (burst indicator) ile uzaktan izleme

---

## Basınç İzleme ve Güvenlik Enstrümantasyon Sistemleri (SIS)

Güvenlik enstrümantasyon sistemleri (SIS), prosesin güvenli çalışma sınırlarını sürekli izleyerek tehlikeli durumda otomatik olarak koruyucu aksiyonları devreye sokar. IEC 61511 standardına uygun SIL sertifikalı sistemler, en yüksek düzeyde proses güvenliği sağlar.

**Temel Özellikler:**
- SIL 1, SIL 2 ve SIL 3 sertifikalı güvenlik döngüleri
- Basınç, sıcaklık, seviye ve akış bazlı güvenlik fonksiyonları
- Redundant (yedekli) sensör ve lojik çözücü mimarileri (1oo2, 2oo3)
- SIS kontrol panelleri ve güvenlik PLC'leri
- Proses güvenlik analizi: HAZOP, LOPA, SIL belirleme
- Güvenlik fonksiyon testi (proof test) planlama ve uygulama
- IEC 61511 ve IEC 61508 tam uyumluluk

---

## Acil Tahliye Hat Tasarımı ve Flare Sistemleri

Aşırı basınç durumlarında açığa çıkan gaz veya sıvının güvenli biçimde uzaklaştırılması için acil tahliye hatları ve flare sistemleri tasarlanır. API 521 hesaplama yöntemlerine uygun olarak hat boyutlandırma, stres analizi ve destek tasarımı yapılır.

**Hizmet Kapsamı:**
- API 521 bazlı tahliye yükü hesaplamaları (fire case, blocked outlet, thermal expansion vb.)
- Tahliye hattı boyutlandırma ve stres analizi
- Flare header, knock-out drum ve flare tip tasarımı
- Atmosferik ve yüksek basınç tahliye sistemleri
- Tahliye hattı malzeme seçimi ve korozyon değerlendirmesi
- Mevcut sistemlerin kapasite doğrulaması ve debottleneck çalışmaları`,
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
    content: `## Yanıcı Gaz Algılama Sistemleri

Yanıcı gaz algılama sistemleri, ortamdaki yanıcı gaz konsantrasyonunu sürekli izleyerek Alt Patlama Limiti (LEL — Lower Explosive Limit) değerinin altında erken uyarı verir. Metan, propan, bütan, hidrojen ve diğer yanıcı gazların kaçağını anında tespit eder.

**Sensör Teknolojileri:**

- **Katalitik Bead Sensörler:** Gaz moleküllerinin katalitik yüzeyde yanmasıyla oluşan ısı farkını ölçer. 0–100% LEL aralığında yüksek doğruluk sağlar. Geniş gaz yelpazesine duyarlıdır ancak oksijensiz ortamlarda çalışmaz.

- **Kızılötesi (NDIR) Sensörler:** Gazın kızılötesi ışığı absorbe etme özelliğinden yararlanır. Katalitik zehirlenmeye karşı bağışıktır, uzun ömürlüdür ve oksijensiz ortamlarda da çalışır. Metan, propan ve CO₂ tespitinde üstün performans.

- **Açık Hat (Open-Path) IR Dedektörler:** Verici ve alıcı arasında 5-200 metre mesafede gaz bulutu tespiti yapar. Geniş alanları tek bir cihaz çifti ile tarar. Çit hattı (fence-line) ve çevresel izleme uygulamalarında idealdir.

**Temel Özellikler:**
- %0-100 LEL aralığında sürekli izleme
- Çoklu alarm eşiği (ön alarm, ana alarm, acil durum)
- 4-20 mA, HART, Modbus ve Fieldbus iletişim protokolleri
- SIL 2 sertifikalı modeller
- ATEX/IECEx Zone 0, 1, 2 sertifikasyonu
- Otomatik kalibrasyon hatırlatma ve arıza bildirimi

---

## Toksik Gaz Algılama Sistemleri

Toksik gaz algılama sistemleri, insan sağlığına zararlı gazları (H₂S, CO, NH₃, Cl₂, SO₂, NO₂ vb.) ppm seviyesinde tespit ederek anında alarm verir. Çalışan güvenliği ve çevresel uyumluluk için kritik öneme sahiptir.

**Sensör Teknolojileri:**

- **Elektrokimyasal Sensörler:** Gaz moleküllerinin elektrot yüzeyindeki oksidasyonu/redüksiyonu ile elektrik akımı üretir. ppb-ppm hassasiyetinde ölçüm yapar. H₂S, CO, NH₃, Cl₂, HCN, EtO gibi geniş toksik gaz yelpazesi.

- **Fotoiyonizasyon (PID) Sensörler:** UV ışığı ile gaz moleküllerini iyonize ederek toplam VOC (Uçucu Organik Bileşen) konsantrasyonunu ölçer. Solvent buharları ve kimyasal kaçak tespitinde kullanılır.

- **Metal Oksit Yarıiletken (MOS) Sensörler:** Düşük konsantrasyonlarda geniş spektrumlu gaz tespiti sağlar. Endüstriyel hijyen ve iç hava kalitesi izleme uygulamalarında tercih edilir.

**Temel Özellikler:**
- ppb düzeyinde hassasiyet
- TWA (zaman ağırlıklı ortalama) ve STEL (kısa süreli maruziyet) alarm seviyeleri
- Kişisel maruziyet izleme ve veri kayıt
- Çoklu gaz algılama kapasitesi (tek cihazda 4-6 gaz)
- ATEX/IECEx sertifikalı modeller

---

## Oksijen İzleme Sistemleri

Oksijen izleme sistemleri, ortamdaki oksijen seviyesinin güvenli sınırların dışına çıkmasını tespit eder. Hem oksijen yetersizliği (boğulma riski) hem de oksijen fazlalığı (yangın/patlama riski artışı) durumlarını izler.

**Temel Özellikler:**
- 0-25% vol O₂ ölçüm aralığı
- Düşük oksijen (< %19,5) ve yüksek oksijen (> %23,5) alarmları
- Elektrokimyasal ve zirkonyum oksit sensör teknolojileri
- Kapalı alan giriş izni (confined space entry) uygulamaları
- Azot, argon ve CO₂ inertleme sistemleri ile entegrasyon
- EN 50545-1 ve EN 45544 uyumluluğu

---

## Ultrasonik Gaz Kaçak Dedektörleri

Ultrasonik gaz kaçak dedektörleri, basınçlı gaz kaçaklarının ürettiği ultrasonik ses dalgalarını algılayarak gaz türünden bağımsız tespit yapar. Rüzgârlı açık hava ortamlarında ve seyreltik gaz bulutlarının dedektöre ulaşamadığı durumlarda geleneksel nokta tipi dedektörlere güçlü bir tamamlayıcıdır.

**Temel Özellikler:**
- Gaz türünden bağımsız algılama (tüm basınçlı gaz kaçakları)
- Rüzgâr yönü ve hızından etkilenmeme
- Geniş algılama alanı (30 metreye kadar yarıçap)
- Ayarlanabilir hassasiyet ve frekans filtreleri
- SIL 2 sertifikalı modeller
- Geleneksel dedektörlerle birlikte çok katmanlı koruma

---

## Taşınabilir (Portatif) Gaz Dedektörleri

Taşınabilir gaz dedektörleri, saha personelinin kapalı alan girişi, rutin devriye ve acil durum müdahalesi sırasında kişisel güvenliğini sağlar.

**Temel Özellikler:**
- Tek gazlı ve çoklu gaz (4-6 gaz) modeller
- Yanıcı (LEL), toksik (H₂S, CO) ve O₂ eş zamanlı ölçüm
- Anlık ve TWA/STEL maruziyet kayıt
- Sesli, ışıklı ve titreşimli alarm uyarıları
- USB/Bluetooth ile veri indirme ve filo yönetimi
- Bump test ve kalibrasyon istasyonları ile entegrasyon`,
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
    content: `## Patlayıcı Atmosfer Zone Sınıflandırması

Zone sınıflandırması, patlayıcı atmosfer oluşma olasılığına göre tehlikeli bölgelerin kategorize edilmesidir. Doğru zone belirlenmesi, uygun koruma seviyesine sahip ekipman seçimi için temel oluşturur ve yasal zorunluluktur.

**Gaz/Buhar Ortamları:**

| Zone | Tanım | Patlayıcı Atmosfer Süresi |
|------|--------|---------------------------|
| Zone 0 | Sürekli veya uzun süreli patlayıcı atmosfer | > 1000 saat/yıl |
| Zone 1 | Normal çalışmada zaman zaman oluşan | 10 — 1000 saat/yıl |
| Zone 2 | Normal çalışmada oluşmayan, kısa süreli | < 10 saat/yıl |

**Toz Ortamları:**

| Zone | Tanım | Patlayıcı Atmosfer Süresi |
|------|--------|---------------------------|
| Zone 20 | Sürekli veya uzun süreli toz bulutu | > 1000 saat/yıl |
| Zone 21 | Normal çalışmada zaman zaman oluşan | 10 — 1000 saat/yıl |
| Zone 22 | Normal çalışmada oluşmayan, kısa süreli | < 10 saat/yıl |

**Hizmet Kapsamı:**
- Tesis genelinde zone sınıflandırma çalışması
- Zone haritası ve teknik dokümantasyon hazırlığı
- Mevcut ekipmanların zone uyumluluk denetimi
- ATEX Patlamadan Korunma Dokümanı (EPD) hazırlığı

---

## Ex-proof Koruma Tipleri

Patlayıcı ortamlarda kullanılan ekipmanlar, farklı koruma prensipleriyle tasarlanır. Her koruma tipi, belirli zone ve uygulama koşulları için optimize edilmiştir.

**Exd — Alev Sızdırmaz (Flameproof):**
Ekipman içinde meydana gelen patlamanın muhafaza dışına yayılmasını engeller. Motorlar, aydınlatma armatürleri, junction boxlar ve kontrol panoları için yaygın çözüm. Zone 1 ve Zone 2 uygulamaları.

**Exi — Kendinden Güvenli (Intrinsic Safety):**
Devre enerji seviyesini tutuşma eşiğinin altında tutar. Sensörler, transmitterlar ve sinyal kabloları için idealdir. Zone 0 dahil tüm bölgelerde kullanılabilir. Ia (Zone 0), Ib (Zone 1), Ic (Zone 2) kategorileri.

**Exp — Basınçlandırma (Pressurization):**
Muhafaza içi basınçlı hava veya inert gaz ile sürekli purge yaparak patlayıcı atmosferin girişini engeller. Büyük kontrol panoları, analizör kabinleri ve VFD panoları için uygun. px, py, pz kategorileri.

**Exe — Artırılmış Güvenlik (Increased Safety):**
Normal çalışmada kıvılcım veya sıcak yüzey oluşmaması için ek güvenlik önlemleri uygular. Terminal kutuları, kablo bağlantıları ve aydınlatma için kullanılır. Zone 1 ve Zone 2.

**Exn — Kıvılcımsız (Non-sparking):**
Normal çalışmada kıvılcım üretmeyen ekipmanlar için maliyet etkin çözüm. Sadece Zone 2 uygulamaları. Motorlar, aydınlatma ve kontrol ekipmanları.

---

## Ex-proof Ekipman Temini ve Entegrasyonu

ARK Global, dünya genelindeki lider üreticilerden sertifikalı Ex-proof ekipman temin ederek tesise özel entegrasyon çözümleri sunar.

**Ekipman Kategorileri:**
- Ex-proof aydınlatma armatürleri (LED floodlight, linear, emergency)
- Ex-proof kontrol panoları ve dağıtım kutuları
- Ex-proof kablo rekorları, buat ve junction boxlar
- Ex-proof motorlar ve fan üniteleri
- Ex-proof sinyal ve güç kabloları
- Ex-proof kamera ve CCTV sistemleri
- Ex-proof iletişim ekipmanları (telefon, interkom, siren)

---

## Periyodik Ex Denetimi ve Sertifikasyon

Patlayıcı ortamlardaki ekipmanların düzenli denetimi yasal zorunluluktur. ARK Global, IEC 60079-17 standardına uygun periyodik denetim hizmeti sunar.

**Hizmet Kapsamı:**
- Görsel muayene (sıkılaştırma, kablo girişleri, etiketler)
- Detaylı muayene (iç bileşenler, sızdırmazlık, topraklama)
- Ölçümlü muayene (yalıtım direnci, topraklama sürekliliği)
- Denetim raporu ve eksiklik bildirim formu
- İyileştirme planı ve takibi
- IEC 60079-17 ve IEC 60079-14 uyumlu belgelendirme`,
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
    content: `## Periyodik Bakım ve Test Hizmetleri

Güvenlik sistemlerinin sürekliliği ve güvenilirliği, düzenli bakım ve fonksiyon testlerine bağlıdır. ARK Global, uluslararası standartlara uygun periyodik bakım programları ile sistemlerinizin her an çalışır durumda kalmasını garantiler.

**Yangın Algılama ve Alarm Sistemleri Bakımı:**
- Dedektör kirlilik ve hassasiyet testi
- Manuel ihbar butonu fonksiyon testi
- Alarm paneli fonksiyon ve batarya testi
- Siren ve flaşör ses/ışık seviyesi kontrolü
- Loop bütünlük ve kablo izolasyon ölçümü
- Yazılım güncelleme ve parametre doğrulama
- EN 54-14 ve NFPA 72 Bölüm 14 uyumlu test protokolleri

**Söndürme Sistemleri Bakımı:**
- Gazlı söndürme tüp basınç ve ağırlık kontrolü
- Selenoid valf ve mekanik aktüatör fonksiyon testi
- Nozul ve boru hattı bütünlük muayenesi
- Yönlendirme vanası ve damper fonksiyon testi
- Su sprinkler sistemi akış ve basınç testi
- NFPA 25 ve EN 15004 uyumlu test prosedürleri

---

## Gaz Dedektörü Kalibrasyon Hizmetleri

Gaz dedektörlerinin doğru ve güvenilir ölçüm yapabilmesi için düzenli kalibrasyon zorunludur. ARK Global, sahada ve laboratuvar ortamında profesyonel kalibrasyon hizmeti sunar.

**Hizmet Kapsamı:**
- Sıfır ve span gazı ile tam kalibrasyon
- Sertifikalı test gazları (izlenebilir referans standartlar)
- Sensör ömür değerlendirmesi ve değişim planlaması
- Kalibrasyon sertifikası düzenlenmesi (ISO 17025 izlenebilir)
- Bump test (fonksiyon doğrulama) uygulaması
- Kalibrasyon periyodu takibi ve hatırlatma sistemi
- Katalitik, elektrokimyasal, IR ve PID sensör kalibrasyonu

---

## Devreye Alma (Commissioning) Hizmetleri

Yeni kurulan veya modifiye edilen güvenlik sistemlerinin tasarım spesifikasyonlarına uygun çalıştığının doğrulanması için kapsamlı devreye alma hizmeti sunulmaktadır.

**Hizmet Kapsamı:**
- Mekanik tamamlanma kontrolü (mechanical completion)
- Kablo bağlantı ve izolasyon direnci ölçümleri
- Loop testi ve I/O doğrulama
- Fonksiyon testi (her cihaz ve senaryo bazında)
- Cause & Effect matris doğrulama
- Entegrasyon testi (DCS, ESD, F&G, SCADA)
- FAT (Fabrika Kabul Testi) ve SAT (Saha Kabul Testi)
- Devreye alma raporu ve as-built dokümantasyon

---

## Arıza Tespit ve Acil Müdahale (7/24)

ARK Global, 7 gün 24 saat acil müdahale hizmeti ile kritik arıza durumlarında hızlı çözüm sunar.

**Hizmet Kapsamı:**
- Uzaktan arıza teşhis ve yönlendirme
- 24 saat içinde sahaya müdahale ekibi sevkiyatı
- Yedek parça express temin hizmeti
- Geçici yedekleme (bypass/workaround) çözümleri
- Kök neden analizi ve kalıcı çözüm önerisi
- Arıza raporu ve önleyici aksiyon planı

---

## Eğitim ve Yetkinlik Geliştirme

Güvenlik sistemlerinin etkin kullanımı, operatör ve bakım personelinin doğru eğitim almasına bağlıdır. ARK Global, tesise özel eğitim programları düzenler.

**Eğitim Programları:**
- Sistem operatör eğitimi (panel kullanımı, alarm yönetimi)
- Bakım teknisyeni eğitimi (arıza tespit, yedek parça değişimi)
- Gaz dedektörü kullanım ve kalibrasyon eğitimi
- Yangın söndürme sistemi müdahale eğitimi
- ATEX farkındalık ve Ex-proof ekipman kullanım eğitimi
- Acil durum tatbikatı planlama ve yönetimi
- Eğitim sertifikası ve yetkinlik değerlendirmesi`,
  },
];

// Bump this version whenever DEFAULT_SERVICES change to trigger a reseed
const SERVICES_SEED_VERSION = 5;

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
