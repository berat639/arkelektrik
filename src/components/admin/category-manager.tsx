"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function closeModal() {
    setModalOpen(false);
    setName("");
    setSlug("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;
    setLoading(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error("Kategori oluşturulamadı: " + data.error);
      } else {
        setCategories([...categories, data.category]);
        toast.success("Kategori oluşturuldu.");
        closeModal();
        router.refresh();
      }
    } catch {
      toast.error("Bir hata oluştu.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        toast.error("Silinemedi: " + data.error);
      } else {
        setCategories(categories.filter((c) => c.id !== id));
        toast.success("Kategori silindi.");
        router.refresh();
      }
    } catch {
      toast.error("Bir hata oluştu.");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Kategoriler</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center h-8 px-3 sm:px-4 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          Oluştur
        </button>
      </div>

      <div className="border rounded-lg divide-y">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="font-medium text-sm">{cat.name}</span>
              <span className="text-muted-foreground text-xs ml-2">/{cat.slug}</span>
            </div>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              Sil
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Henüz kategori bulunmuyor.
          </p>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl border shadow-lg w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Yeni Kategori</h3>
                <button
                  onClick={closeModal}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cat-name">Ad</Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setName(e.target.value);
                      setSlug(generateSlug(e.target.value));
                    }}
                    placeholder="Kategori adı"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input
                    id="cat-slug"
                    value={slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
                    placeholder="kategori-slug"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Oluşturuluyor..." : "Oluştur"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                    İptal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
