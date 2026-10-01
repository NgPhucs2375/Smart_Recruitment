"use client";

import type { CSSProperties } from "react";
import { EmptyPaper, SplitBlocks } from "@/components/cv/templates/shared";
import type { ResumeData } from "../resume-data";
import type { CvSectionId, CvThemeConfig, HeadingVariant } from "../types/theme-studio";
import { ThemeRuntimeProvider } from "./theme-runtime-provider";

function headingClass(variant: HeadingVariant): string {
  switch (variant) {
    case "left-border":
      return "border-l-4 pl-2";
    case "pill":
      return "px-2 py-0.5 rounded";
    case "minimal":
      return "";
    case "accent-bg":
      return "px-2 py-1 rounded text-white";
    case "underline":
    default:
      return "border-b-2 pb-1";
  }
}

function headingStyle(theme: CvThemeConfig): CSSProperties {
  const { colors, typography } = theme;
  const v = typography.headingVariant;
  if (v === "pill") return { backgroundColor: `${colors.primary}1a`, color: colors.primary };
  if (v === "accent-bg") return { backgroundColor: colors.primary };
  if (v === "minimal") return { color: colors.primary };
  return { borderColor: colors.primary, color: colors.primary };
}

function SectionHeading({ theme, children }: { theme: CvThemeConfig; children: string }) {
  const upper = theme.typography.uppercaseHeadings;
  return (
    <h2
      className={`${headingClass(theme.typography.headingVariant)} mb-2 text-[12px] font-bold tracking-[0.14em] ${upper ? "uppercase" : ""}`}
      style={headingStyle(theme)}
    >
      {children}
    </h2>
  );
}

function renderSection(theme: CvThemeConfig, data: ResumeData, id: CvSectionId) {
  const title = data.layout.sections[id]?.title;
  const gap = "var(--cv-item-gap)";
  switch (id) {
    case "summary":
      if (!data.summary) return null;
      return (
        <section>
          <SectionHeading theme={theme}>{title ?? "Tóm tắt"}</SectionHeading>
          <div className="cv-section-item whitespace-pre-line break-words [overflow-wrap:anywhere]">
            {data.summary}
          </div>
        </section>
      );
    case "experience":
      if (data.experience.length === 0) return null;
      return (
        <section>
          <SectionHeading theme={theme}>{title ?? "Kinh nghiệm làm việc"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.experience.map((job) => (
              <div key={job.id} className="cv-section-item">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-bold">{job.role || "Chức danh"}</h3>
                  <span style={{ color: "var(--cv-muted)", fontSize: "0.92em" }}>
                    {[job.range.start, job.range.current ? "Hiện tại" : job.range.end].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {job.company && <p style={{ color: "var(--cv-secondary)", fontWeight: 600 }}>{job.company}</p>}
                {job.description && <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words" />}
                {job.skills.length > 0 && (
                  <p style={{ color: "var(--cv-muted)", fontSize: "0.92em" }}>Kỹ năng: {job.skills.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    case "projects":
      if (data.projects.length === 0) return null;
      return (
        <section>
          <SectionHeading theme={theme}>{title ?? "Dự án tiêu biểu"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.projects.map((p) => (
              <div key={p.id} className="cv-section-item">
                <p className="font-bold">{p.name || "Dự án"}</p>
                {p.role && <p style={{ color: "var(--cv-secondary)", fontWeight: 600 }}>{p.role}</p>}
                {p.range && (p.range.start || p.range.end) && (
                  <p style={{ color: "var(--cv-muted)", fontSize: "0.92em" }}>
                    {[p.range.start, p.range.current ? "Hiện tại" : p.range.end].filter(Boolean).join(" – ")}
                  </p>
                )}
                {p.description && <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words" />}
                {p.tech.length > 0 && (
                  <p style={{ color: "var(--cv-muted)", fontSize: "0.92em" }}>Công nghệ: {p.tech.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    case "education":
      if (data.education.length === 0) return null;
      return (
        <section>
          <SectionHeading theme={theme}>{title ?? "Học vấn"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-section-item">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-bold">{edu.school || "Trường"}</h3>
                  <span style={{ color: "var(--cv-muted)", fontSize: "0.92em" }}>
                    {[edu.range.start, edu.range.current ? "Hiện tại" : edu.range.end].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {edu.degree && <p style={{ color: "var(--cv-secondary)", fontWeight: 600 }}>{edu.degree}</p>}
                {edu.description && <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words" />}
              </div>
            ))}
          </div>
        </section>
      );
    case "skills":
      if (data.skills.length === 0) return null;
      return (
        <section>
          <SectionHeading theme={theme}>{title ?? "Kỹ năng"}</SectionHeading>
          <div className="cv-section-item" style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {data.skills.map((s) => (
              <span
                key={s.id}
                style={{
                  border: `1px solid var(--cv-primary)`,
                  color: "var(--cv-primary)",
                  borderRadius: "0.5rem",
                  padding: "0.125rem 0.625rem",
                  fontSize: "0.92em",
                  fontWeight: 600,
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      );
    case "certificates":
      if (data.certificates.length === 0) return null;
      return (
        <section>
          <SectionHeading theme={theme}>{title ?? "Chứng chỉ"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.certificates.map((c) => (
              <div key={c.id} className="cv-section-item">
                <p className="font-bold">{c.name || "Chứng chỉ"}</p>
                {[c.issuer, c.date, c.code].filter(Boolean).length > 0 && (
                  <p style={{ color: "var(--cv-muted)", fontSize: "0.92em" }}>
                    {[c.issuer, c.date, c.code].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}

interface ThemeCanvasProps {
  theme: CvThemeConfig;
  data: ResumeData;
}

/**
 * Renderer generic cho theme custom: 1 cột chảy tự do, thứ tự section
 * theo layout.sectionOrder — không container nào giam được section.
 * Dùng cho preview Studio và preview theme custom ở /tao-cv.
 */
export function ThemeCanvas({ theme, data }: ThemeCanvasProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin để xem trước theme" />
      </div>
    );
  }
  return (
    <ThemeRuntimeProvider theme={theme}>
      <div className="cv-paper cv-paper-a4" style={{ fontSize: "var(--cv-font-size)", fontFamily: "var(--cv-font-family)" }}>
        <header style={{ marginBottom: "var(--cv-section-gap)" }}>
          {data.customTitle && (
            <p style={{ color: "var(--cv-primary)", fontSize: "0.78em", fontWeight: 700, letterSpacing: "0.2em" }}>
              {data.customTitle}
            </p>
          )}
          <h1 style={{ fontSize: "1.9em", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            {data.name || "Họ và tên"}
          </h1>
          {data.title && <p style={{ color: "var(--cv-secondary)", fontWeight: 600 }}>{data.title}</p>}
          {data.contacts.length > 0 && (
            <p style={{ color: "var(--cv-muted)", fontSize: "0.92em", marginTop: "0.25em" }}>
              {data.contacts.map((c, i) => (
                <span key={`${c.label}-${i}`}>
                  {i > 0 && <span style={{ margin: "0 0.375em" }}>·</span>}
                  {c.href ? (
                    <a href={c.href} style={{ textDecoration: "underline" }}>
                      {c.value}
                    </a>
                  ) : (
                    <span>{c.value}</span>
                  )}
                </span>
              ))}
            </p>
          )}
        </header>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--cv-section-gap)" }}>
          {theme.layout.sectionOrder.map((id) => (
            <div key={id}>{renderSection(theme, data, id)}</div>
          ))}
        </div>
      </div>
    </ThemeRuntimeProvider>
  );
}
