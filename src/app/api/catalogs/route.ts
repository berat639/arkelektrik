import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllCatalogs, createCatalog, updateCatalog, deleteCatalog } from "@/lib/db";

export async function GET() {
  const catalogs = await getAllCatalogs();
  return NextResponse.json(catalogs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, slug, pdf_url, cover_image_url, is_published } = body;

  if (!title || !slug || !pdf_url) {
    return NextResponse.json({ error: "title, slug ve pdf_url zorunludur" }, { status: 400 });
  }

  const catalog = await createCatalog({
    title,
    slug,
    pdf_url,
    cover_image_url: cover_image_url || null,
    is_published: is_published ?? true,
  });

  return NextResponse.json(catalog, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "id zorunludur" }, { status: 400 });

  const updated = await updateCatalog(id, data);
  if (!updated) return NextResponse.json({ error: "Katalog bulunamadı" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id zorunludur" }, { status: 400 });

  const deleted = await deleteCatalog(id);
  if (!deleted) return NextResponse.json({ error: "Katalog bulunamadı" }, { status: 404 });

  return NextResponse.json({ success: true });
}
