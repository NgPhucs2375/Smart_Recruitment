"use client";

// Kiểu props dùng chung cho mọi template, bảo đảm template chỉ nhận ResumeData.
import type { ReactNode } from "react";
import type { ResumeDateRange } from "@/features/tao-cv/resume-data";
import type { ResumeData } from "@/features/tao-cv/resume-data";

export type ResumeTemplateProps = { data: ResumeData };

/**
 * Shared template primitives — only what genuinely repeats across
 * templates (date formatting, empty state). Visual styling stays
 * inside each template file so layouts remain visibly different.
 */

export function formatRange(range: ResumeDateRange): string {
  const { start, end } = range;
  if (!start && !end) return "";
  return `${start || "?"} – ${end || "?"}`;
}

export function DateText({ range, className = "" }: { range: ResumeDateRange; className?: string }) {
  const text = formatRange(range);
  if (!text) return null;
  return <span className={`whitespace-nowrap ${className}`}>{text}</span>;
}

export function EmptyPaper({ hint }: { hint: string }) {
  return (
    <div className="px-8 py-12 text-center text-sm text-neutral-500">
      <p>{hint}</p>
    </div>
  );
}

export function SectionShell({ children }: { children: ReactNode }) {
  return <section className="cv-section-item">{children}</section>;
}
