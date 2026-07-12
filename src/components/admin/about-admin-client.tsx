"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AboutForm } from "@/components/admin/about-form";
import type { SiteSettings } from "@/lib/types";

const TABS = [
  { id: "icerik", label: "İçerik Yönetimi" },
  { id: "ayarlar", label: "Sayfa Ayarları" },
  { id: "json", label: "Gelişmiş JSON" },
  { id: "iletisim", label: "İletişim & Genel" },
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
          {/* 2. Sayfa Ayarları (Expertise) */}
          {activeTab === "ayarlar" && (
            <Card>
              <CardHeader>
                <CardTitle>Hakkımızda Sayfası Ayarları</CardTitle>
                <CardDescription>Hakkımızda sayfasındaki uzmanlık (expertise) bölümünü düzenleyin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hakkımızda Alt Başlık</Label>
                  <Input
                    value={settings.aboutPageSubtitle || ""}
                    onChange={(e) => setSettings({ ...settings, aboutPageSubtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uzmanlık (Expertise) Görsel URL</Label>
                  <Input
                    value={settings.expertiseImage || ""}
                    onChange={(e) => setSettings({ ...settings, expertiseImage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uzmanlık Maddeleri (her satır = 1 madde)</Label>
                  <Textarea
                    value={(settings.expertiseItems || []).join("\n")}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        expertiseItems: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Gelişmiş JSON */}
          {activeTab === "json" && (
            <Card>
              <CardHeader>
                <CardTitle>Gelişmiş Veriler (JSON)</CardTitle>
                <CardDescription>Partnerler, Timeline ve İlkeler gibi verileri JSON formatında düzenleyin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Kilometre Taşları (Milestones)</Label>
                  <Textarea
                    value={JSON.stringify(settings.milestones || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setSettings({ ...settings, milestones: val });
                      } catch {}
                    }}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>İlkeler (Values)</Label>
                  <Textarea
                    value={JSON.stringify(settings.values || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setSettings({ ...settings, values: val });
                      } catch {}
                    }}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sertifika/Birlik Partnerleri (certPartners)</Label>
                  <Textarea
                    value={JSON.stringify(settings.certPartners || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setSettings({ ...settings, certPartners: val });
                      } catch {}
                    }}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. İletişim & Genel */}
          {activeTab === "iletisim" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>İletişim Bilgileri</CardTitle>
                  <CardDescription>Site genelinde, iletişim sayfasında ve footer&apos;da gösterilecek iletişim verileri.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input
                        value={settings.phone || ""}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-posta</Label>
                      <Input
                        value={settings.email || ""}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Adres</Label>
                    <Input
                      value={settings.address || ""}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Footer Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Footer Açıklama</Label>
                    <Textarea
                      value={settings.footerDescription || ""}
                      onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Copyright Metni</Label>
                    <Input
                      value={settings.copyrightText || ""}
                      onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                    />
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
