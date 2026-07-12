import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug, getPostsByTag } from "@/lib/db";
import { PostCard } from "@/components/blog/post-card";
import { Pagination } from "@/components/blog/pagination";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Etiket Bulunamadı" };
  return {
    title: `#${tag.name} Etiketi`,
    description: `${tag.name} etiketli blog yazıları.`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { data: posts, totalPages } = await getPostsByTag(
    tag.id,
    currentPage,
    9
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">#{tag.name}</h1>
        <p className="text-muted-foreground">Bu etiketle ilişkili yazılar</p>
      </section>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Bu etiketle ilişkili yazı bulunmuyor.
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
        basePath={`/tag/${slug}`}
      />
    </div>
  );
}

export const revalidate = 60;
