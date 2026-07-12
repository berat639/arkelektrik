import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { PostWithRelations } from "@/lib/types";

interface PostCardProps {
  post: PostWithRelations;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow group">
      {post.cover_image_url && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
        {post.category && (
          <Link href={`/category/${post.category.slug}`}>
            <Badge variant="secondary" className="w-fit text-xs">
              {post.category.name}
            </Badge>
          </Link>
        )}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-lg sm:text-xl font-semibold leading-tight hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 px-4 sm:px-6">
        <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3">
          {post.excerpt}
        </p>
      </CardContent>
      <CardFooter className="pt-0 px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {format(new Date(post.published_at), "d MMM yyyy", {
                locale: tr,
              })}
            </time>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
