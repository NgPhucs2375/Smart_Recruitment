"use client";

// Wrapper giao diện preview; nội dung CV render qua Template Registry + phân trang A4.
// Theme custom (Studio, đã duyệt policy) render qua ThemeCanvas generic.
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { CvFormData } from "@/lib/types";
import { toResumeData, type ResumeData } from "@/features/tao-cv/resume-data";
import { resolveTemplate } from "@/features/tao-cv/template-registry";
import { CvPaginatedPreview } from "./cv-paginated-preview";
import { ThemeCanvas } from "@/features/tao-cv/components/theme-canvas";
import { getPublishedThemes } from "@/features/tao-cv/services/theme-storage";
import type { CvThemeConfig } from "@/features/tao-cv/types/theme-studio";

interface CvPreviewProps {
  data: CvFormData;
  onPageCount?: (count: number) => void;
}

/**
 * Dispatcher: CvFormData -> ResumeData -> registered template component.
 * Contains no CV layout itself; changing templateId re-renders the same
 * content through a different template without touching form data.
 * Pagination is a pure visual wrapper — ResumeData is passed through.
 * Custom Studio theme (policyApproved) -> ThemeCanvas với layout + tokens
 * của theme đó; template hệ thống giữ nguyên.
 */
export function CvPreview({ data, onPageCount }: CvPreviewProps) {
  const deferredData = useDeferredValue(data);
  const resume = toResumeData(deferredData);
  const template = resolveTemplate(deferredData.templateId);
  const [customTheme, setCustomTheme] = useState<CvThemeConfig | null>(null);

  // localStorage chỉ có ở client: resolve sau mount để tránh hydration mismatch.
  useEffect(() => {
    const found = getPublishedThemes().find((t) => t.id === deferredData.templateId) ?? null;
    setCustomTheme(found);
  }, [deferredData.templateId]);

  const CustomPaper = useMemo(() => {
    if (!customTheme) return null;
    const theme = customTheme;
    return function CustomThemePaper({ data: r }: { data: ResumeData }) {
      return <ThemeCanvas theme={theme} data={{ ...r, layout: theme.layout }} />;
    };
  }, [customTheme]);

  if (customTheme && CustomPaper) {
    return (
      <CvPaginatedPreview
        resume={{ ...resume, layout: customTheme.layout }}
        Component={CustomPaper}
        templateKey={customTheme.id}
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
