"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SubProduct } from "@/lib/types";

interface SubProductsListProps {
  serviceId: string;
  subProducts: SubProduct[];
}

export function SubProductsList({ serviceId, subProducts }: SubProductsListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(subProductId: string) {
    if (!confirm("Bu alt ürünü silmek istediğinize emin misiniz?")) return;

    setDeleting(subProductId);
    try {
      const response = await fetch(
        `/api/services/${serviceId}/subproducts?subProductId=${subProductId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Silinemedi");
      }
      toast.success("Alt ürün silindi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setDeleting(null);
    }
  }

  if (subProducts.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        Henüz alt ürün eklenmemiş.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-600">Başlık</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Özellik Sayısı</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Durum</th>
            <th className="text-right py-2 px-3 font-medium text-gray-600">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {subProducts.map((sp) => (
            <tr key={sp.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 font-medium text-gray-900">{sp.title}</td>
              <td className="py-2 px-3 text-gray-500">{sp.features.length}</td>
              <td className="py-2 px-3">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                    sp.is_published
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {sp.is_published ? "Yayında" : "Taslak"}
                </span>
              </td>
              <td className="py-2 px-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/services/${serviceId}/subproducts/${sp.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => handleDelete(sp.id)}
                    disabled={deleting === sp.id}
                    className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                  >
                    {deleting === sp.id ? "..." : "Sil"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
