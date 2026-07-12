import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const count = await redis.hincrby("post_views", slug, 1);
    return NextResponse.json({ views: count });
  } catch (error) {
    console.error("View count error:", error);
    return NextResponse.json({ views: 0 }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const count = (await redis.hget<number>("post_views", slug)) || 0;
    return NextResponse.json({ views: count });
  } catch (error) {
    console.error("View count error:", error);
    return NextResponse.json({ views: 0 }, { status: 500 });
  }
}
