"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublishedThemes } from "@/features/tao-cv/services/theme-storage";
import type { CvThemeConfig } from "@/features/tao-cv/types/theme-studio";

/** Theme Studio đã duyệt policy — live trong tab hiện tại, cập nhật khi Studio lưu. */
export function usePublishedThemes(): CvThemeConfig[] {
  const [themes, setThemes] = useState<CvThemeConfig[]>([]);
  useEffect(() => {
    setThemes(getPublishedThemes());
    const onFocus = () => setThemes(getPublishedThemes());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  return themes;
}

export function customThemeById(id: string | null | undefined): CvThemeConfig | undefined {
  if (!id || typeof window === "undefined") return undefined;
  return getPublishedThemes().find((t) => t.id === id);
}

interface CustomThemeOptionsProps {
  variant: "row" | "card";
  activeId: string;
  onPick: (id: string) => void;
  /** Chuỗi tìm kiếm để lọc theo tên (picker grid). */
  query?: string;
}

/** Mục Theme Studio trong picker: chỉ theme đã gạt Policy mới hiện. */
export function CustomThemeOptions({ variant, activeId, onPick, query = "" }: CustomThemeOptionsProps) {
  const themes = usePublishedThemes();
  const q = query.trim().toLowerCase();
  const visible = q
    ? themes.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      )
    : themes;
  if (visible.length === 0) return null;

  return (
    <div className={variant === "row" ? "mt-1" : "mt-4"}>
      <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Theme Studio · đã duyệt ({visible.length})
      </p>
      {variant === "row" ? (
        <div className="space-y-0.5">
          {visible.map((t) => {
            const isActive = activeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onPick(t.id)}
                className={cn(
                  "template-card flex w-full items-center gap-3 rounded-xl border p-2 text-left",
                  isActive ? "border-primary bg-primary/5" : "border-transparent hover:border-border hover:bg-muted/60",
                )}
              >
                <span
                  className="size-9 shrink-0 rounded-lg border border-border"
                  style={{ background: t.thumbnailGradient ?? t.colors.primary }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {(t.description ?? "").slice(0, 40) || "Theme tùy chỉnh"}
                  </span>
                </span>
                {isActive ? (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <Palette className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          {visible.map((t) => {
            const isActive = activeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onPick(t.id)}
                aria-pressed={isActive}
                className={cn(
                  "template-card group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-left",
                  isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50",
                )}
              >
                <div
                  className="h-24 w-full rounded-xl border border-border"
                  style={{ background: t.thumbnailGradient ?? t.colors.primary }}
                  aria-hidden="true"
                />
                <div className="w-full">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {(t.description ?? "").slice(0, 60) || "Theme tùy chỉnh từ Studio"}
                  </p>
                </div>
                {isActive && (
                  <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
