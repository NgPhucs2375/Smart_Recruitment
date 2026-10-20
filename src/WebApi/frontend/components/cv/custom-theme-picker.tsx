"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  findPublishedTheme,
  getPublishedThemes,
  themeMatchesId,
} from "@/features/tao-cv/services/theme-storage";
import { fetchDbThemes } from "@/features/tao-cv/services/theme-db-sync";
import type { CvThemeConfig } from "@/features/tao-cv/types/theme-studio";

/** Định danh canonical để chọn theme: slug, fallback id nội bộ. */
export function themeKey(t: CvThemeConfig): string {
  return t.slug || t.id;
}

/** Theme Studio đang Hiển thị: gộp DB (nguồn chân lý) + local (fallback offline). */
export function usePublishedThemes(): CvThemeConfig[] {
  const [themes, setThemes] = useState<CvThemeConfig[]>(() => getPublishedThemes());
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const local = getPublishedThemes();
      try {
        const db = await fetchDbThemes();
        if (!alive) return;
        const merged = [...db];
        for (const t of local) {
          if (!merged.some((m) => themeKey(m) === themeKey(t))) merged.push(t);
        }
        setThemes(merged.length > 0 ? merged : local);
      } catch {
        if (alive) setThemes(local);
      }
    };
    void refresh();
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  return themes;
}

export function customThemeById(
  id: string | null | undefined,
): CvThemeConfig | undefined {
  if (!id || typeof window === "undefined") return undefined;
  return findPublishedTheme(getPublishedThemes(), id) ?? undefined;
}

interface CustomThemeOptionsProps {
  variant: "row" | "card";
  activeId: string;
  onPick: (id: string) => void;
  /** Chuỗi tìm kiếm để lọc theo tên (picker grid). */
  query?: string;
  /** Chế độ trần: chỉ render rows, không header/wrapper (để gộp chung list). */
  bare?: boolean;
}

/** Mục Theme Studio trong picker: chỉ theme đã gạt Policy mới hiện. */
export function CustomThemeOptions({
  variant,
  activeId,
  onPick,
  query = "",
  bare = false,
}: CustomThemeOptionsProps) {
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

  if (bare) {
    // Gộp chung list chính: trả rows trần, không header/wrapper.
    return <>{visible.map((t) => rowButton(t))}</>;
  }

  function rowButton(t: (typeof visible)[number]) {
    const key = themeKey(t);
    const isActive = themeMatchesId(t, activeId);
    return (
      <button
        key={key}
        type="button"
        role="option"
        aria-selected={isActive}
        onClick={() => onPick(key)}
        className={cn(
          "template-card flex w-full items-center gap-3 rounded-xl border p-2.5 text-left",
          isActive
            ? "border-primary bg-primary/5"
            : "border-transparent hover:border-border hover:bg-muted/60",
        )}
      >
        <span
          className="size-11 shrink-0 rounded-lg border border-border"
          style={{
            background: t.thumbnailGradient ?? t.colors.primary,
          }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {t.name}
            </span>
            <span className="shrink-0 rounded-full bg-teal/15 px-1.5 py-px text-[10px] font-semibold text-teal">
              Studio
            </span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {(t.description ?? "").slice(0, 48) || "Theme tùy chỉnh"}
          </span>
        </span>
        {isActive ? (
          <Check
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        ) : (
          <span className="size-4 shrink-0" aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <div className={variant === "row" ? "mt-1" : "mt-4"}>
      <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Theme Studio · đang hiển thị ({visible.length})
      </p>
      {variant === "row" ? (
        <div className="space-y-0.5">
          {visible.map((t) => rowButton(t))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          {visible.map((t) => {
            const key = themeKey(t);
            const isActive = themeMatchesId(t, activeId);
            return (
              <button
                key={key}
                onClick={() => onPick(key)}
                aria-pressed={isActive}
                className={cn(
                  "template-card group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-left",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div
                  className="h-24 w-full rounded-xl border border-border"
                  style={{
                    background: t.thumbnailGradient ?? t.colors.primary,
                  }}
                  aria-hidden="true"
                />
                <div className="w-full">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {(t.description ?? "").slice(0, 60) ||
                      "Theme tùy chỉnh từ Studio"}
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
