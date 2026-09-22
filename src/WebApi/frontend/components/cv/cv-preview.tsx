"use client";

import type { CvFormData } from "@/lib/types";
import { toResumeData } from "@/features/tao-cv/resume-data";
import { resolveTemplate } from "@/features/tao-cv/template-registry";
import { CvPaginatedPreview } from "./cv-paginated-preview";

interface CvPreviewProps {
  data: CvFormData;
  onPageCount?: (count: number) => void;
}

/**
 * Dispatcher: CvFormData -> ResumeData -> registered template component.
 * Contains no CV layout itself; changing templateId re-renders the same
 * content through a different template without touching form data.
 * Pagination is a pure visual wrapper — ResumeData is passed through.
 */
export function CvPreview({ data, onPageCount }: CvPreviewProps) {
  const resume = toResumeData(data);
  const template = resolveTemplate(data.templateId);
  return (
    <CvPaginatedPreview
      resume={resume}
      Component={template.Component}
      templateKey={template.id}
      onPageCount={onPageCount}
    />
  );
}
