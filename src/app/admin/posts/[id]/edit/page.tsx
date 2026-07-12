import { notFound } from "next/navigation";
import { getPostById, getAllCategories, getAllTags } from "@/lib/db";
import { redis, KEYS } from "@/lib/upstash";
import { PostForm } from "@/components/admin/post-form";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  const [post, categories, tags] = await Promise.all([
    getPostById(id),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!post) notFound();

  const tagIds = await redis.smembers<string[]>(KEYS.postTags(id));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yazı Düzenle</h1>
      <PostForm
        categories={categories}
        tags={tags}
        initialData={{
          ...post,
          tag_ids: tagIds,
          cover_image_url: post.cover_image_url ?? undefined,
          category_id: post.category_id ?? undefined,
        }}
      />
    </div>
  );
}
