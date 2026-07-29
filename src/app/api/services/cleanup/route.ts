import { NextResponse } from "next/server";
import { redis, KEYS } from "@/lib/upstash";

// One-time cleanup: remove all service pages, subproducts, and let ensureServicePages reseed
export async function GET() {
  // 1. Get all current service IDs
  const existingIds = await redis.zrange<string[]>(KEYS.servicesAll, 0, -1);

  // 2. Delete all service data and their subproducts
  const pipeline = redis.pipeline();
  for (const id of existingIds) {
    // Delete subproducts for this service
    const subIds = await redis.zrange<string[]>(KEYS.subProductsByService(id), 0, -1);
    for (const subId of subIds) {
      const sub = await redis.get<string>(KEYS.subProduct(subId));
      if (sub) {
        try {
          const parsed = typeof sub === "string" ? JSON.parse(sub) : sub;
          pipeline.del(KEYS.subProductBySlug(parsed.slug));
        } catch { /* ignore */ }
      }
      pipeline.del(KEYS.subProduct(subId));
    }
    pipeline.del(KEYS.subProductsByService(id));

    // Delete service itself
    pipeline.del(KEYS.service(id));
  }
  pipeline.del(KEYS.servicesAll);

  // Delete all known slug mappings (old + new)
  const slugs = [
    "yangindan-korunma-sistemleri",
    "kivilcim-algilama-sondurme",
    "patlamadan-korunma",
    "asiri-basinctan-korunma",
    "gaz-algilama",
    "ex-proof-cozumler",
    "servis-ve-bakim-hizmetleri",
    "yangin-sondurme-sistemleri",
    "goruntu-tabanli-yangin-algilama",
    "yangin-algilama-sistemleri",
    "yangin-algilama-ve-ihbar-sistemleri",
    "gaz-algilama-sistemleri",
    "exproof-cozumler",
  ];
  for (const slug of slugs) {
    pipeline.del(KEYS.serviceBySlug(slug));
  }

  // Reset seed versions to force reseed on next load
  pipeline.del(KEYS.servicesSeedVersion);
  pipeline.del(KEYS.subProductsSeedVersion);

  await pipeline.exec();

  return NextResponse.json({ success: true, deleted: existingIds.length });
}
