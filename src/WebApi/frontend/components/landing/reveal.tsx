"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-time scroll reveal for landing sections (CSS + IntersectionObserver,
 * no animation dependency). Adds .is-visible on first entry, then
 * unobserves. Children stagger via style={{ "--reveal-delay": "80ms" }}.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  stagger = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Stagger direct children entrance (60-100ms steps, max 8). */
  stagger?: boolean;
  as?: "div" | "section" | "article" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean>(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={`reveal${stagger ? " reveal-stagger" : ""}${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </Tag>
  );
}

/**
 * Tracks which section id is currently in view for subtle nav highlight.
 * Local state only — no page re-render beyond the nav itself.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || ids.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}
