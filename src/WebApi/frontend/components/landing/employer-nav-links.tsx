"use client";

import { useActiveSection } from "@/components/landing/reveal";

const LINKS = [
  { label: "Tính năng", href: "#tinh-nang" },
  { label: "Quy trình", href: "#quy-trinh" },
  { label: "Bảng giá", href: "#lien-he" },
] as const;

/** Employer nav section links with subtle active highlight.
 *  Isolated client component so observer state never re-renders the page. */
export function EmployerNavLinks({ large = false }: { large?: boolean }) {
  const active = useActiveSection(LINKS.map((l) => l.href.slice(1)));
  const base = large
    ? "whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-charcoal/65 transition hover:bg-mist/20 hover:text-navy"
    : "whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-charcoal/60 transition hover:bg-mist/20 hover:text-navy";
  return (
    <>
      {LINKS.map((link) => {
        const id = link.href.slice(1);
        const isActive = id === active;
        return (
          <a
            key={link.label}
            href={link.href}
            aria-current={isActive ? "true" : undefined}
            className={`${large ? "" : "shrink-0 "}${base}${isActive ? " bg-mist/20 text-navy" : ""}`}
          >
            {link.label}
          </a>
        );
      })}
    </>
  );
}
