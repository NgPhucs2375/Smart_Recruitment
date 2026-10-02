"use client";

import type { CSSProperties } from "react";
import { EmptyPaper, SplitBlocks } from "@/components/cv/templates/shared";
import type { ResumeData } from "../resume-data";
import type { CvSectionId, CvThemeConfig, DividerStyle, HeadingVariant } from "../types/theme-studio";
import { isDarkBackground } from "../theme-contrast";
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

function headingStyle(theme: CvThemeConfig, light: boolean): CSSProperties {
  const { colors, typography } = theme;
  if (light) {
    if (typography.headingVariant === "accent-bg") return { backgroundColor: "rgba(255,255,255,0.22)" };
    if (typography.headingVariant === "pill") return { backgroundColor: "rgba(255,255,255,0.14)" };
    return { borderColor: "rgba(255,255,255,0.7)" };
  }
  const v = typography.headingVariant;
  if (v === "pill") return { backgroundColor: `${colors.primary}1a`, color: colors.primary };
  if (v === "accent-bg") return { backgroundColor: colors.primary };
  if (v === "minimal") return { color: colors.primary };
  return { borderColor: colors.primary, color: colors.primary };
}

function SectionHeading({
  theme,
  light = false,
  children,
}: {
  theme: CvThemeConfig;
  light?: boolean;
  children: string;
}) {
  // left-pill: ép heading dạng pill bất kể variant đã chọn.
  const pill = theme.typography.enclosure === "left-pill";
  const upper = theme.typography.uppercaseHeadings;
  const cls = pill
    ? "px-2 py-0.5 rounded mb-2 text-[12px] font-bold tracking-[0.14em]"
    : `${headingClass(theme.typography.headingVariant)} mb-2 text-[12px] font-bold tracking-[0.14em]`;
  const style: CSSProperties = pill
    ? { backgroundColor: light ? "rgba(255,255,255,0.16)" : `${theme.colors.primary}1a`, color: light ? "#fff" : theme.colors.primary }
    : headingStyle(theme, light);
  return (
    <h2 className={`${cls} ${upper ? "uppercase" : ""}`} style={style}>
      {children}
    </h2>
  );
}

function Divider({ theme }: { theme: CvThemeConfig }) {
  const style: DividerStyle = theme.typography.dividerStyle ?? "solid";
  const w = theme.typography.dividerWidthPx ?? 2;
  if (style === "none") return null;
  if (style === "gradient")
    return (
      <div
        aria-hidden="true"
        style={{
          height: "2px",
          background: `linear-gradient(90deg, var(--cv-primary), transparent)`,
          opacity: 0.5,
          margin: "0.25em 0",
        }}
      />
    );
  if (style === "accent-dot")
    return (
      <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: "0.5em", margin: "0.25em 0" }}>
        <span style={{ width: "0.5em", height: "0.5em", borderRadius: "999px", background: "var(--cv-primary)" }} />
        <span style={{ flex: 1, borderTop: `${w}px solid var(--cv-primary)`, opacity: 0.35 }} />
      </div>
    );
  return (
    <div
      aria-hidden="true"
      style={{
        borderTop: `${w}px ${style === "dashed" ? "dashed" : "solid"} var(--cv-primary)`,
        opacity: 0.3,
        margin: "0.25em 0",
      }}
    />
  );
}

function enclosureStyle(theme: CvThemeConfig): CSSProperties {
  if (theme.typography.enclosure === "boxed") {
    return {
      border: "1px solid color-mix(in srgb, var(--cv-primary) 25%, transparent)",
      borderRadius: "0.6rem",
      padding: "0.8em",
    };
  }
  return {};
}

