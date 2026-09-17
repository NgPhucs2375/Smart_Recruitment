"use client";

// Tài liệu CV duy nhất: preview và export đều dùng chung renderer này.
import type { Ref } from "react";
import { toResumeData } from "@/features/tao-cv/resume-data";
import { resolveTemplate } from "@/features/tao-cv/template-registry";
import type { CvFormData } from "@/lib/types";

export type CvDocumentProps = {
  data: CvFormData;
  documentRef?: Ref<HTMLDivElement>;
};

export function CvDocument({ data, documentRef }: CvDocumentProps) {
  const resume = toResumeData(data);
  const { Component } = resolveTemplate(data.templateId);

  return (
    <div ref={documentRef} data-cv-document className="cv-document-shell">
      <Component data={resume} />
    </div>
  );
}
