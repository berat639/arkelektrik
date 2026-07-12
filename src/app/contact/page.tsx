"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone, Mail, MapPin, Send, CheckCircle, AlertCircle, ArrowRight,
} from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { TechBackground } from "@/components/ui/tech-background";

const topics = [
  "Yangın Algılama & Söndürme",
  "Kıvılcım Algılama & Söndürme",
  "Patlamadan Korunma",
  "Aşırı Basınçtan Korunma",
  "Gaz Algılama",
  "Ex Proof Çözümler",
  "Servis ve Bakım",
  "Genel Bilgi",
];

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  contactPageImage: string;
}

export default function ContactPage() {
  const [info, setInfo] = useState<ContactInfo>({
    phone: "+90 (212) 123 45 67",
    email: "info@arkglobal.com.tr",
    address: "Istanbul, Türkiye",
    contactPageImage: "https://images.pexels.com/photos/2760241/pexels-photo-2760241.jpeg?auto=compress&cs=tinysrgb&w=1920",
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    topic: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Fetch contact info from site settings
  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.phone) {
          setInfo({ 
            phone: data.phone, 
            email: data.email, 
            address: data.address,
            contactPageImage: data.contactPageImage || info.contactPageImage
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", company: "", phone: "", topic: "", message: "" });
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const inputClass =
    "w-full bg-dark-700 border border-dark-500 focus:border-teal-500 text-white placeholder-white/35 px-4 py-3 text-sm outline-none transition-colors duration-200";

  return (
    <>
      <PageHero
        title="İletişim"
        subtitle="Endüstriyel tesisiniz için doğru güvenlik çözümünü birlikte belirleyelim."
        breadcrumbs={[{ label: "İletişim" }]}
        image={info.contactPageImage}
      />

      <section className="bg-dark-900 py-24 relative overflow-hidden">
        <TechBackground variant="dark" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left — Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
                  Bilgi
                </span>
                <h2 className="font-heading font-bold text-3xl uppercase text-white mb-4">
                  Bize <span className="text-teal-500">Ulaşın</span>
                </h2>
                <div className="w-16 h-1 bg-teal-500 mb-6" />
                <p className="text-white/70 leading-relaxed text-sm">
                  Uzman ekibimiz tesisinizi analiz ederek en uygun güvenlik sistemini önerecektir.
                  Aşağıdaki formu doldurun veya doğrudan iletişime geçin.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-teal-500" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Telefon</p>
                    <a
                      href={`tel:${info.phone.replace(/[^+\d]/g, "")}`}
                      className="text-white hover:text-teal-500 transition-colors text-sm font-medium"
                    >
                      {info.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-teal-500" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">E-posta</p>
                    <a
                      href={`mailto:${info.email}`}
                      className="text-white hover:text-teal-500 transition-colors text-sm font-medium"
                    >
                      {info.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-teal-500" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Adres</p>
                    <p className="text-white text-sm">{info.address}</p>
                  </div>
                </div>
              </div>

              {/* Emergency CTA */}
              <div
                className="bg-teal-500 p-6"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                }}
              >
                <h4 className="font-heading font-bold text-xl uppercase text-white mb-2">
                  Acil Destek
                </h4>
                <p className="text-white/85 text-sm leading-relaxed mb-3">
                  Mevcut sisteminizde acil arıza veya bakım ihtiyacı mı var? 7/24 teknik destek
                  hattımız hizmetinizde.
                </p>
                <a
                  href={`tel:${info.phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white text-teal-500 font-semibold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors"
                >
                  Hemen Ara <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Right — Form */}
            <div className="lg:col-span-3">
              <div
                className="bg-dark-800 border border-dark-500 p-8"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
                }}
              >
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle size={56} className="text-green-400 mb-4" />
                    <h3 className="font-heading font-bold text-2xl text-white uppercase mb-2">
                      Mesajınız Alındı
                    </h3>
                    <p className="text-white/60 text-sm mb-6">
                      En kısa sürede uzmanımız sizinle iletişime geçecektir.
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="btn-outline text-xs py-3 px-6 cursor-pointer"
                    >
                      Yeni Mesaj Gönder
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-heading font-bold text-xl uppercase text-white mb-6">
                      Teklif Formu
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                          Ad Soyad *
                        </label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Ahmet Yılmaz"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                          E-posta *
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="ornek@sirket.com"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                          Şirket
                        </label>
                        <input
                          name="company"
                          value={form.company}
                          onChange={handleChange}
                          placeholder="Şirket adı"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                          Telefon
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+90 5XX XXX XX XX"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                        Konu *
                      </label>
                      <select
                        name="topic"
                        value={form.topic}
                        onChange={handleChange}
                        required
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        <option value="" disabled>
                          Hizmet seçiniz...
                        </option>
                        {topics.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                        Mesajınız *
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Tesisinizin güvenlik ihtiyaçlarını kısaca açıklayınız..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                    {status === "error" && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>Bir hata oluştu, lütfen tekrar deneyin.</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === "loading" ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          Teklif Formunu Gönder <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
