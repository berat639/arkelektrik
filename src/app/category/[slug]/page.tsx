import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getPostsByCategory } from "@/lib/db";
import { PostCard } from "@/components/blog/post-card";
import { Pagination } from "@/components/blog/pagination";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori Bulunamadı" };
  return {
    title: `${category.name} Kategorisi`,
    description: `${category.name} kategorisindeki blog yazıları.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { data: posts, totalPages } = await getPostsByCategory(
    category.id,
    currentPage,
    9
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {category.name}
        </h1>
        <p className="text-muted-foreground">Bu kategorideki tüm yazılar</p>
      </section>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Bu kategoride henüz yazı bulunmuyor.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/category/${slug}`}
      />
    </div>
  );
}

export const revalidate = 60;
