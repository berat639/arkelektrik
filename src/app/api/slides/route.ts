import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSlide, updateSlide, deleteSlide, getAllSlides, reorderSlides } from "@/lib/db";

export async function GET() {
  const slides = await getAllSlides();
  return NextResponse.json({ slides });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { image, title, subtitle, href, cta } = body;

  if (!image) {
    return NextResponse.json(
      { error: "Resim zorunlu" },
      { status: 400 }
    );
  }

  // Max 3 slides
  const existing = await getAllSlides();
  if (existing.length >= 3) {
    return NextResponse.json(
      { error: "Maksimum 3 slayt ekleyebilirsiniz" },
      { status: 400 }
    );
  }

  const slide = await createSlide({
    image,
    title: title || "",
    subtitle: subtitle || "",
    href: href || "",
    cta: cta || "",
    badge: body.badge || "",
    headline: body.headline || [title || ""],
    highlightIndex: body.highlightIndex ?? 0,
    description: body.description || subtitle || "",
    ctaPrimaryLabel: body.ctaPrimaryLabel || cta || "",
    ctaPrimaryHref: body.ctaPrimaryHref || href || "",
    ctaSecondaryLabel: body.ctaSecondaryLabel || "",
    ctaSecondaryHref: body.ctaSecondaryHref || "",
    tags: body.tags || [],
  });

  return NextResponse.json({ slide }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Reorder operation
  if (body.orderedIds && Array.isArray(body.orderedIds)) {
    await reorderSlides(body.orderedIds);
    return NextResponse.json({ success: true });
  }

  // Update operation
  const { id, ...data } = body;
  if (!id) {
    return NextResponse.json({ error: "ID zorunlu" }, { status: 400 });
  }

  const slide = await updateSlide(id, data);
  if (!slide) {
    return NextResponse.json({ error: "Slayt bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ slide });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID zorunlu" }, { status: 400 });
  }

  const deleted = await deleteSlide(id);
  if (!deleted) {
    return NextResponse.json({ error: "Slayt bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
