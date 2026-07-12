import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markMessageRead, deleteMessage } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "ID gerekli." }, { status: 400 });
  }

  await markMessageRead(id);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID gerekli." }, { status: 400 });
  }

  await deleteMessage(id);
  return NextResponse.json({ success: true });
}
