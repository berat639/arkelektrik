"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Intersection Observer–based scroll animation hook.
 * Returns a ref to attach to the target element and an `isVisible` boolean.
 * Once the element scrolls into view it stays visible (one-shot trigger).
 */
export function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
