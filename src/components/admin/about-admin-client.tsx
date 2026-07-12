"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AboutForm } from "@/components/admin/about-form";
import { Plus, Trash2, Award, Shield, Users, Zap, Globe, Target } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import type { SiteSettings } from "@/lib/types";

const TABS = [
  { id: "icerik", label: "İçerik Yönetimi" },
  { id: "ayarlar", label: "Hero & Teaser" },
  { id: "kilometre", label: "Kilometre Taşları" },
  { id: "degerler", label: "Değerlerimiz & İlkeler" },
];

interface AboutAdminClientProps {
  initialAbout: {
    content: string;
    cover_image_url: string | null;
  };
}

export function AboutAdminClient({ initialAbout }: AboutAdminClientProps) {
  const [activeTab, setActiveTab] = useState("icerik");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  async function handleSaveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Ayarlar başarıyla kaydedildi");
    } catch {
      toast.error("Kaydetme başarısız");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hakkımızda & Genel Ayarlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hakkımızda sayfası, iletişim bilgileri ve JSON verilerini buradan yönetebilirsiniz.
          </p>
        </div>
        {activeTab !== "icerik" && (
          <Button onClick={handleSaveSettings} disabled={saving || loading}>
            {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </Button>
        )}
      </div>

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

      {/* 1. İçerik Yönetimi (Mevcut AboutForm) */}
      {activeTab === "icerik" && (
        <AboutForm initialData={initialAbout} />
      )}

      {/* Eğer ayarlar henüz yüklenmediyse diğer sekmeler için skeleton veya loading */}
      {activeTab !== "icerik" && loading && (
        <p className="text-muted-foreground">Ayarlar Yükleniyor...</p>
      )}

      {activeTab !== "icerik" && !loading && !settings && (
        <p className="text-destructive">Ayarlar yüklenemedi.</p>
      )}

      {settings && (
        <>
          {/* 2. Hero & Teaser Ayarları */}
          {activeTab === "ayarlar" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Ayarları</CardTitle>
                  <CardDescription>Sayfanın en üstünde yer alan ana başlık arka planı ve alt başlığı.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hakkımızda Hero Alt Başlığı</Label>
                    <Input
                      value={settings.aboutPageSubtitle || ""}
                      onChange={(e) => setSettings({ ...settings, aboutPageSubtitle: e.target.value })}
                      placeholder="Örn: 15 yılı aşkın endüstriyel güvenlik tecrübesiyle..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hakkımızda Üst Görsel (Hero Arka Plan)</Label>
                    {settings.aboutHeroImage ? (
                      <div className="relative border rounded-lg p-2 bg-muted/50 flex justify-center max-w-lg">
                        <img src={settings.aboutHeroImage} alt="Hero Arka Plan" className="h-40 object-cover w-full rounded-md" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-4 right-4 h-8 w-8"
                          onClick={() => setSettings({ ...settings, aboutHeroImage: "" })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <UploadDropzone
                        endpoint="coverImage"
                        className="ut-button:text-xs ut-button:h-8 ut-allowed-content:hidden max-w-lg"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) {
                            setSettings({ ...settings, aboutHeroImage: res[0].ufsUrl });
                            toast.success("Hero görseli yüklendi");
                          }
                        }}
                        onUploadError={(error) => {
                          toast.error("Yükleme hatası: " + error.message);
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hikayemiz Tanıtım Metinleri</CardTitle>
                  <CardDescription>Hikayemiz başlığı ve giriş paragrafı.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hikaye Başlığı</Label>
                    <Input
                      value={settings.aboutStoryTitle || ""}
                      onChange={(e) => setSettings({ ...settings, aboutStoryTitle: e.target.value })}
                      placeholder="Örn: Deneyimden Doğan Uzmanlık"
                    />
                    <p className="text-xs text-muted-foreground">Birden fazla kelime girildiğinde son kelimeler otomatik olarak renkli vurgulanır.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Hikaye Giriş Paragrafı</Label>
                    <Textarea
                      value={settings.aboutStoryText || ""}
                      onChange={(e) => setSettings({ ...settings, aboutStoryText: e.target.value })}
                      placeholder="Hikayenizin giriş paragrafını yazın..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Neden Biz? / Yetkinlikler Ayarları</CardTitle>
                  <CardDescription>Uzmanlık alanları listesi ve sağdaki ana görsel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bölüm Üst Başlığı (Etiket)</Label>
                      <Input
                        value={settings.aboutExpertiseSubtitle || ""}
                        onChange={(e) => setSettings({ ...settings, aboutExpertiseSubtitle: e.target.value })}
                        placeholder="Örn: Yetkinliklerimiz"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bölüm Başlığı</Label>
                      <Input
                        value={settings.aboutExpertiseTitle || ""}
                        onChange={(e) => setSettings({ ...settings, aboutExpertiseTitle: e.target.value })}
                        placeholder="Örn: Neden Biz?"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bölüm Açıklama Yazısı</Label>
                    <Textarea
                      value={settings.aboutExpertiseDescription || ""}
                      onChange={(e) => setSettings({ ...settings, aboutExpertiseDescription: e.target.value })}
                      placeholder="Sadece ürün temini değil; risk analizi ile başlayan..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Yetkinlikler / Uzmanlık Görseli</Label>
                    {settings.expertiseImage ? (
                      <div className="relative border rounded-lg p-2 bg-muted/50 flex justify-center max-w-lg">
                        <img src={settings.expertiseImage} alt="Yetkinlikler Görseli" className="h-40 object-cover w-full rounded-md" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-4 right-4 h-8 w-8"
                          onClick={() => setSettings({ ...settings, expertiseImage: "" })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <UploadDropzone
                        endpoint="coverImage"
                        className="ut-button:text-xs ut-button:h-8 ut-allowed-content:hidden max-w-lg"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) {
                            setSettings({ ...settings, expertiseImage: res[0].ufsUrl });
                            toast.success("Yetkinlik görseli yüklendi");
                          }
                        }}
                        onUploadError={(error) => {
                          toast.error("Yükleme hatası: " + error.message);
                        }}
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Uzmanlık Maddeleri</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            expertiseItems: [...(settings.expertiseItems || []), ""],
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Madde Ekle
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(settings.expertiseItems || []).map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            value={item}
                            onChange={(e) => {
                              const updated = [...settings.expertiseItems];
                              updated[index] = e.target.value;
                              setSettings({ ...settings, expertiseItems: updated });
                            }}
                            placeholder="Örn: Risk analizinden devreye almaya tüm süreç..."
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => {
                              const updated = settings.expertiseItems.filter((_, i) => i !== index);
                              setSettings({ ...settings, expertiseItems: updated });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {(!settings.expertiseItems || settings.expertiseItems.length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded">Henüz madde eklenmemiş.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. Kilometre Taşları (Milestones) */}
          {activeTab === "kilometre" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Kilometre Taşları</CardTitle>
                  <CardDescription>Hakkımızda sayfasındaki kronolojik zaman tüneli verileri.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      milestones: [...(settings.milestones || []), { year: new Date().getFullYear().toString(), event: "" }],
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(settings.milestones || []).map((m, i) => (
                    <div key={i} className="flex flex-col gap-3 border p-3 rounded-lg bg-gray-50/50 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10 z-10 bg-white shadow-sm"
                        onClick={() => {
                          const updated = settings.milestones.filter((_, idx) => idx !== i);
                          setSettings({ ...settings, milestones: updated });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>

                      <div className="space-y-1 mt-4">
                        <Label className="text-xs">Yıl</Label>
                        <Input
                          className="h-8 text-xs font-semibold"
                          value={m.year}
                          onChange={(e) => {
                            const updated = [...settings.milestones];
                            updated[i] = { ...updated[i], year: e.target.value };
                            setSettings({ ...settings, milestones: updated });
                          }}
                          placeholder="Örn: 2021"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Olay / Açıklama</Label>
                        <Textarea
                          className="text-xs min-h-[60px]"
                          value={m.event}
                          onChange={(e) => {
                            const updated = [...settings.milestones];
                            updated[i] = { ...updated[i], event: e.target.value };
                            setSettings({ ...settings, milestones: updated });
                          }}
                          placeholder="Örn: Şirketin kurulması, ilk projeler..."
                        />
                      </div>
                    </div>
                  ))}
                  {(!settings.milestones || settings.milestones.length === 0) && (
                    <div className="col-span-full text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
                      Henüz kilometre taşı eklenmemiş. "Ekle" butonuna tıklayarak başlayın.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Değerlerimiz & İlkeler */}
          {activeTab === "degerler" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Değerlerimiz & İlkelerimiz</CardTitle>
                    <CardDescription>Sayfada ikonlu kartlar olarak yer alan temel ilkeler.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        values: [...(settings.values || []), { icon: "Award", title: "Yeni Değer", desc: "" }],
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Ekle
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(settings.values || []).map((v, i) => (
                      <div key={i} className="flex flex-col gap-3 border p-3 rounded-lg bg-gray-50/50 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10 z-10 bg-white shadow-sm"
                          onClick={() => {
                            const updated = settings.values.filter((_, idx) => idx !== i);
                            setSettings({ ...settings, values: updated });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">İkon</Label>
                            <select
                              className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              value={v.icon}
                              onChange={(e) => {
                                const updated = [...settings.values];
                                updated[i] = { ...updated[i], icon: e.target.value };
                                setSettings({ ...settings, values: updated });
                              }}
                            >
                              <option value="Shield">Kalkan (Shield)</option>
                              <option value="Award">Ödül (Award)</option>
                              <option value="Users">Kullanıcılar (Users)</option>
                              <option value="Zap">Şimşek (Zap)</option>
                              <option value="Globe">Küre (Globe)</option>
                              <option value="Target">Hedef (Target)</option>
                              <option value="CheckCircle">Onay (CheckCircle)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Başlık</Label>
                            <Input
                              className="h-8 text-xs font-semibold"
                              value={v.title}
                              onChange={(e) => {
                                const updated = [...settings.values];
                                updated[i] = { ...updated[i], title: e.target.value };
                                setSettings({ ...settings, values: updated });
                              }}
                              placeholder="Örn: Güvenlik"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Açıklama</Label>
                          <Textarea
                            className="text-xs min-h-[60px]"
                            value={v.desc}
                            onChange={(e) => {
                              const updated = [...settings.values];
                              updated[i] = { ...updated[i], desc: e.target.value };
                              setSettings({ ...settings, values: updated });
                            }}
                            placeholder="Değer açıklaması giriniz..."
                          />
                        </div>
                      </div>
                    ))}
                    {(!settings.values || settings.values.length === 0) && (
                      <div className="col-span-full text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
                        Henüz değer/ilke eklenmemiş. "Ekle" butonuna tıklayarak başlayın.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Sertifikasyon & Birlik Partnerleri</CardTitle>
                    <CardDescription>Yetkinlikler bölümünün altındaki kurum logoları/isimleri.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        certPartners: [...(settings.certPartners || []), { name: "Yeni Partner", desc: "" }],
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Ekle
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(settings.certPartners || []).map((cp, i) => (
                      <div key={i} className="flex flex-col gap-2 border p-3 rounded-lg bg-gray-50/50 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10 z-10 bg-white shadow-sm"
                          onClick={() => {
                            const updated = settings.certPartners.filter((_, idx) => idx !== i);
                            setSettings({ ...settings, certPartners: updated });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>

                        <div className="space-y-1 mt-4">
                          <Label className="text-xs">Partner Adı</Label>
                          <Input
                            className="h-8 text-xs font-semibold"
                            value={cp.name}
                            onChange={(e) => {
                              const updated = [...settings.certPartners];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setSettings({ ...settings, certPartners: updated });
                            }}
                            placeholder="Örn: VdS, NFPA..."
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Detay / Rolü</Label>
                          <Input
                            className="h-8 text-xs"
                            value={cp.desc}
                            onChange={(e) => {
                              const updated = [...settings.certPartners];
                              updated[i] = { ...updated[i], desc: e.target.value };
                              setSettings({ ...settings, certPartners: updated });
                            }}
                            placeholder="Örn: Üye, Sertifikalı Mühendis..."
                          />
                        </div>
                      </div>
                    ))}
                    {(!settings.certPartners || settings.certPartners.length === 0) && (
                      <div className="col-span-full text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
                        Henüz partner eklenmemiş. "Ekle" butonuna tıklayarak başlayın.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
