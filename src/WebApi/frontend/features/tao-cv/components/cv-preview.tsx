"use client";

import type { CvFormData } from "../types";
import { toResumeData } from "../resume-data";
import { resolveTemplate } from "../templates/registry";

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
