"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadDropzone } from "@/lib/uploadthing";

const MdxEditor = dynamic(() => import("@/components/admin/mdx-editor"), {
  ssr: false,
  loading: () => <div className="h-64 border rounded-lg animate-pulse bg-muted" />,
});

const ICON_OPTIONS = ["Flame", "Zap", "Shield", "Gauge", "Wind", "Lock", "Wrench"];

interface ServiceFormProps {
  initialData: {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    cover_image_url: string | null;
    icon: string;
    shortDesc: string;
    is_published: boolean;
  };
}

export function ServiceForm({ initialData }: ServiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    content: initialData.content || "",
    excerpt: initialData.excerpt || "",
    cover_image_url: initialData.cover_image_url || "",
    icon: initialData.icon || "Shield",
    shortDesc: initialData.shortDesc || "",
    is_published: initialData.is_published ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialData.id,
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          cover_image_url: formData.cover_image_url || null,
          icon: formData.icon,
          shortDesc: formData.shortDesc,
          is_published: formData.is_published,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu.");
      }

      toast.success("Sayfa güncellendi");
      router.push("/admin/services");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Title & Icon */}
      <div className="grid sm:grid-cols-[1fr_180px] gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Hizmet başlığı..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="icon">İkon</Label>
          <select
            id="icon"
            value={formData.icon}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, icon: e.target.value }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {ICON_OPTIONS.map((ic) => (
              <option key={ic} value={ic}>{ic}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_published"
          checked={formData.is_published}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, is_published: e.target.checked }))
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="is_published">Yayında</Label>
      </div>

      {/* Short description (for cards & hero subtitle) */}
      <div className="space-y-2">
        <Label htmlFor="shortDesc">Kısa Açıklama (Kart & Hero)</Label>
        <Textarea
          id="shortDesc"
          value={formData.shortDesc}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, shortDesc: e.target.value }))
          }
          placeholder="Kart görünümü ve hero alt başlığında kullanılır..."
          rows={2}
        />
      </div>

      {/* Excerpt / SEO */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">SEO / Meta Açıklaması</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
          }
          placeholder="Arama motorları için meta açıklama..."
          rows={2}
        />
      </div>

      {/* Cover image */}
      <div className="space-y-2">
        <Label>Kapak Görseli</Label>
        {formData.cover_image_url ? (
          <div className="relative">
            <img
              src={formData.cover_image_url}
              alt="Kapak"
              className="w-full max-w-md rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() =>
                setFormData((prev) => ({ ...prev, cover_image_url: "" }))
              }
            >
              Kaldır
            </Button>
          </div>
        ) : (
          <UploadDropzone
            endpoint="coverImage"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                setFormData((prev) => ({
                  ...prev,
                  cover_image_url: res[0].ufsUrl,
                }));
                toast.success("Görsel yüklendi");
              }
            }}
            onUploadError={(error) => {
              toast.error(`Yükleme hatası: ${error.message}`);
            }}
          />
        )}
      </div>

      {/* Content — single WYSIWYG editor */}
      <div className="space-y-2">
        <Label>Sayfa İçeriği</Label>
        <p className="text-xs text-muted-foreground">
          Tüm sayfa içeriğini buradan düzenleyin — başlıklar, listeler, tablolar, görseller ekleyebilirsiniz.
        </p>
        <MdxEditor
          markdown={formData.content}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, content: val }))
          }
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Güncelle"}
      </Button>
    </form>
  );
}
