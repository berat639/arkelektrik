"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadDropzone } from "@/lib/uploadthing";
import type { Slide } from "@/lib/types";

interface SlideFormProps {
  slide?: Slide;
}

export function SlideForm({ slide }: SlideFormProps) {
  const router = useRouter();
  const isEditing = !!slide;

  const [image, setImage] = useState(slide?.image || "");
  const [title, setTitle] = useState(slide?.title || "");
  const [subtitle, setSubtitle] = useState(slide?.subtitle || "");
  const [href, setHref] = useState(slide?.href || "");
  const [cta, setCta] = useState(slide?.cta || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      toast.error("Resim zorunlu");
      return;
    }
    setLoading(true);

    try {
      if (isEditing) {
        const res = await fetch("/api/slides", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: slide.id, image, title, subtitle, href, cta }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Güncelleme başarısız");
        } else {
          toast.success("Slayt güncellendi");
          router.push("/admin/homepage");
          router.refresh();
        }
      } else {
        const res = await fetch("/api/slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image, title, subtitle, href, cta }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Oluşturma başarısız");
        } else {
          toast.success("Slayt oluşturuldu");
          router.push("/admin/homepage");
          router.refresh();
        }
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">
        {isEditing ? "Slayt Düzenle" : "Yeni Slayt"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image */}
        <div className="space-y-2">
          <Label>Görsel *</Label>
          {image ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              <Image
                src={image}
                alt="Preview"
                fill
                className="object-cover"
                sizes="600px"
              />
              <button
                type="button"
                onClick={() => setImage("")}
                className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <UploadDropzone
              endpoint="sliderImage"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setImage(res[0].ufsUrl);
                  toast.success("Görsel yüklendi");
                }
              }}
              onUploadError={(error) => {
                toast.error(error.message || "Yükleme başarısız");
              }}
            />
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="slide-title">Başlık</Label>
          <Input
            id="slide-title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Slayt başlığı"
          />
        </div>

        {/* Subtitle */}
        <div className="space-y-1">
          <Label htmlFor="slide-subtitle">Alt Başlık</Label>
          <Input
            id="slide-subtitle"
            value={subtitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubtitle(e.target.value)}
            placeholder="Kısa açıklama"
          />
        </div>

        {/* Link + CTA */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="slide-href">Link (URL)</Label>
            <Input
              id="slide-href"
              value={href}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHref(e.target.value)}
              placeholder="/blog"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slide-cta">Buton Metni</Label>
            <Input
              id="slide-cta"
              value={cta}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCta(e.target.value)}
              placeholder="Keşfet"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Oluştur"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/homepage")}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}
