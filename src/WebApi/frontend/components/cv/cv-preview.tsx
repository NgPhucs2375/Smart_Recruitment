"use client";

import type { CvFormData } from "@/lib/types";
import { toResumeData } from "@/features/tao-cv/resume-data";
import { resolveTemplate } from "@/features/tao-cv/template-registry";

interface CvPreviewProps {
  data: CvFormData;
}

/**
 * Dispatcher: CvFormData -> ResumeData -> registered template component.
 * Contains no CV layout itself; changing templateId re-renders the same
 * content through a different template without touching form data.
 */
export function CvPreview({ data }: CvPreviewProps) {
  const resume = toResumeData(data);
  const template = resolveTemplate(data.templateId);
  const { Component } = template;
  return <Component data={resume} />;
}