function renderSection(theme: CvThemeConfig, data: ResumeData, id: CvSectionId, light = false) {
  const title = data.layout.sections[id]?.title;
  const gap = "var(--cv-item-gap)";
  const sub = light ? "rgba(255,255,255,0.78)" : "var(--cv-muted)";
  const strong = light ? "#fff" : undefined;
  switch (id) {
    case "summary":
      if (!data.summary) return null;
      return (
        <section>
          <SectionHeading theme={theme} light={light}>{title ?? "Tóm tắt"}</SectionHeading>
          <div className="cv-section-item whitespace-pre-line break-words [overflow-wrap:anywhere]" style={strong ? { color: strong } : undefined}>
            {data.summary}
          </div>
        </section>
      );
    case "experience":
      if (data.experience.length === 0) return null;
      return (
        <section>
          <SectionHeading theme={theme} light={light}>{title ?? "Kinh nghiệm làm việc"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.experience.map((job) => (
              <div key={job.id} className="cv-section-item">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-bold" style={strong ? { color: strong } : undefined}>{job.role || "Chức danh"}</h3>
                  <span style={{ color: sub, fontSize: "0.92em" }}>
                    {[job.range.start, job.range.current ? "Hiện tại" : job.range.end].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {job.company && <p style={{ color: light ? "#fff" : "var(--cv-secondary)", fontWeight: 600 }}>{job.company}</p>}
                {job.description && <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words" />}
                {job.skills.length > 0 && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>Kỹ năng: {job.skills.join(", ")}</p>
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
          <SectionHeading theme={theme} light={light}>{title ?? "Dự án tiêu biểu"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.projects.map((p) => (
              <div key={p.id} className="cv-section-item">
                <p className="font-bold" style={strong ? { color: strong } : undefined}>{p.name || "Dự án"}</p>
                {p.role && <p style={{ color: light ? "#fff" : "var(--cv-secondary)", fontWeight: 600 }}>{p.role}</p>}
                {p.range && (p.range.start || p.range.end) && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>
                    {[p.range.start, p.range.current ? "Hiện tại" : p.range.end].filter(Boolean).join(" – ")}
                  </p>
                )}
                {p.description && <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words" />}
                {p.tech.length > 0 && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>Công nghệ: {p.tech.join(", ")}</p>
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
          <SectionHeading theme={theme} light={light}>{title ?? "Học vấn"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-section-item">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-bold" style={strong ? { color: strong } : undefined}>{edu.school || "Trường"}</h3>
                  <span style={{ color: sub, fontSize: "0.92em" }}>
                    {[edu.range.start, edu.range.current ? "Hiện tại" : edu.range.end].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {edu.degree && <p style={{ color: light ? "#fff" : "var(--cv-secondary)", fontWeight: 600 }}>{edu.degree}</p>}
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
          <SectionHeading theme={theme} light={light}>{title ?? "Kỹ năng"}</SectionHeading>
          <div className="cv-section-item" style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {data.skills.map((s) => (
              <span
                key={s.id}
                style={{
                  border: `1px solid ${light ? "rgba(255,255,255,0.6)" : "var(--cv-primary)"}`,
                  color: light ? "#fff" : "var(--cv-primary)",
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
          <SectionHeading theme={theme} light={light}>{title ?? "Chứng chỉ"}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.certificates.map((c) => (
              <div key={c.id} className="cv-section-item">
                <p className="font-bold" style={strong ? { color: strong } : undefined}>{c.name || "Chứng chỉ"}</p>
                {[c.issuer, c.date, c.code].filter(Boolean).length > 0 && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>
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
 * Renderer generic cho theme custom: thứ tự section theo layout.sectionOrder,
 * khung xương single / sidebar / banner — không container cứng nào giam section.
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

  const zones = theme.zones ?? { headerBg: "transparent", sidebarBg: "#f1f5f9", mainBg: "transparent" };
  const structure = theme.structure ?? "single";
  const sideSet = new Set(data.layout.sidebarSections ?? []);
  const order = theme.layout.sectionOrder;
  const railIds = order.filter((id) => sideSet.has(id));
  const mainIds = order.filter((id) => !sideSet.has(id));
  const sideDark = isDarkBackground(zones.sidebarBg);
  const headDark = isDarkBackground(zones.headerBg);
  const enclosure = enclosureStyle(theme);
  const verticalText =
    theme.typography.verticalTagEnabled
      ? theme.typography.verticalTagText?.trim() || data.title || data.name
      : "";

  const blocks = (ids: CvSectionId[], light: boolean) =>
    ids
      .map((id) => ({ id, node: renderSection(theme, data, id, light) }))
      .filter((b) => b.node !== null);

  const flow = (ids: CvSectionId[], light: boolean) => {
    const list = blocks(ids, light);
    return (
      <>
        {list.map((b, i) => (
          <div key={b.id} style={enclosure}>
            {b.node}
            {i < list.length - 1 && <Divider theme={theme} />}
          </div>
        ))}
      </>
    );
  };

  const header = (
    <header>
      {data.customTitle && (
        <p style={{ color: headDark ? "#fff" : "var(--cv-primary)", fontSize: "0.78em", fontWeight: 700, letterSpacing: "0.2em" }}>
          {data.customTitle}
        </p>
      )}
      <h1 style={{ fontSize: "1.9em", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
        {data.name || "Họ và tên"}
      </h1>
      {data.title && <p style={{ color: headDark ? "#fff" : "var(--cv-secondary)", fontWeight: 600 }}>{data.title}</p>}
      {data.contacts.length > 0 && (
        <p style={{ color: headDark ? "rgba(255,255,255,0.85)" : "var(--cv-muted)", fontSize: "0.92em", marginTop: "0.25em" }}>
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
  );

  const banner =
    structure === "banner-top" && zones.headerBg !== "transparent" ? (
      <div
        style={{
          background: zones.headerBg,
          color: headDark ? "#fff" : undefined,
          margin: "calc(var(--cv-page-padding) * -1)",
          marginBottom: "var(--cv-section-gap)",
          padding: "var(--cv-page-padding)",
        }}
      >
        {header}
      </div>
    ) : (
      <div style={{ marginBottom: "var(--cv-section-gap)" }}>{header}</div>
    );

  const body =
    structure === "single" ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--cv-section-gap)", background: zones.mainBg !== "transparent" ? zones.mainBg : undefined }}>
        {flow(mainIds.concat(railIds), false)}
      </div>
    ) : (
      <div style={{ display: "flex", gap: "var(--cv-section-gap)" }}>
        {structure === "sidebar-left" ? (
          <>
            <div
              style={{
                width: "var(--cv-sidebar-width)",
                flexShrink: 0,
                background: zones.sidebarBg,
                borderRadius: "0.75rem",
                padding: "var(--cv-page-padding)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--cv-section-gap)",
              }}
            >
              {flow(railIds, sideDark)}
            </div>
            <div
              className="min-w-0 flex-1"
              style={{
                background: zones.mainBg !== "transparent" ? zones.mainBg : undefined,
                display: "flex",
                flexDirection: "column",
                gap: "var(--cv-section-gap)",
              }}
            >
              {flow(mainIds, false)}
            </div>
          </>
        ) : (
          <>
            <div
              className="min-w-0 flex-1"
              style={{
                background: zones.mainBg !== "transparent" ? zones.mainBg : undefined,
                display: "flex",
                flexDirection: "column",
                gap: "var(--cv-section-gap)",
              }}
            >
              {flow(mainIds, false)}
            </div>
            <div
              style={{
                width: "var(--cv-sidebar-width)",
                flexShrink: 0,
                background: zones.sidebarBg,
                borderRadius: "0.75rem",
                padding: "var(--cv-page-padding)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--cv-section-gap)",
              }}
            >
              {flow(railIds, sideDark)}
            </div>
          </>
        )}
      </div>
    );

  return (
    <ThemeRuntimeProvider theme={theme}>
      <div
        className="cv-paper cv-paper-a4"
        style={{
          fontSize: "var(--cv-font-size)",
          fontFamily: "var(--cv-font-family)",
          position: "relative",
        }}
      >
        {verticalText ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "6px",
              top: "50%",
              transform: "translateY(-50%) rotate(180deg)",
              writingMode: "vertical-rl",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--cv-primary)",
              opacity: 0.45,
              pointerEvents: "none",
            }}
          >
            {verticalText}
          </div>
        ) : null}
        {banner}
        {body}
      </div>
    </ThemeRuntimeProvider>
  );
}
