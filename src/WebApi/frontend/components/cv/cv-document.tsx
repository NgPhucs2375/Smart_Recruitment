"use client";

// Tài liệu CV duy nhất: preview và export đều dùng chung renderer này.
import type { Ref } from "react";
import { toResumeData } from "@/features/tao-cv/resume-data";
import { resolveTemplate } from "@/features/tao-cv/template-registry";
import { ThemeCanvas } from "@/features/tao-cv/components/theme-canvas";
import type { CvThemeConfig } from "@/features/tao-cv/types/theme-studio";
import type { CvFormData } from "@/lib/types";

export type CvDocumentProps = {
  data: CvFormData;
  documentRef?: Ref<HTMLDivElement>;
  /** Theme Studio custom (kể cả avatar) — không có = resolve registry như cũ. */
  customTheme?: CvThemeConfig | null;
};

export function CvDocument({ data, documentRef, customTheme }: CvDocumentProps) {
  const resume = toResumeData(data);
  if (customTheme) {
    const theme = customTheme;
    const paper = { ...resume, layout: theme.layout };
    return (
      <div ref={documentRef} data-cv-document className="cv-document-shell">
        <ThemeCanvas theme={theme} data={paper} />
      </div>
    );
  }
  const { Component } = resolveTemplate(data.templateId);

  return (
    <div ref={documentRef} data-cv-document className="cv-document-shell">
      <Component data={resume} />
    </div>
  );
}
