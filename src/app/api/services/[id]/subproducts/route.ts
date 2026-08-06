import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSubProductsByServiceId,
  createSubProduct,
  updateSubProduct,
  deleteSubProduct,
  getServicePageById,
} from "@/lib/db";
import { revalidatePath } from "next/cache";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const service = await getServicePageById(id);
  if (!service) {
    return NextResponse.json({ error: "Servis bulunamadı" }, { status: 404 });
  }

  const subProducts = await getSubProductsByServiceId(id);
  return NextResponse.json({ subProducts });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const service = await getServicePageById(id);
  if (!service) {
    return NextResponse.json({ error: "Servis bulunamadı" }, { status: 404 });
  }

  const body = await request.json();
  const { title, slug, description, features, is_published, cover_image_url } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Başlık ve slug zorunludur" }, { status: 400 });
  }

  const subProduct = await createSubProduct({
    serviceId: id,
    title,
    slug,
    description: description || "",
    features: features || [],
    is_published: is_published ?? true,
    cover_image_url: cover_image_url || null,
  });

  revalidatePath("/", "layout");

  return NextResponse.json({ subProduct }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subProductId, ...fields } = body;

  if (!subProductId) {
    return NextResponse.json({ error: "subProductId zorunludur" }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  const keys = ["title", "slug", "description", "features", "is_published", "cover_image_url", "order"] as const;
  for (const k of keys) {
    if (fields[k] !== undefined) allowed[k] = fields[k];
  }

  const subProduct = await updateSubProduct(subProductId, allowed);
  if (!subProduct) {
    return NextResponse.json({ error: "Alt ürün bulunamadı" }, { status: 404 });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ subProduct });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subProductId = searchParams.get("subProductId");

  if (!subProductId) {
    return NextResponse.json({ error: "subProductId zorunludur" }, { status: 400 });
  }

  const deleted = await deleteSubProduct(subProductId);
  if (!deleted) {
    return NextResponse.json({ error: "Alt ürün bulunamadı" }, { status: 404 });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ success: true });
}
