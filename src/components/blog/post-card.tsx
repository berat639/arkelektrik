import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowRight, Calendar } from "lucide-react";
import type { PostWithRelations } from "@/lib/types";

interface PostCardProps {
  post: PostWithRelations;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group flex flex-col h-full bg-white border border-gray-200 overflow-hidden transition-shadow duration-300 hover:shadow-lg"
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
      }}
    >
      {/* Image */}
      <Link href={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-fire-950 to-dark-800 flex items-center justify-center">
            <span className="text-white/20 font-heading text-4xl font-bold uppercase">ARK</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category + Date */}
        <div className="flex items-center gap-3 mb-3">
          {post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="text-xs font-semibold uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors"
            >
              {post.category.name}
            </Link>
          )}
          {post.category && post.published_at && (
            <span className="w-1 h-1 rounded-full bg-gray-300" />
          )}
          {post.published_at && (
            <time
              dateTime={post.published_at}
              className="flex items-center gap-1 text-xs text-gray-400"
            >
              <Calendar size={11} />
              {format(new Date(post.published_at), "d MMM yyyy", { locale: tr })}
            </time>
          )}
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="font-heading font-bold text-lg uppercase leading-snug text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 mb-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        {/* Read more */}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors"
        >
          Devamını Oku
          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </article>
  );
}
