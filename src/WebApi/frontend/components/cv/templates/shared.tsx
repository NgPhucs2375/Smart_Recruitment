"use client";

// Kiểu props dùng chung cho mọi template, bảo đảm template chỉ nhận ResumeData.
import type { ReactNode } from "react";
import type { ResumeData, ResumeDateRange, ResumeSkill } from "@/features/tao-cv/resume-data";

export type ResumeTemplateProps = { data: ResumeData };

/**
 * Shared template primitives — only what genuinely repeats across
 * templates (date formatting, empty state, skill chips). Layout and
 * section styling stay inside each template file so layouts remain
 * visibly different.
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

/**
 * SectionShell bọc CẢ section (kể cả heading) nên KHÔNG dùng
 * cv-section-item (break-inside: avoid) — section dài phải được
 * phép tách qua trang khi in, tránh khoảng trống lớn + trang trắng.
 * cv-section-shell chỉ phục vụ orphan protection cho heading.
 */
export function SectionShell({ children }: { children: ReactNode }) {
  return <section className="cv-section-shell">{children}</section>;
}

/**
 * Skill chips — names only. Years of experience and proficiency stay in
 * ResumeData for AI/matching but are never rendered as numeric suffixes.
 * Variants tune the chip surface; layout stays with the caller.
 */
export function SkillChips({
  skills,
  variant = "outline",
  className = "",
}: {
  skills: ResumeSkill[];
  variant?: "outline" | "soft" | "plain";
  className?: string;
}) {
  if (skills.length === 0) return null;
  if (variant === "plain") {
    return (
      <p className={`leading-loose ${className}`}>
        {skills.map((s, i) => (
          <span key={s.id}>
            {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
            <span className="font-medium text-neutral-800">{s.name}</span>
          </span>
        ))}
      </p>
    );
  }
  const chip =
    variant === "soft"
      ? "rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      : "rounded-md px-2 py-1 text-[11.5px] font-semibold";
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {skills.map((s) => (
        <span
          key={s.id}
          className={chip}
          style={
            variant === "soft"
              ? {
                  color: "var(--hire-navy)",
                  border: "1px solid var(--hire-chip-border)",
                  backgroundColor: "var(--hire-navy-soft)",
                }
              : {
                  color: "var(--hire-navy)",
                  border: "1px solid var(--hire-chip-border)",
                  backgroundColor: "#fff",
                }
          }
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}
