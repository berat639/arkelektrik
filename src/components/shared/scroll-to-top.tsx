"use client";

import { ChevronUp } from "lucide-react";

export function ScrollToTop() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollToTop}
      className="flex items-center gap-2 text-white/40 hover:text-teal-500 text-xs uppercase tracking-wider transition-colors cursor-pointer"
    >
      Yukarı <ChevronUp size={14} />
    </button>
  );
}
