"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, FileText, ExternalLink } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import type { Catalog } from "@/lib/types";

interface CatalogsAdminClientProps {
  initialCatalogs: Catalog[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CatalogsAdminClient({ initialCatalogs }: CatalogsAdminClientProps) {
  const [catalogs, setCatalogs] = useState<Catalog[]>(initialCatalogs);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setTitle("");
    setCoverImage("");
    setPdfUrl("");
    setIsPublished(true);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(catalog: Catalog) {
    setTitle(catalog.title);
    setCoverImage(catalog.cover_image_url || "");
    setPdfUrl(catalog.pdf_url);
    setIsPublished(catalog.is_published);
    setEditingId(catalog.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Başlık zorunludur"); return; }
    if (!pdfUrl) { toast.error("PDF dosyası yükleyin"); return; }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/catalogs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, title, cover_image_url: coverImage || null, pdf_url: pdfUrl, is_published: isPublished }),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız");
        const updated = await res.json();
        setCatalogs((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        toast.success("Katalog güncellendi");
      } else {
        const res = await fetch("/api/catalogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug: slugify(title), cover_image_url: coverImage || null, pdf_url: pdfUrl, is_published: isPublished }),
        });
        if (!res.ok) throw new Error("Oluşturma başarısız");
        const created = await res.json();
        setCatalogs((prev) => [...prev, created]);
        toast.success("Katalog eklendi");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu katalogu silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/catalogs?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCatalogs((prev) => prev.filter((c) => c.id !== id));
      toast.success("Katalog silindi");
    } else {
      toast.error("Silme başarısız");
    }
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-ark-red text-white px-4 py-2 rounded hover:bg-ark-red/90 transition-colors"
        >
          <Plus size={16} /> Yeni Katalog Ekle
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <h3 className="font-semibold text-lg">
            {editingId ? "Katalogu Düzenle" : "Yeni Katalog"}
          </h3>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Katalog başlığı"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ark-red/30"
            />
          </div>

          {/* Cover Image / Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kapak Görseli / Logo</label>
            {coverImage ? (
              <div className="flex items-center gap-3">
                <img src={coverImage} alt="Kapak" className="h-16 w-auto object-contain border rounded p-1" />
                <button onClick={() => setCoverImage("")} className="text-red-500 text-sm hover:underline">Kaldır</button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="catalogImage"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) { setCoverImage(res[0].ufsUrl); toast.success("Görsel yüklendi"); }
                }}
                onUploadError={(err) => { toast.error(`Yükleme hatası: ${err.message}`); }}
              />
            )}
          </div>

          {/* PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF Dosyası</label>
            {pdfUrl ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border rounded px-3 py-2">
                  <FileText size={16} className="text-ark-red" />
                  <span>PDF yüklendi</span>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-ark-red hover:underline ml-2">
                    <ExternalLink size={14} />
                  </a>
                </div>
                <button onClick={() => setPdfUrl("")} className="text-red-500 text-sm hover:underline">Değiştir</button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="catalogPdf"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) { setPdfUrl(res[0].ufsUrl); toast.success("PDF yüklendi"); }
                }}
                onUploadError={(err) => { toast.error(`Yükleme hatası: ${err.message}`); }}
              />
            )}
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="published" className="text-sm text-gray-700">Yayında</label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-ark-red text-white px-5 py-2 rounded hover:bg-ark-red/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
            </button>
            <button
              onClick={resetForm}
              className="border border-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Catalogs Table */}
      {catalogs.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Görsel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Başlık</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">PDF</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Durum</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {catalogs.map((catalog) => (
                <tr key={catalog.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {catalog.cover_image_url ? (
                      <img src={catalog.cover_image_url} alt={catalog.title} className="h-10 w-14 object-contain" />
                    ) : (
                      <div className="h-10 w-14 bg-gray-100 rounded flex items-center justify-center">
                        <FileText size={16} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{catalog.title}</td>
                  <td className="px-4 py-3">
                    <a href={catalog.pdf_url} target="_blank" rel="noopener noreferrer" className="text-ark-red hover:underline inline-flex items-center gap-1">
                      <FileText size={14} /> Görüntüle
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${catalog.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {catalog.is_published ? "Yayında" : "Taslak"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(catalog)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(catalog.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          Henüz katalog eklenmemiş. &quot;Yeni Katalog Ekle&quot; butonuna tıklayarak başlayın.
        </div>
      )}
    </div>
  );
}
