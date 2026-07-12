import { NextResponse } from "next/server";
import { redis, KEYS } from "@/lib/upstash";

// One-time cleanup: remove duplicate service pages and let ensureServicePages reseed
export async function GET() {
  // 1. Get all current service IDs
  const existingIds = await redis.zrange<string[]>(KEYS.servicesAll, 0, -1);

  // 2. Delete all service data
  const pipeline = redis.pipeline();
  for (const id of existingIds) {
    pipeline.del(KEYS.service(id));
  }
  pipeline.del(KEYS.servicesAll);

  // Delete all slug mappings
  const slugs = [
    "yangin-algilama-sondurme",
    "kivilcim-algilama-sondurme",
    "patlamadan-korunma",
    "asiri-basinctan-korunma",
    "gaz-algilama",
    "ex-proof-cozumler",
    "servis-ve-bakim-hizmetleri",
  ];
  for (const slug of slugs) {
    pipeline.del(KEYS.serviceBySlug(slug));
  }
  await pipeline.exec();

  return NextResponse.json({ success: true, deleted: existingIds.length });
}
