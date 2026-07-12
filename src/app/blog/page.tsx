import { Metadata } from "next";
import { getPublishedPosts, getSiteSettings } from "@/lib/db";
import { PostCard } from "@/components/blog/post-card";
import { Pagination } from "@/components/blog/pagination";
import { PageHero } from "@/components/ui/page-hero";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Blog",
    description: settings.blogPageSubtitle || "En son blog yazıları ve teknoloji içerikleri.",
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const [{ data: posts, totalPages }, settings] = await Promise.all([
    getPublishedPosts(currentPage, 9),
    getSiteSettings()
  ]);

  return (
    <>
      <PageHero
        title="Blog"
        accent="Makaleler"
        subtitle={settings.blogPageSubtitle || "En son yazılar ve teknoloji içerikleri"}
        breadcrumbs={[{ label: "Blog" }]}
        image={settings.blogPageImage || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1920"}
      />
      <div className="bg-slate-50 py-20 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              Henüz yayınlanmış yazı bulunmuyor.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div className="mt-16">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/blog"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export const revalidate = 60;
