"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { SiteSettings, Slide } from "@/lib/types";
import { UploadDropzone } from "@/lib/uploadthing";
import { SlideManager } from "@/components/admin/slide-manager";

const MdxEditor = lazy(() => import("@/components/admin/mdx-editor"));

const TABS = [
  { id: "slider", label: "Slider Yönetimi" },
  { id: "hakkimizda", label: "Hakkımızda Yönetimi" },
  { id: "nedenbiz", label: "Neden Biz Yönetimi" },
  { id: "standartlar", label: "Markalar Yönetimi" },
  { id: "seo", label: "SEO Yönetimi" },
];

interface HomepageSectionsFormProps {
  initialSlides: Slide[];
}

export function HomepageSectionsForm({ initialSlides }: HomepageSectionsFormProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("slider");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Ayarlar yüklenemedi");
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Ana sayfa ayarları kaydedildi");
    } catch {
      toast.error("Kaydetme başarısız");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Yükleniyor...</p>;
  if (!settings) return <p className="text-destructive">Ayarlar yüklenemedi.</p>;

  return (
    <div className="space-y-6 mt-12 border-t pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ana Sayfa Ayarları</h2>
        {activeTab !== "slider" && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Tüm Değişiklikleri Kaydet"}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? "bg-teal-500/10 text-teal-500 border-b-2 border-teal-500"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      {activeTab === "slider" && (
        <SlideManager initialSlides={initialSlides} />
      )}

      {/* Hakkımızda Özeti */}
      {activeTab === "hakkimizda" && (
        <Card>
          <CardHeader>
            <CardTitle>Hakkımızda Özeti (Mühendislik Partneri)</CardTitle>
            <CardDescription>Ana sayfada "Slider"ın hemen altında yer alan giriş yazısı bölümü.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bölüm Üst Başlığı (Örn: Hakkımızda)</Label>
                <Input
                  value={settings.aboutTeaserTitle || ""}
                  onChange={(e) => setSettings({ ...settings, aboutTeaserTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bölüm Ana Başlığı (Örn: Mühendislik Partneri)</Label>
                <Input
                  value={settings.aboutTeaserSubtitle || ""}
                  onChange={(e) => setSettings({ ...settings, aboutTeaserSubtitle: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Açıklama Metni (Önizlemedeki Paragraf)</Label>
              <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded-md" />}>
                <div className="border rounded-md overflow-hidden [&_.mdxeditor]:bg-background">
                  <MdxEditor
                    markdown={settings.aboutTeaserText || ""}
                    onChange={(val) => setSettings({ ...settings, aboutTeaserText: val })}
                  />
                </div>
              </Suspense>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sağ Taraftaki Ana Resim</Label>
                {settings.aboutTeaserImage ? (
                  <div className="relative border rounded-lg p-2 bg-muted/50">
                    <img src={settings.aboutTeaserImage} alt="about-teaser" className="h-32 object-contain rounded mx-auto" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSettings({ ...settings, aboutTeaserImage: "" })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="contentImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setSettings({ ...settings, aboutTeaserImage: res[0].url });
                        toast.success("Resim yüklendi");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error("Resim yüklenemedi: " + error.message);
                    }}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Resim Üzerindeki Yazı (Alıntı Kutu Yazısı)</Label>
                <textarea
                  className="w-full flex min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={settings.aboutTeaserQuote || ""}
                  onChange={(e) => setSettings({ ...settings, aboutTeaserQuote: e.target.value })}
                  placeholder="Örn: 15+ Yıllık Tecrübe..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Neden Biz */}
      {activeTab === "nedenbiz" && (
        <Card>
          <CardHeader>
            <CardTitle>Neden Biz Yönetimi (Farkımız Mühendislikte)</CardTitle>
            <CardDescription>Sol taraftaki resim, üstündeki alıntı yazısı ve sağ taraftaki açıklama/maddeler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Ana Başlık (Örn: Farkımız Mühendislikte)</Label>
              <Input
                value={settings.whyArkSubtitle || ""}
                onChange={(e) => setSettings({ ...settings, whyArkSubtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama Metni (MDX)</Label>
              <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded-md" />}>
                <div className="border rounded-md overflow-hidden [&_.mdxeditor]:bg-background">
                  <MdxEditor
                    markdown={settings.whyArkDescription || ""}
                    onChange={(val) => setSettings({ ...settings, whyArkDescription: val })}
                  />
                </div>
              </Suspense>
            </div>
            <div className="space-y-2">
              <Label>Sağ Taraftaki Avantaj Listesi (Maddeler halinde yazın, MDX formatı)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Buraya girdiğiniz liste (- madde) önizlemede yeşil tik tasarımlı liste olarak görünür.
              </p>
              <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded-md" />}>
                <div className="border rounded-md overflow-hidden [&_.mdxeditor]:bg-background">
                  <MdxEditor
                    markdown={settings.whyArkReasonsMDX || ""}
                    onChange={(val) => setSettings({ ...settings, whyArkReasonsMDX: val })}
                  />
                </div>
              </Suspense>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sol Taraftaki Ana Resim</Label>
                {settings.whyArkImage ? (
                  <div className="relative border rounded-lg p-2 bg-muted/50">
                    <img src={settings.whyArkImage} alt="why-ark" className="h-32 object-contain rounded mx-auto" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSettings({ ...settings, whyArkImage: "" })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="contentImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setSettings({ ...settings, whyArkImage: res[0].url });
                        toast.success("Resim yüklendi");
                      }
                    }}
                    onUploadError={(error) => {
                      toast.error("Yükleme hatası: " + error.message);
                    }}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Resim Üzerindeki Yazı (Alıntı Kutu Yazısı)</Label>
                <Input
                  value={settings.whyArkQuote || ""}
                  onChange={(e) => setSettings({ ...settings, whyArkQuote: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Markalar Karoseli */}
      {activeTab === "standartlar" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Çözüm Ortakları & Markalar Karoseli</CardTitle>
                <CardDescription>Ana sayfadaki hareketli marka bandı.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSettings({
                    ...settings,
                    carouselBrands: [...(settings.carouselBrands || []), { image: "", title: "Yeni Marka" }],
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Marka Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 mb-6">
              <Label>Karosel Üst Başlığı (Örn: Çözüm Ortakları & Markalar)</Label>
              <Input
                value={settings.standardsSectionTitle || ""}
                onChange={(e) => setSettings({ ...settings, standardsSectionTitle: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(settings.carouselBrands || []).map((brand, i) => (
                <div key={i} className="flex flex-col gap-3 border p-3 rounded-lg bg-gray-50/50 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10 z-10 bg-white shadow-sm"
                    onClick={() => {
                      const updated = settings.carouselBrands.filter((_, idx) => idx !== i);
                      setSettings({ ...settings, carouselBrands: updated });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>

                  <div className="space-y-1 mt-4">
                    <Label className="text-xs">Başlık</Label>
                    <Input
                      className="h-8 text-xs"
                      value={brand.title}
                      onChange={(e) => {
                        const updated = [...settings.carouselBrands];
                        updated[i] = { ...updated[i], title: e.target.value };
                        setSettings({ ...settings, carouselBrands: updated });
                      }}
                      placeholder="Örn: NFPA"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Logo</Label>
                    {brand.image ? (
                      <div className="relative border rounded-md p-2 bg-white flex justify-center h-24 items-center group overflow-hidden">
                        <img src={brand.image} alt={brand.title} className="max-h-16 max-w-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const updated = [...settings.carouselBrands];
                              updated[i] = { ...updated[i], image: "" };
                              setSettings({ ...settings, carouselBrands: updated });
                            }}
                          >
                            Değiştir
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-md flex items-center justify-center bg-white p-2">
                        <UploadDropzone
                          endpoint="contentImage"
                          className="ut-button:text-xs ut-button:h-8 ut-allowed-content:hidden m-0 w-full"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                              const updated = [...settings.carouselBrands];
                              updated[i] = { ...updated[i], image: res[0].url };
                              setSettings({ ...settings, carouselBrands: updated });
                              toast.success("Logo yüklendi");
                            }
                          }}
                          onUploadError={(error) => {
                            toast.error("Yükleme hatası: " + error.message);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!settings.carouselBrands || settings.carouselBrands.length === 0) && (
                <div className="col-span-full text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
                  Henüz marka eklenmemiş. "Marka Ekle" butonuna tıklayarak başlayın.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO */}
      {activeTab === "seo" && (
        <Card>
          <CardHeader>
            <CardTitle>SEO Yönetimi</CardTitle>
            <CardDescription>Arama motorları için sitenizin başlık (Title), açıklama (Description) ve anahtar kelimelerini (Keywords) yönetin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Başlığı (Title)</Label>
              <Input
                value={settings.seoTitle || ""}
                onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                placeholder="Örn: ARK Global — Endüstriyel Güvenlik Mühendisliği"
              />
              <p className="text-xs text-muted-foreground">Tarayıcı sekmesinde ve Google arama sonuçlarında en üstte görünen ana başlıktır.</p>
            </div>
            <div className="space-y-2">
              <Label>Site Açıklaması (Description)</Label>
              <textarea
                className="w-full flex min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={settings.seoDescription || ""}
                onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                placeholder="Örn: Endüstriyel tesisler için uçtan uca kazalardan korunma sistemleri..."
              />
              <p className="text-xs text-muted-foreground">Google arama sonuçlarında başlığın hemen altında yer alan özet açıklamadır.</p>
            </div>
            <div className="space-y-2">
              <Label>Anahtar Kelimeler (Keywords)</Label>
              <Input
                value={settings.seoKeywords || ""}
                onChange={(e) => setSettings({ ...settings, seoKeywords: e.target.value })}
                placeholder="Örn: Yangın Algılama, ATEX, Ex-Proof..."
              />
              <p className="text-xs text-muted-foreground">Aralarına virgül koyarak anahtar kelimeleri ekleyin.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab !== "slider" && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? "Kaydediliyor..." : "Tüm Değişiklikleri Kaydet"}
          </Button>
        </div>
      )}
    </div>
  );
}
