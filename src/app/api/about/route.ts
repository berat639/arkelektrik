import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAboutPage, updateAboutPage } from "@/lib/db";

export async function GET() {
  const about = await getAboutPage();
  return NextResponse.json({ about });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, cover_image_url } = body;

  const about = await updateAboutPage({ content, cover_image_url });
  return NextResponse.json({ about });
}
