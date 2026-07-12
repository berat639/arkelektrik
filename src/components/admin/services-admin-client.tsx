"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadDropzone } from "@/lib/uploadthing";
import type { SiteSettings } from "@/lib/types";

const TABS = [
  { id: "hizmetler", label: "Faaliyet Alanları" },
  { id: "ayarlar", label: "Sayfa ve Ana Sayfa Ayarları" },
];

export function ServicesAdminClient({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("hizmetler");
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
      toast.success("Hizmet ayarları başarıyla kaydedildi");
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
          <h1 className="text-xl sm:text-2xl font-bold">Faaliyet Alanları Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faaliyet alanlarını ve site genelindeki gösterim ayarlarını yönetin.
          </p>
        </div>
        {activeTab === "ayarlar" && (
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

      {activeTab === "hizmetler" && children}

      {activeTab === "ayarlar" && loading && (
        <p className="text-muted-foreground">Ayarlar Yükleniyor...</p>
      )}

      {activeTab === "ayarlar" && !loading && settings && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Faaliyet Alanları Sayfası</CardTitle>
              <CardDescription>Faaliyet alanları ana sayfasının en üstünde yer alan kapak görseli.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sayfa Kapak Görseli (Hero Image)</Label>
                {settings.servicesPageImage ? (
                  <div className="relative border rounded-lg p-2 bg-muted/50 max-w-md">
                    <img src={settings.servicesPageImage} alt="services hero" className="w-full h-auto rounded" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSettings({ ...settings, servicesPageImage: "" })}
                    >
                      Kaldır
                    </Button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="coverImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setSettings({ ...settings, servicesPageImage: res[0].url });
                        toast.success("Kapak görseli yüklendi");
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
              <CardTitle>Ana Sayfa Faaliyet Alanları Özeti</CardTitle>
              <CardDescription>Ana sayfada sergilenen Faaliyet Alanlarımız bölümünün genel ayarları.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alt Başlık (Örn: Çözümlerimiz)</Label>
                  <Input
                    value={settings.servicesSectionTitle || ""}
                    onChange={(e) => setSettings({ ...settings, servicesSectionTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ana Başlık (Örn: Faaliyet Alanlarımız)</Label>
                  <Input
                    value={settings.servicesSectionSubtitle || ""}
                    onChange={(e) => setSettings({ ...settings, servicesSectionSubtitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Açıklama Metni</Label>
                <Textarea
                  value={settings.servicesSectionText || ""}
                  onChange={(e) => setSettings({ ...settings, servicesSectionText: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
