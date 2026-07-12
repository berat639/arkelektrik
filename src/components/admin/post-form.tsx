"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropzone } from "@/lib/uploadthing";

const MdxEditor = lazy(() => import("@/components/admin/mdx-editor"));
import { postFormSchema, type PostFormData } from "@/lib/validators";
import type { Category, Tag } from "@/lib/types";

interface PostFormProps {
  categories: Category[];
  tags: Tag[];
  initialData?: Partial<PostFormData> & { id?: string; tag_ids?: string[] };
}

export function PostForm({ categories, tags, initialData }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    cover_image_url: initialData?.cover_image_url || "",
    category_id: initialData?.category_id || "",
    status: initialData?.status || "draft",
    tag_ids: initialData?.tag_ids || [],
  });

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = postFormSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const url = "/api/posts";
      const method = initialData?.id ? "PUT" : "POST";
      const payload = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        ...result.data,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu.");
      }

      toast.success(
        initialData?.id ? "Yazı güncellendi." : "Yazı oluşturuldu."
      );
      router.push("/admin/posts");
      router.refresh();
    } catch (error) {
      toast.error("Bir hata oluştu: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const title = e.target.value;
              setFormData({
                ...formData,
                title,
                slug: initialData?.id ? formData.slug : generateSlug(title),
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, slug: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Özet</Label>
        <Textarea
          id="excerpt"
          rows={2}
          value={formData.excerpt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData({ ...formData, excerpt: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>İçerik</Label>
        <div className="border rounded-md overflow-hidden [&_.mdxeditor]:bg-background">
          <Suspense
            fallback={
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Editör yükleniyor...
              </div>
            }
          >
            <MdxEditor
              markdown={formData.content}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, content: value }))
              }
            />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value: string | null) =>
              setFormData({ ...formData, category_id: value ?? "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Durum</Label>
          <Select
            value={formData.status}
            onValueChange={(value: string | null) =>
              setFormData({ ...formData, status: (value ?? "draft") as "draft" | "published" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="published">Yayınla</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kapak Görseli</Label>
          {formData.cover_image_url ? (
            <div className="relative group">
              <img
                src={formData.cover_image_url}
                alt="Kapak görseli"
                className="w-full h-40 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, cover_image_url: "" })
                }
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ) : (
            <UploadDropzone
              endpoint="coverImage"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setFormData({
                    ...formData,
                    cover_image_url: res[0].ufsUrl,
                  });
                  toast.success("Görsel yüklendi.");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error("Yükleme hatası: " + error.message);
              }}
            />
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Etiketler</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className={`px-3 py-1 rounded-full border text-sm cursor-pointer transition-colors ${
                formData.tag_ids?.includes(tag.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={formData.tag_ids?.includes(tag.id) || false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const current = formData.tag_ids || [];
                  setFormData({
                    ...formData,
                    tag_ids: e.target.checked
                      ? [...current, tag.id]
                      : current.filter((id) => id !== tag.id),
                  });
                }}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Kaydediliyor..."
            : initialData?.id
            ? "Güncelle"
            : "Oluştur"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/posts")}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
