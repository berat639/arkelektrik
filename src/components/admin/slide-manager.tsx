"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import type { Slide } from "@/lib/types";

interface SlideManagerProps {
  initialSlides: Slide[];
}

export function SlideManager({ initialSlides }: SlideManagerProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>(initialSlides);

  async function handleDelete(id: string) {
    if (!confirm("Bu slaytı silmek istediğinizden emin misiniz?")) return;

    try {
      const res = await fetch(`/api/slides?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Silinemedi");
      } else {
        setSlides(slides.filter((s) => s.id !== id));
        toast.success("Slayt silindi");
        router.refresh();
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  }

  async function moveSlide(id: string, direction: "up" | "down") {
    const index = slides.findIndex((s) => s.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;

    const newSlides = [...slides];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newSlides[index], newSlides[swapIndex]] = [newSlides[swapIndex], newSlides[index]];
    setSlides(newSlides);

    try {
      await fetch("/api/slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newSlides.map((s) => s.id) }),
      });
      toast.success("Sıralama güncellendi");
      router.refresh();
    } catch {
      toast.error("Sıralama güncellenemedi");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-red-500 font-bold">! Maksimum 3 slayt ekleyebilirsiniz.</span>
        <Link
          href="/admin/homepage/new"
          className="inline-flex items-center justify-center h-8 px-3 sm:px-4 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          Yeni Slayt
        </Link>
      </div>

      {slides.length === 0 ? (
        <div className="border rounded-lg px-4 py-12 text-center text-sm text-muted-foreground">
          Henüz slayt bulunmuyor. &quot;Yeni Slayt&quot; ile ekleyin.
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className="flex items-center gap-3 px-3 sm:px-4 py-3"
            >
              {/* Order number */}
              <span className="text-xs font-medium text-muted-foreground w-5 text-center shrink-0">
                {idx + 1}
              </span>

              {/* Thumbnail */}
              <div className="relative h-12 w-20 sm:h-14 sm:w-24 shrink-0 rounded-md overflow-hidden bg-muted">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{slide.title}</p>
                {slide.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    {slide.subtitle}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveSlide(slide.id, "up")}
                  disabled={idx === 0}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label="Yukarı taşı"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveSlide(slide.id, "down")}
                  disabled={idx === slides.length - 1}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label="Aşağı taşı"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <Link
                  href={`/admin/homepage/${slide.id}/edit`}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Düzenle"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-destructive"
                  aria-label="Sil"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
