"use client";

// Wrapper giao diện preview; nội dung CV render qua Template Registry + phân trang A4.
// Theme custom (Studio, IsActive) render qua ThemeCanvas generic.
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { CvFormData } from "@/lib/types";
import { toResumeData, type ResumeData } from "@/features/tao-cv/resume-data";
import { resolveTemplate } from "@/features/tao-cv/template-registry";
import { CvPaginatedPreview } from "./cv-paginated-preview";
import { ThemeCanvas } from "@/features/tao-cv/components/theme-canvas";
import {
  applyThemeCustomization,
  findPublishedTheme,
  getPublishedThemes,
  themeMatchesId,
} from "@/features/tao-cv/services/theme-storage";
import { fetchDbThemes } from "@/features/tao-cv/services/theme-db-sync";
import { hydrateThemeFromTemplate } from "@/features/tao-cv/services/theme-hydrate";
import type { CvThemeConfig } from "@/features/tao-cv/types/theme-studio";

interface CvPreviewProps {
  data: CvFormData;
  onPageCount?: (count: number) => void;
  /** Theme Studio đang chỉnh (live preview) — bỏ qua resolve từ templateId/giaoDien. */
  themeOverride?: CvThemeConfig | null;
}

/**
 * Dispatcher: CvFormData -> ResumeData -> registered template component.
 * Contains no CV layout itself; changing templateId re-renders the same
 * content through a different template without touching form data.
 * Pagination is a pure visual wrapper — ResumeData is passed through.
 * Custom Studio theme (IsActive) -> ThemeCanvas với layout + tokens
 * của theme đó; template hệ thống giữ nguyên.
 */
export function CvPreview({ data, onPageCount, themeOverride }: CvPreviewProps) {
  const deferredData = useDeferredValue(data);
  const resume = toResumeData(deferredData);
  const template = resolveTemplate(deferredData.templateId);
  const [customTheme, setCustomTheme] = useState<CvThemeConfig | null>(null);
  // Base hydrate: cho phép CV tùy biến trên mẫu CHƯA publish (Studio tự do).
  const hydratedTheme = useMemo(
    () => hydrateThemeFromTemplate(deferredData.templateId),
    [deferredData.templateId],
  );

  // localStorage + DB chỉ có ở client: resolve sau mount để tránh hydration mismatch.
  // DB là nguồn chân lý (cross-machine), local là fallback offline.
  useEffect(() => {
    let alive = true;
    const local = findPublishedTheme(getPublishedThemes(), deferredData.templateId);
    setCustomTheme(local);
    fetchDbThemes()
      .then((db) => {
        if (!alive) return;
        const found = findPublishedTheme(db, deferredData.templateId) ?? local;
        setCustomTheme(found);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [deferredData.templateId]);

  // Ghép delta tùy biến của ứng viên (chỉ khi khớp theme nền) lên theme nền.
  // Theme nền = theme đã publish, hoặc base hydrate khi chỉ có delta tự do.
  const effectiveTheme = useMemo(() => {
    if (themeOverride) return themeOverride;
    const giaoDien = deferredData.giaoDien;
    const matchesPublished =
      customTheme && giaoDien ? themeMatchesId(customTheme, giaoDien.themeId) : false;
    const matchesHydrated = giaoDien
      ? themeMatchesId(hydratedTheme, giaoDien.themeId)
      : false;
    const base = matchesPublished
      ? customTheme
      : matchesHydrated
        ? hydratedTheme
        : customTheme;
    if (!base) return null;
    const delta =
      giaoDien && (matchesPublished || matchesHydrated) ? giaoDien : undefined;
    return applyThemeCustomization(base, delta);
  }, [customTheme, hydratedTheme, deferredData.giaoDien, themeOverride]);

  const CustomPaper = useMemo(() => {
    if (!effectiveTheme) return null;
    const theme = effectiveTheme;
    return function CustomThemePaper({ data: r }: { data: ResumeData }) {
      return <ThemeCanvas theme={theme} data={{ ...r, layout: theme.layout }} />;
    };
  }, [effectiveTheme]);

  if (effectiveTheme && CustomPaper) {
    return (
      <CvPaginatedPreview
        resume={{ ...resume, layout: effectiveTheme.layout }}
        Component={CustomPaper}
        templateKey={effectiveTheme.slug || effectiveTheme.id}
        onPageCount={onPageCount}
      />
    );
  }
  return (
    <CvPaginatedPreview
      resume={resume}
      Component={template.Component}
      templateKey={template.id}
      onPageCount={onPageCount}
    />
  );
}
