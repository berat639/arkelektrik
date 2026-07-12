"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadDropzone } from "@/lib/uploadthing";
import type { SiteSettings } from "@/lib/types";

const TABS = [
  { id: "yazilar", label: "Yazılar" },
  { id: "ayarlar", label: "Blog Ayarları" },
];

export function PostsAdminClient({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("yazilar");
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
      toast.success("Blog ayarları başarıyla kaydedildi");
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
          <h1 className="text-xl sm:text-2xl font-bold">Yazılar & Blog Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Blog yazılarını ve blog sayfası genel ayarlarını yönetin.
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

      {activeTab === "yazilar" && children}

      {activeTab === "ayarlar" && loading && (
        <p className="text-muted-foreground">Ayarlar Yükleniyor...</p>
      )}

      {activeTab === "ayarlar" && !loading && settings && (
        <Card>
          <CardHeader>
            <CardTitle>Blog Sayfası Ayarları</CardTitle>
            <CardDescription>Blog ana sayfasındaki başlık ve görseli düzenleyin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Sayfa Alt Başlık (Subtitle)</Label>
              <Input
                value={settings.blogPageSubtitle || ""}
                onChange={(e) => setSettings({ ...settings, blogPageSubtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sayfa Kapak Görseli (Hero Image)</Label>
              {settings.blogPageImage ? (
                <div className="relative border rounded-lg p-2 bg-muted/50 max-w-md">
                  <img src={settings.blogPageImage} alt="blog hero" className="w-full h-auto rounded" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setSettings({ ...settings, blogPageImage: "" })}
                  >
                    Kaldır
                  </Button>
                </div>
              ) : (
                <UploadDropzone
                  endpoint="coverImage"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) {
                      setSettings({ ...settings, blogPageImage: res[0].url });
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
      )}
    </div>
  );
}
