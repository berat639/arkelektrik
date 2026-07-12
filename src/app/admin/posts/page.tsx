import Link from "next/link";
import { getAllPosts, getAllCategories } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CategoryManager } from "@/components/admin/category-manager";
import { PostsAdminClient } from "@/components/admin/posts-admin-client";

export default async function AdminPostsPage() {
  const [posts, categories] = await Promise.all([getAllPosts(), getAllCategories()]);

  return (
    <PostsAdminClient>
      <div className="flex items-center justify-end mb-4 sm:mb-6">
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center justify-center h-8 px-3 sm:px-4 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          Yeni Yazı
        </Link>
      </div>

      {/* Desktop table */}
      <div className="max-sm:hidden border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Başlık</th>
              <th className="px-4 py-3 text-left font-medium">Durum</th>
              <th className="px-4 py-3 text-left font-medium">Tarih</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{post.title}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      post.status === "published" ? "default" : "secondary"
                    }
                  >
                    {post.status === "published" ? "Yayında" : "Taslak"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(post.created_at), "d MMM yyyy", {
                    locale: tr,
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Henüz yazı bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm leading-snug line-clamp-2">
                {post.title}
              </span>
              <Badge
                variant={
                  post.status === "published" ? "default" : "secondary"
                }
                className="shrink-0 text-xs"
              >
                {post.status === "published" ? "Yayında" : "Taslak"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), "d MMM yyyy", {
                  locale: tr,
                })}
              </span>
              <Link
                href={`/admin/posts/${post.id}/edit`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Düzenle
              </Link>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">
            Henüz yazı bulunmuyor.
          </p>
        )}
      </div>

      {/* Categories section */}
      <div className="mt-8">
        <CategoryManager initialCategories={categories} />
      </div>
    </PostsAdminClient>
  );
}
