import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  variant?: "light" | "workspace" | "navy";
  size?: "sm" | "md" | "auth";
  showTagline?: boolean;
  className?: string;
}

/**
 * Single HIREAI brand mark used across public/auth/protected shells.
 * Preserves aspect ratio, responsive sizes, no header height growth.
 */
export function BrandLogo({
  href = "/",
  variant = "workspace",
  size = "md",
  showTagline = false,
  className,
}: BrandLogoProps) {
  const box =
    size === "auth"
      ? "size-10 rounded-2xl"
      : size === "sm"
        ? "size-8 rounded-xl"
        : "size-9 rounded-xl";

  const wordmark =
    size === "auth"
      ? "text-base font-bold"
      : "text-sm font-bold";

  const shell =
    variant === "light"
      ? "bg-white/15 text-white"
      : variant === "navy"
        ? "bg-navy text-white"
        : "bg-workspace-primary text-workspace-on-primary";

  return (
    <Link
      href={href}
      aria-label="HIREAI - Trang tổng quan"
      className={cn("flex min-w-0 shrink-0 items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center shadow-sm",
          box,
          shell
        )}
      >
        <Sparkles className={size === "auth" ? "size-5" : "size-4"} />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate tracking-tight",
            wordmark,
            variant === "light" ? "text-white" : "text-workspace-text"
          )}
        >
          HIRE<span className={variant === "light" ? "text-white/80" : "text-workspace-primary"}>AI</span>
        </span>
        {showTagline && (
          <span className="block truncate text-[10px] font-medium uppercase tracking-[0.16em] text-workspace-muted">
            Smart Recruitment
          </span>
        )}
      </span>
    </Link>
  );
}
