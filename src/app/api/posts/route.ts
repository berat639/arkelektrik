import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPost, updatePost, deletePost, setPostTags } from "@/lib/db";
import { postFormSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = postFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tag_ids, ...postData } = result.data;

    const post = await createPost({
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt,
      cover_image_url: postData.cover_image_url || null,
      category_id: postData.category_id || null,
      status: postData.status,
      author_id: session.user.id || "admin",
      published_at:
        postData.status === "published" ? new Date().toISOString() : null,
    });

    if (tag_ids && tag_ids.length > 0) {
      await setPostTags(post.id, tag_ids);
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, tag_ids, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli." }, { status: 400 });
    }

    const updated = await updatePost(id, {
      ...data,
      cover_image_url: data.cover_image_url || null,
      category_id: data.category_id || null,
      published_at:
        data.status === "published" ? new Date().toISOString() : null,
    });

    if (!updated) {
      return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });
    }

    if (tag_ids) {
      await setPostTags(id, tag_ids);
    }

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
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

  const deleted = await deletePost(id);
  if (!deleted) {
    return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
