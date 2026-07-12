import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getPostBySlug, getPostWithRelations } from "@/lib/db";
import { redis, KEYS } from "@/lib/upstash";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { ViewCounter } from "./view-counter";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") return { title: "Yazı Bulunamadı" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") notFound();

  const fullPost = await getPostWithRelations(post.id);
  if (!fullPost) notFound();

  const tagIds = await redis.smembers<string[]>(KEYS.postTags(post.id));
  const tags = fullPost.tags;

  return (
    <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
          {fullPost.category && (
            <Link href={`/category/${fullPost.category.slug}`}>
              <Badge variant="secondary">{fullPost.category.name}</Badge>
            </Link>
          )}
          {tags.map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`}>
              <Badge variant="outline">{tag.name}</Badge>
            </Link>
          ))}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
          {fullPost.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          {fullPost.published_at && (
            <time dateTime={fullPost.published_at}>
              {format(new Date(fullPost.published_at), "d MMMM yyyy", {
                locale: tr,
              })}
            </time>
          )}
          <ViewCounter slug={slug} />
        </div>
      </header>

      {/* Cover Image */}
      {fullPost.cover_image_url && (
        <div className="aspect-video overflow-hidden rounded-lg mb-6 sm:mb-8">
          <img
            src={fullPost.cover_image_url}
            alt={fullPost.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <MarkdownRenderer content={fullPost.content} />
    </article>
  );
}

export const revalidate = 3600;
