"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Shared public header for both landing pages (main + employer).
 * Single visual system: fixed height, centered nav, text login button,
 * marine pill CTA. Only content props differ per page:
 * nav node, login href, CTA href + label.
 */
export function PublicHeader({
  nav,
  mobileNav,
  loginHref,
  ctaHref,
  ctaLabel,
}: {
  /** Desktop + mobile section links (with their own active state). */
  nav: React.ReactNode;
  /** Compact mobile link row (same links, small type). */
  mobileNav?: React.ReactNode;
  loginHref: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 top-0 z-50 border-b border-linen/70 bg-white/85 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-10 lg:px-16">
        <BrandLogo href="/" variant="workspace" size="sm" className="shrink-0" />
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
          {nav}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href={loginHref}
            className="hidden whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-mist/20 hover:text-navy sm:inline-flex"
          >
            Đăng nhập
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-marine px-4 py-2 text-sm font-medium text-white transition hover:bg-navy"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
      {mobileNav && (
        <div className="border-t border-linen/60 md:hidden">
          <div className="flex gap-1 overflow-x-auto px-4 py-2">{mobileNav}</div>
        </div>
      )}
    </nav>
  );
}
