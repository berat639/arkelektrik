import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateServicePage, getAllServicePages } from "@/lib/db";

export async function GET() {
  const services = await getAllServicePages();
  return NextResponse.json({ services });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "ID zorunlu" }, { status: 400 });
  }

  // Only pass known editable fields
  const allowed: Record<string, unknown> = {};
  const keys = ["title", "content", "excerpt", "cover_image_url", "icon", "shortDesc", "longDesc", "features", "standards", "applications", "is_published"] as const;
  for (const k of keys) {
    if (fields[k] !== undefined) allowed[k] = fields[k];
  }

  const service = await updateServicePage(id, allowed);
  if (!service) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ service });
}
