"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SubProductFormProps {
  serviceId: string;
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    description: string;
    features: string[];
    is_published: boolean;
    cover_image_url: string | null;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SubProductForm({ serviceId, initialData }: SubProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    features: initialData?.features || [],
    is_published: initialData?.is_published ?? true,
    cover_image_url: initialData?.cover_image_url || "",
  });

  const [newFeature, setNewFeature] = useState("");

  function handleTitleChange(value: string) {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: isEditing ? prev.slug : slugify(value),
    }));
  }

  function addFeature() {
    if (!newFeature.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeature.trim()],
    }));
    setNewFeature("");
  }

  function removeFeature(index: number) {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `/api/services/${serviceId}/subproducts`;
      const payload = isEditing
        ? { subProductId: initialData!.id, ...formData, cover_image_url: formData.cover_image_url || null }
        : { ...formData, cover_image_url: formData.cover_image_url || null };

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu.");
      }

      toast.success(isEditing ? "Alt ürün güncellendi" : "Alt ürün oluşturuldu");
      router.push(`/admin/services/${serviceId}/edit`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Cover Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kapak Görseli URL</label>
        <input
          type="text"
          value={formData.cover_image_url}
          onChange={(e) => setFormData((prev) => ({ ...prev, cover_image_url: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="https://..."
        />
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Özellikler / Ürün Listesi</label>
        <div className="space-y-2 mb-3">
          {formData.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
                {feature}
              </span>
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="text-red-500 hover:text-red-700 text-sm px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Yeni özellik ekle..."
          />
          <button
            type="button"
            onClick={addFeature}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Published Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_published"
          checked={formData.is_published}
          onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
          Yayında
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
        >
          {loading ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Oluştur"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/services/${serviceId}/edit`)}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
