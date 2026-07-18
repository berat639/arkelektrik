"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Slide } from "@/lib/types";

const AUTOPLAY_MS = 6000;

interface HeroSliderProps {
  slides: Slide[];
  stats?: { value: string; label: string }[];
}

export function HeroSlider({ slides, stats }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || total === 0) return;
      setIsTransitioning(true);
      setProgress(0);
      setTimeout(() => {
        setCurrent((index + total) % total);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 400);
    },
    [isTransitioning, total]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Autoplay
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, total]);

  // Progress bar
  const [prevCurrent, setPrevCurrent] = useState(current);
  if (current !== prevCurrent) {
    setPrevCurrent(current);
    setProgress(0);
  }

  useEffect(() => {
    if (total <= 1) return;
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / AUTOPLAY_MS) * 100, 100));
    }, 30);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current, total]);

  const handleCta = (href: string) => {
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
    // For internal links, Next.js Link handles it
  };

  if (!slides.length) return null;

  const slide = slides[current];
  const headline = slide.headline?.length ? slide.headline : [slide.title];
  const highlightIndex = slide.highlightIndex ?? 1;
  const badge = slide.badge || "ARK Global";
  const description = slide.description || slide.subtitle || "";
  const tags = slide.tags || [];
  const ctaPrimaryLabel = slide.ctaPrimaryLabel || slide.cta || "Hizmetlerimiz";
  const ctaPrimaryHref = slide.ctaPrimaryHref || slide.href || "#services";
  const ctaSecondaryLabel = slide.ctaSecondaryLabel || "Teklif Al";
  const ctaSecondaryHref = slide.ctaSecondaryHref || "/contact";

  return (
    <section id="home" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* ── Background images ── */}
      {slides.map((s, i) => (
        <div
          key={s.id || i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current && !isTransitioning ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt={s.badge || s.title}
            fill
            className="object-cover"
            style={{
              transform: i === current ? "scale(1.05)" : "scale(1.12)",
              transition: "transform 6s ease-out",
            }}
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* ── Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 via-amber-900/30 to-dark-900/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-dark-900/50" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-transparent" />

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(184,134,11,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(184,134,11,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex-1 flex flex-col justify-center pt-20 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 bg-teal-500/15 border border-teal-500/40 px-4 py-2 mb-8 transition-all duration-500 ${
              isTransitioning ? "opacity-0 -translate-y-3" : "opacity-100 translate-y-0"
            }`}
          >
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse-slow" />
            <span className="text-teal-500 text-xs font-semibold uppercase tracking-[0.2em]">
              {badge}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl uppercase leading-none text-shadow mb-6">
            {headline.map((line, i) => (
              <span
                key={`${current}-${i}`}
                className={`block transition-all duration-500 ${
                  i === highlightIndex ? "text-teal-500" : "text-white"
                } ${isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p
            className={`text-white/85 text-lg leading-relaxed mb-10 max-w-xl transition-all duration-500 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
            style={{ transitionDelay: "240ms" }}
          >
            {description}
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-500 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
            style={{ transitionDelay: "320ms" }}
          >
            {ctaPrimaryHref.startsWith("#") ? (
              <button onClick={() => handleCta(ctaPrimaryHref)} className="btn-primary">
                {ctaPrimaryLabel} <ArrowRight size={16} />
              </button>
            ) : (
              <Link href={ctaPrimaryHref} className="btn-primary">
                {ctaPrimaryLabel} <ArrowRight size={16} />
              </Link>
            )}
            {ctaSecondaryHref.startsWith("#") ? (
              <button onClick={() => handleCta(ctaSecondaryHref)} className="btn-outline">
                {ctaSecondaryLabel}
              </button>
            ) : (
              <Link href={ctaSecondaryHref} className="btn-outline">
                {ctaSecondaryLabel}
              </Link>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div
              className={`flex flex-wrap gap-4 mt-12 transition-all duration-500 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 text-white/65 text-sm border border-white/10 px-3 py-1.5 bg-white/5 backdrop-blur-sm"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                  }}
                >
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Slide controls ── */}
      {total > 1 && (
        <div className="absolute bottom-44 right-8 z-20 hidden lg:flex items-center gap-3">
          <button
            onClick={prev}
            className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-teal-500 hover:bg-teal-500/10 transition-all duration-200 cursor-pointer"
            aria-label="Önceki slide"
            style={{
              clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-teal-500 hover:bg-teal-500/10 transition-all duration-200 cursor-pointer"
            aria-label="Sonraki slide"
            style={{
              clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Slide indicators + progress ── */}
      {total > 1 && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group relative h-1.5 transition-all duration-300 overflow-hidden cursor-pointer"
              style={{ width: i === current ? 48 : 16 }}
              aria-label={`Slide ${i + 1}`}
            >
              <span className="absolute inset-0 bg-white/20 rounded-full" />
              {i === current && (
                <span
                  className="absolute inset-0 bg-teal-500 rounded-full origin-left"
                  style={{ transform: `scaleX(${progress / 100})`, transition: "transform 30ms linear" }}
                />
              )}
              {i !== current && (
                <span className="absolute inset-0 bg-white/40 rounded-full scale-0 group-hover:scale-100 transition-transform duration-200" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Slide counter ── */}
      {total > 1 && (
        <div className="absolute bottom-44 left-8 z-20 hidden lg:flex items-baseline gap-1 font-heading">
          <span className="text-3xl font-bold text-white">{String(current + 1).padStart(2, "0")}</span>
          <span className="text-sm text-white/30 mx-1">/</span>
          <span className="text-sm text-white/30">{String(total).padStart(2, "0")}</span>
        </div>
      )}

      {/* ── Stats bar ── */}
      {stats && stats.length > 0 && (
        <div className="relative z-10 bg-gradient-to-r from-dark-900/90 via-amber-900/45 to-dark-900/90 backdrop-blur-sm border-t border-amber-500/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
              {stats.map(({ value, label }) => (
                <div key={label} className="py-6 px-8 text-center">
                  <div className="font-heading font-bold text-3xl text-teal-500">{value}</div>
                  <div className="text-white/65 text-xs uppercase tracking-wider mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-36 right-8 hidden lg:flex flex-col items-center gap-2 z-10">
        <div className="w-px h-16 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
}
