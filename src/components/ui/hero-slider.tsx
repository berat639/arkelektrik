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
  const ctaPrimaryLabel = slide.ctaPrimaryLabel || slide.cta || "";
  const ctaPrimaryHref = slide.ctaPrimaryHref || slide.href || "";

  return (
    <section id="home" className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(196,30,30,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(196,30,30,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex-1 flex flex-col justify-center w-full">
        <div className="max-w-3xl">
          {/* Badge / Logo */}
          <div
            className={`mb-8 transition-all duration-500 ${
              isTransitioning ? "opacity-0 -translate-y-3" : "opacity-100 translate-y-0"
            }`}
          >
            <svg viewBox="0 -.0393 391.94 145.349" xmlns="http://www.w3.org/2000/svg" className="h-16 md:h-20 w-auto text-white">
              <g fill="currentColor">
                <path d="M378.64 81.84c-15.36 0-27.18-27.77-47.72-35.6L385.29 0h-30.43l-56.43 48.31h-2.22V0h-23.49v103.41h23.49V75.79l16.84-14.33c23.2 4.13 32.2 42.25 62.2 42.25h16.69V81.84h-13.3Z" />
                <path d="M71.44 72.31l-4.94-5c-2.49-2.51-3.75-5.71-3.96-9.19 -.04-.57-.72-.85-1.1-.41C56.92 63 52.9 69.6 52.43 76.26c0 .02 0 .04 0 .06 -.14 3.13 2.52 5.67 5.65 5.67h10.3c4.22 0 6.81-4.81 4.31-8.21 -.38-.52-.8-1.01-1.26-1.47Z" />
                <path d="M43.14 0L0 103.41h25.11l7.25-17.52c.98-2.36 3.28-3.9 5.84-3.9 2.41 0 3.89-2.58 2.72-4.7 -1.9-3.43-3.08-7.26-3.43-11.3 -.77-8.86 3.99-16.95 9.63-23.43l7.11-8.17c2.7-3.11 5.16-6.38 6.5-10.25 1.05-3.03.9-5.86-.12-8.92 -.2-.59.47-1.1.97-.73 2.04 1.48 3.76 3.26 5.5 5.08 2.01 2.1 3.52 4.42 4.8 7.05 3.25 6.65 3.05 13.13.99 20.13 -.74 2.51-.58 6.06 1.84 7.96 1.24.97 2.95.98 4.29.14 .03-.02.06-.04.09-.07 3.04-2.53 2.83-6.63 2.59-10.61 -.04-.6.72-.92 1.11-.47 6.28 7.16 10.05 16.66 7.8 26.16 -.62 2.63-1.62 5.12-2.94 7.43 -1.2 2.1.29 4.71 2.71 4.71h.22c2.57 0 4.88 1.56 5.85 3.94l7.11 17.48h25.11L85.53-.0001h-42.4Z" />
                <path d="M123.89 141.34c-1.55.17-3.52.28-5.21.28 -5.04 0-8.08-2.39-8.08-6.47s2.95-6.47 8.08-6.47c2.76 0 6.36.36 8.53.95v-3.77c-2.17-.56-4.81-.85-8.16-.85 -8.3 0-13 3.94-13 10.13 0 6.19 4.7 10.13 12.78 10.13 3.38 0 6.84-.37 9.31-.96v-9.88h-4.25v6.9Z" />
                <path d="M146.22 125.29l-4.47 0 0 19.7 17.42 0 0-3.68 -12.95 0 0-16.02Z" />
                <path d="M182.54 125.01c-7.54 0-12.02 4.05-12.02 10.13 0 6.08 4.47 10.13 12.02 10.13s11.99-4.05 11.99-10.13c0-6.08-4.45-10.13-11.99-10.13Zm0 16.64c-4.53 0-7.46-2.51-7.46-6.5s2.93-6.47 7.46-6.47c4.53 0 7.43 2.48 7.43 6.47 0 3.99-2.93 6.5-7.43 6.5Z" />
                <path d="M224.52 135.09v-.25c2.22-.76 3.26-2.17 3.26-4.25 0-3.66-2.67-5.29-8.61-5.29h-11.59V145h12.21c5.99 0 8.61-1.69 8.61-5.43 0-2.36-1.24-3.83-3.88-4.47Zm-12.47-6.25h7.04c2.9 0 4.11.68 4.11 2.34 0 1.66-1.18 2.37-4.11 2.37h-7.04v-4.7Zm7.69 12.61h-7.68v-4.98h7.68c2.9 0 4.11.73 4.11 2.48s-1.21 2.51-4.11 2.51Z" />
                <path d="M247.59 125.29l-8.22 19.7h4.79l1.69-4.08h11.6l1.66 4.08h4.78l-8.22-19.7h-8.08Zm-.42 12.19l3.43-8.41h2.05l3.43 8.41h-8.92Z" />
                <path d="M280.45 125.29l-4.48 0 0 19.7 17.42 0 0-3.68 -12.94 0 0-16.02Z" />
                <path d="M131.63 19.56c4.72 4.52 9.78 8.66 16.44 11.47 0 0 .29-.23.29-.23 -3.53-5.3-8.73-9.33-14.42-13.08 -4.77-3.4-11.6-8.25-16.44-11.47l-.29.23c2.34 2.23 4.76 4.4 7.14 6.59 0 0 7.28 6.48 7.28 6.48Z" />
                <path d="M148.01 34.76l-.29-.23c-6.67 2.81-11.73 6.95-16.44 11.47 -4.28 3.79-10.38 9.22-14.42 13.08l.29.23c2.8-1.86 5.53-3.79 8.29-5.68 0 0 8.15-5.79 8.15-5.79 5.69-3.75 10.89-7.77 14.43-13.08Z" />
                <path d="M128.55 33.96c5.93.55 11.73.62 17.47-1.14v-.32c-5.75-1.75-11.55-1.69-17.48-1.13 -5.13.28-12.44.69-17.48 1.14v.32c5.06.45 12.33.86 17.48 1.13Z" />
                <path d="M240.73 103.71h16.1V83.03h-12.71c-9.31 0-14.92-10.19-23.78-18.02 .29 0 1.18-.15 1.48-.3 16.99-1.77 26.29-12.7 26.29-30.73 0-22.3-14.63-33.98-46.39-33.98h-59.9v19.21h21.94s37.67 0 37.67 0c15.96 0 22.41 3.06 22.41 13.4s-6.45 14.6-22.41 14.6h-59.61v56.2h21.94V66.62h19.06c26.89 2.22 31.02 37.08 57.91 37.08Z" />
              </g>
            </svg>
          </div>

          {/* Headline */}
          <h1 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl uppercase leading-none text-shadow mb-6">
            {headline.map((line, i) => (
              <span
                key={`${current}-${i}`}
                className={`block transition-all duration-500 ${
                  i === highlightIndex ? "text-ark-red-light" : "text-white"
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
          {ctaPrimaryHref && ctaPrimaryLabel && (
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
            </div>
          )}

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
                  <span className="w-1.5 h-1.5 bg-ark-red rounded-full" />
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
            className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-ark-red hover:bg-ark-red/10 transition-all duration-200 cursor-pointer"
            aria-label="Önceki slide"
            style={{
              clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-ark-red hover:bg-ark-red/10 transition-all duration-200 cursor-pointer"
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
                  className="absolute inset-0 bg-ark-red rounded-full origin-left"
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

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-36 right-8 hidden lg:flex flex-col items-center gap-2 z-10">
        <div className="w-px h-16 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
}
