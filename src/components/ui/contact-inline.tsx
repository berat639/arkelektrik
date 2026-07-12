"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, Send, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "./scroll-animation";
import type { SiteSettings } from "@/lib/types";

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

interface ContactInlineProps {
  phone: string;
  email: string;
  title: string;
  subtitle: string;
  text: string;
}

export function ContactInline({ phone, email, title, subtitle, text }: ContactInlineProps) {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation();

  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", topic: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const inputClass =
    "w-full bg-dark-700 border border-dark-500 focus:border-teal-500 text-white placeholder-white/35 px-4 py-3 text-sm outline-none transition-colors duration-200";

  return (
    <section id="contact" className="bg-dark-900 py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.25em] mb-4 block">
            {title}
          </span>
          <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase text-white mb-4">
            {subtitle}
          </h2>
          <div className="divider-teal mx-auto" />
          <p className="text-white/65 max-w-xl mx-auto mt-6 text-sm leading-relaxed">
            {text}{" "}
            <Link
              href="/contact"
              className="text-teal-500 hover:underline inline-flex items-center gap-1"
            >
              Detaylı iletişim sayfası <ArrowRight size={12} />
            </Link>
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Info */}
          <div
            ref={leftRef as React.RefObject<HTMLDivElement>}
            className={`lg:col-span-2 animate-on-scroll-left ${leftVisible ? "is-visible" : ""}`}
          >
            <p className="text-white/70 leading-relaxed mb-8">
              Endüstriyel tesisiniz için doğru güvenlik çözümünü birlikte belirleyelim. Uzman
              ekibimiz tesisinizi analiz ederek en uygun sistemi önerecektir.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-teal-500" />
                </div>
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-teal-500" />
                </div>
                <a
                  href={`mailto:${email}`}
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  {email}
                </a>
              </div>
            </div>

            <div
              className="mt-10 bg-teal-500 p-6"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
              }}
            >
              <h4 className="font-heading font-bold text-xl uppercase text-white mb-2">
                Acil Destek
              </h4>
              <p className="text-white/85 text-sm leading-relaxed mb-3">
                7/24 teknik destek hattımız hizmetinizde.
              </p>
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="text-white font-semibold text-sm uppercase tracking-wider hover:underline"
              >
                Hemen Ara &rarr;
              </a>
            </div>
          </div>

          {/* Form */}
          <div
            ref={rightRef as React.RefObject<HTMLDivElement>}
            className={`lg:col-span-3 animate-on-scroll-right ${rightVisible ? "is-visible" : ""}`}
          >
            <div
              className="bg-dark-800 border border-dark-500 p-8"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
              }}
            >
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={48} className="text-green-400 mb-4" />
                  <h3 className="font-heading font-bold text-xl text-white uppercase mb-2">
                    Mesajınız Alındı
                  </h3>
                  <p className="text-white/60 text-sm">
                    En kısa sürede uzmanımız sizinle iletişime geçecektir.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      rows={4}
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
                        Gönder <Send size={16} />
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
  );
}
