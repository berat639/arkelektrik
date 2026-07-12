"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadDropzone } from "@/lib/uploadthing";

const MdxEditor = lazy(() => import("@/components/admin/mdx-editor"));

interface AboutFormProps {
  initialData: {
    content: string;
    cover_image_url: string | null;
  };
}

export function AboutForm({ initialData }: AboutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: initialData.content || "",
    cover_image_url: initialData.cover_image_url || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu.");
      }

      toast.success("Sayfa güncellendi");
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

      <div className="space-y-2">
        <Label>İçerik</Label>
        <Suspense
          fallback={
            <div className="h-64 border rounded-lg animate-pulse bg-muted" />
          }
        >
          <MdxEditor
            markdown={formData.content}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, content: val }))
            }
          />
        </Suspense>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Güncelle"}
      </Button>
    </form>
  );
}
