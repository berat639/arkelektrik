import { getAllCategories, getAllTags } from "@/lib/db";
import { PostForm } from "@/components/admin/post-form";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    getAllCategories(),
    getAllTags(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yeni Yazı</h1>
      <PostForm categories={categories} tags={tags} />
    </div>
  );
}
