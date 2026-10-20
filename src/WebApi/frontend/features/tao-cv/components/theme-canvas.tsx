"use client";

import { Fragment, type CSSProperties } from "react";
import { EmptyPaper, SectionShell, SplitBlocks } from "@/components/cv/templates/shared";
import type { ResumeData } from "../resume-data";
import type {
  CvSectionId,
  CvThemeConfig,
  DividerStyle,
  HeadingVariant,
} from "../types/theme-studio";
import { DEFAULT_AVATAR_CONFIG } from "../types/theme-studio";
import { isDarkBackground, readableTextColor } from "../theme-contrast";
import { ThemeRuntimeProvider } from "./theme-runtime-provider";

function headingClass(variant: HeadingVariant): string {
  switch (variant) {
    case "left-border":
      return "border-l-4 pl-2";
    case "pill":
      return "w-fit px-2 py-0.5 rounded";
    case "minimal":
      return "";
    case "accent-bg":
      return "w-fit px-2.5 py-1 rounded";
    case "underline":
    default:
      return "border-b-2 pb-1";
  }
}

/** Màu/điểm nhấn: dùng gradient nếu có, không thì màu chủ đạo dạng solid. */
function accentFill(theme: CvThemeConfig): string {
  return theme.accentGradient || theme.colors.primary;
}

function headingStyle(theme: CvThemeConfig, light: boolean): CSSProperties {
  const { colors, typography } = theme;
  if (light) {
    if (typography.headingVariant === "accent-bg")
      return { backgroundColor: "rgba(255,255,255,0.22)" };
    if (typography.headingVariant === "pill")
      return { backgroundColor: "rgba(255,255,255,0.14)" };
    return { borderColor: "rgba(255,255,255,0.7)" };
  }
  const v = typography.headingVariant;
  if (v === "pill")
    return theme.accentGradient
      ? { background: theme.accentGradient, color: readableTextColor(theme.accentGradient) }
      : { backgroundColor: `${colors.primary}1a`, color: colors.primary };
  if (v === "accent-bg") {
    const fill = accentFill(theme);
    return { background: fill, color: readableTextColor(fill) };
  }
  if (v === "minimal") return { color: colors.primary };
  return { borderColor: colors.primary, color: colors.primary };
}

/** Chữ cái viết tắt cho avatar khi không có ảnh (monogram). */
function initials(name: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Mức kỹ năng ổn định (3–5) suy từ tên — dùng cho progress-bar/dot-rating. */
function skillLevel(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return 3 + (h % 3);
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
    ? "w-fit px-2 py-0.5 rounded mb-2 text-[12px] font-bold tracking-[0.14em]"
    : `${headingClass(theme.typography.headingVariant)} mb-2 text-[12px] font-bold tracking-[0.14em]`;
  const style: CSSProperties = pill
    ? light
      ? { backgroundColor: "rgba(255,255,255,0.16)", color: "#fff" }
      : theme.accentGradient
        ? { background: theme.accentGradient, color: readableTextColor(theme.accentGradient) }
        : { backgroundColor: `${theme.colors.primary}1a`, color: theme.colors.primary }
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
          background: `linear-gradient(90deg, ${accentFill(theme)}, transparent)`,
          opacity: 0.5,
          margin: "var(--cv-divider-spacing) 0",
        }}
      />
    );
  if (style === "accent-dot")
    return (
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
          margin: "var(--cv-divider-spacing) 0",
        }}
      >
        <span
          style={{
            width: "0.5em",
            height: "0.5em",
            borderRadius: "999px",
            background: "var(--cv-primary)",
          }}
        />
        <span
          style={{
            flex: 1,
            borderTop: `${w}px solid var(--cv-primary)`,
            opacity: 0.35,
          }}
        />
      </div>
    );
  return (
    <div
      aria-hidden="true"
      style={{
        borderTop: `${w}px ${style === "dashed" ? "dashed" : "solid"} var(--cv-primary)`,
        opacity: 0.3,
        margin: "var(--cv-divider-spacing) 0",
      }}
    />
  );
}

function enclosureStyle(theme: CvThemeConfig, light = false): CSSProperties {
  const card =
    theme.zoneStyle === "floating-cards" ||
    theme.zoneStyle === "overlap-header" ||
    theme.typography.enclosure === "boxed";
  if (!card) return {};
  const r = `${theme.borderRadiusPx ?? 8}px`;
  if (light) {
    return {
      border: "1px solid rgba(255,255,255,0.22)",
      borderRadius: r,
      padding: "0.9em",
      backgroundColor: "rgba(255,255,255,0.06)",
    };
  }
  return {
    border: "1px solid color-mix(in srgb, var(--cv-primary) 18%, transparent)",
    borderRadius: r,
    padding: "0.9em",
    backgroundColor: "var(--cv-card-bg)",
    boxShadow:
      "0 1px 2px rgba(15,23,42,0.05), 0 10px 24px -18px rgba(15,23,42,0.45)",
  };
}

function renderSection(
  theme: CvThemeConfig,
  data: ResumeData,
  id: CvSectionId,
  light = false,
  enclosure?: CSSProperties,
) {
  const title = data.layout.sections[id]?.title;
  const gap = "var(--cv-item-gap)";
  const sub = light ? "rgba(255,255,255,0.78)" : "var(--cv-muted)";
  const strong = light ? "#fff" : undefined;
  switch (id) {
    case "summary":
      if (!data.summary) return null;
      return (
        <SectionShell section={id} style={enclosure}>
          <SectionHeading theme={theme} light={light}>
            {title ?? "Tóm tắt"}
          </SectionHeading>
          <div
            className="cv-section-item whitespace-pre-line break-words [overflow-wrap:anywhere]"
            style={strong ? { color: strong } : undefined}
          >
            {data.summary}
          </div>
        </SectionShell>
      );
    case "experience": {
      if (data.experience.length === 0) return null;
      const tl = theme.timelineStyle ?? "none";
      const listStyle: CSSProperties =
        tl === "vertical-line"
          ? {
              position: "relative",
              paddingLeft: "1.1em",
              borderLeft:
                "2px solid color-mix(in srgb, var(--cv-primary) 28%, transparent)",
              display: "flex",
              flexDirection: "column",
              gap,
            }
          : { display: "flex", flexDirection: "column", gap };
      const itemStyle: CSSProperties =
        tl === "boxed-item"
          ? {
              position: "relative",
              border:
                "1px solid color-mix(in srgb, var(--cv-primary) 20%, transparent)",
              borderRadius: `${theme.borderRadiusPx ?? 8}px`,
              padding: "0.6em",
            }
          : { position: "relative" };
      return (
        <SectionShell section={id} style={enclosure}>
          <SectionHeading theme={theme} light={light}>
            {title ?? "Kinh nghiệm làm việc"}
          </SectionHeading>
          <div style={listStyle}>
            {data.experience.map((job) => (
              <div key={job.id} className="cv-section-item" style={itemStyle}>
                {tl === "vertical-line" && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "-1.4em",
                      top: "0.35em",
                      width: "0.55em",
                      height: "0.55em",
                      borderRadius: "999px",
                      background: "var(--cv-primary)",
                    }}
                  />
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="font-bold"
                    style={strong ? { color: strong } : undefined}
                  >
                    {job.role || "Chức danh"}
                  </h3>
                  <span style={{ color: sub, fontSize: "0.92em" }}>
                    {[
                      job.range.start,
                      job.range.current ? "Hiện tại" : job.range.end,
                    ]
                      .filter(Boolean)
                      .join(" – ")}
                  </span>
                </div>
                {job.company && (
                  <p
                    style={{
                      color: light ? "#fff" : "var(--cv-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {job.company}
                  </p>
                )}
                {job.description && (
                  <SplitBlocks
                    text={job.description}
                    className="mt-1 whitespace-pre-line break-words"
                  />
                )}
                {job.skills.length > 0 && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>
                    Kỹ năng: {job.skills.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionShell>
      );
    }
    case "projects":
      if (data.projects.length === 0) return null;
      return (
        <SectionShell section={id} style={enclosure}>
          <SectionHeading theme={theme} light={light}>
            {title ?? "Dự án tiêu biểu"}
          </SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.projects.map((p) => (
              <div key={p.id} className="cv-section-item">
                <p
                  className="font-bold"
                  style={strong ? { color: strong } : undefined}
                >
                  {p.name || "Dự án"}
                </p>
                {p.role && (
                  <p
                    style={{
                      color: light ? "#fff" : "var(--cv-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {p.role}
                  </p>
                )}
                {p.range && (p.range.start || p.range.end) && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>
                    {[p.range.start, p.range.current ? "Hiện tại" : p.range.end]
                      .filter(Boolean)
                      .join(" – ")}
                  </p>
                )}
                {p.description && (
                  <SplitBlocks
                    text={p.description}
                    className="mt-1 whitespace-pre-line break-words"
                  />
                )}
                {p.tech.length > 0 && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>
                    Công nghệ: {p.tech.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionShell>
      );
    case "education":
      if (data.education.length === 0) return null;
      return (
        <SectionShell section={id} style={enclosure}>
          <SectionHeading theme={theme} light={light}>
            {title ?? "Học vấn"}
          </SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-section-item">
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="font-bold"
                    style={strong ? { color: strong } : undefined}
                  >
                    {edu.school || "Trường"}
                  </h3>
                  <span style={{ color: sub, fontSize: "0.92em" }}>
                    {[
                      edu.range.start,
                      edu.range.current ? "Hiện tại" : edu.range.end,
                    ]
                      .filter(Boolean)
                      .join(" – ")}
                  </span>
                </div>
                {edu.degree && (
                  <p
                    style={{
                      color: light ? "#fff" : "var(--cv-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {edu.degree}
                  </p>
                )}
                {edu.description && (
                  <SplitBlocks
                    text={edu.description}
                    className="mt-1 whitespace-pre-line break-words"
                  />
                )}
              </div>
            ))}
          </div>
        </SectionShell>
      );
    case "skills": {
      if (data.skills.length === 0) return null;
      const mode = theme.skillDisplayMode ?? "outline-tag";
      const radius = `${theme.borderRadiusPx ?? 8}px`;
      const accent = accentFill(theme);
      const ac = light ? "#fff" : "var(--cv-primary)";
      const border = light ? "rgba(255,255,255,0.6)" : "var(--cv-primary)";
      const heading = (
        <SectionHeading theme={theme} light={light}>
          {title ?? "Kỹ năng"}
        </SectionHeading>
      );
      if (mode === "minimal-comma" || mode === "inline") {
        return (
          <SectionShell section={id} style={enclosure}>
            {heading}
            <div
              className="cv-section-item break-words"
              style={{ color: light ? "#fff" : undefined, fontStyle: "italic" }}
            >
              {data.skills.map((s) => s.name).join(" · ")}
            </div>
          </SectionShell>
        );
      }
      if (mode === "list" || mode === "bars") {
        return (
          <SectionShell section={id} style={enclosure}>
            {heading}
            <div style={{ display: "flex", flexDirection: "column", gap }}>
              {data.skills.map((s) => (
                <div
                  key={s.id}
                  className="cv-section-item break-words"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5em",
                    color: light ? "#fff" : undefined,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "0.32em",
                      height: "0.32em",
                      borderRadius: "999px",
                      background: ac,
                      flexShrink: 0,
                    }}
                  />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </SectionShell>
        );
      }
      if (mode === "progress-bar") {
        return (
          <SectionShell section={id} style={enclosure}>
            {heading}
            <div style={{ display: "flex", flexDirection: "column", gap }}>
              {data.skills.map((s) => {
                // Mức thật của người dùng (1..4 -> 25/50/75/100%); thiếu thì
                // fallback mức suy từ tên (dữ liệu legacy chưa có level).
                const pct =
                  s.level != null
                    ? Math.round((s.level / 4) * 100)
                    : skillLevel(s.name) * 20;
                return (
                  <div key={s.id} className="cv-section-item break-words">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        style={{
                          fontWeight: 600,
                          color: light ? "#fff" : undefined,
                        }}
                      >
                        {s.name}
                      </span>
                      <span style={{ color: sub, fontSize: "0.85em" }}>
                        {pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: "0.2em",
                        height: "6px",
                        borderRadius: "999px",
                        background: light
                          ? "rgba(255,255,255,0.18)"
                          : `${theme.colors.primary}1a`,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: light ? "#fff" : accent,
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionShell>
        );
      }
      if (mode === "dot-rating") {
        return (
          <SectionShell section={id} style={enclosure}>
            {heading}
            <div style={{ display: "flex", flexDirection: "column", gap }}>
              {data.skills.map((s) => {
                const lvl =
                  s.level != null
                    ? Math.min(5, Math.round(s.level * 1.25))
                    : skillLevel(s.name);
                return (
                  <div
                    key={s.id}
                    className="cv-section-item flex items-center justify-between gap-3"
                    style={{ color: light ? "#fff" : undefined }}
                  >
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span aria-hidden="true" className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: "0.5em",
                            height: "0.5em",
                            borderRadius: "999px",
                            background: i < lvl ? accent : "transparent",
                            border: `1px solid ${
                              i < lvl
                                ? "transparent"
                                : light
                                  ? "rgba(255,255,255,0.5)"
                                  : `${theme.colors.primary}55`
                            }`,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionShell>
        );
      }
      if (mode === "pill") {
        return (
          <SectionShell section={id} style={enclosure}>
            {heading}
            <div
              className="cv-section-item"
              style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}
            >
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  style={{
                    background: light ? "rgba(255,255,255,0.9)" : accent,
                    color: light ? "var(--cv-primary)" : readableTextColor(accent),
                    borderRadius: "999px",
                    padding: "0.15rem 0.7rem",
                    fontSize: "0.9em",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        );
      }
      return (
        <SectionShell section={id} style={enclosure}>
          {heading}
          <div
            className="cv-section-item"
            style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}
          >
            {data.skills.map((s) => (
              <span
                key={s.id}
                style={{
                  border: `1px solid ${border}`,
                  color: ac,
                  borderRadius: radius,
                  padding: "0.125rem 0.625rem",
                  fontSize: "0.92em",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </SectionShell>
      );
    }
    case "certificates":
      if (data.certificates.length === 0) return null;
      return (
        <SectionShell section={id} style={enclosure}>
          <SectionHeading theme={theme} light={light}>
            {title ?? "Chứng chỉ"}
          </SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {data.certificates.map((c) => (
              <div key={c.id} className="cv-section-item">
                <p
                  className="font-bold"
                  style={strong ? { color: strong } : undefined}
                >
                  {c.name || "Chứng chỉ"}
                </p>
                {[c.issuer, c.date, c.code].filter(Boolean).length > 0 && (
                  <p style={{ color: sub, fontSize: "0.92em" }}>
                    {[c.issuer, c.date, c.code].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionShell>
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

  const zones = theme.zones ?? {
    headerBg: "transparent",
    sidebarBg: "#f1f5f9",
    mainBg: "transparent",
  };
  const structure = theme.structure ?? "single";
  const sideSet = new Set(data.layout.sidebarSections ?? []);
  // Lưới chống trắng trang: theme legacy thiếu layout vẫn render mẫu mặc định.
  const order = theme.layout?.sectionOrder ?? [...data.layout.sectionOrder];
  const railIds = order.filter((id) => sideSet.has(id));
  const mainIds = order.filter((id) => !sideSet.has(id));
  const sideDark = isDarkBackground(zones.sidebarBg);
  const headDark = isDarkBackground(zones.headerBg);
  const zoneStyle = theme.zoneStyle ?? "flat";
  const radius = theme.borderRadiusPx ?? 8;
  const overlap = zoneStyle === "overlap-header" && structure === "banner-top";
  // Bề rộng vùng nội dung chính (áp cho 1 cột / cột main của 2 cột).
  const mainConstrained: CSSProperties = {
    width: "100%",
    maxWidth: `${theme.mainWidthPct ?? 100}%`,
    marginInline: "auto",
    boxSizing: "border-box",
    ...(zoneStyle === "split-margin"
      ? {
          borderLeft: `4px solid ${accentFill(theme)}`,
          paddingLeft: "1em",
        }
      : {}),
  };
  // overlap-header kéo vùng nội dung chồng lên mép dưới banner.
  const bodyOverlap: CSSProperties = overlap
    ? { marginTop: `-${Math.round(radius * 1.6)}px`, position: "relative" }
    : {};
  const verticalText = theme.typography.verticalTagEnabled
    ? theme.typography.verticalTagText?.trim() || data.title || data.name
    : "";

  const blocks = (ids: CvSectionId[], light: boolean) => {
    const enclosure = enclosureStyle(theme, light);
    return ids
      .map((id) => ({ id, node: renderSection(theme, data, id, light, enclosure) }))
      .filter((b) => b.node !== null);
  };

  const flow = (ids: CvSectionId[], light: boolean) => {
    const list = blocks(ids, light);
    return (
      <>
        {list.map((b, i) => (
          <Fragment key={b.id}>
            {b.node}
            {i < list.length - 1 && <Divider theme={theme} />}
          </Fragment>
        ))}
      </>
    );
  };

  const contactsInSidebar =
    (theme.layout?.contactsPlacement ?? data.layout.contactsPlacement) === "sidebar" &&
    structure !== "single" &&
    data.contacts.length > 0;

  /** Khối liên hệ dọc cho sidebar (mỗi dòng 1 contact, tự đảo màu nền tối). */
  const contactsRail = (light: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35em", fontSize: "0.85em" }}>
      {data.contacts.map((c, i) => (
        <span
          key={`${c.label}-${i}`}
          style={{
            color: light ? "rgba(255,255,255,0.9)" : "var(--cv-muted)",
            overflowWrap: "anywhere",
          }}
        >
          {c.href ? (
            <a href={c.href} style={{ textDecoration: "underline" }}>
              {c.value}
            </a>
          ) : (
            <span>{c.value}</span>
          )}
        </span>
      ))}
    </div>
  );

  const avatarCfg = { ...DEFAULT_AVATAR_CONFIG, ...(theme.avatarConfig ?? {}) };
  const hasAvatarPhoto = !!data.avatarUrl?.trim();
  // Bật avatar → luôn hiển thị: có ảnh thì dùng ảnh, không thì monogram initials.
  const showAvatar = avatarCfg.visible;
  const headerAlign = theme.typography.headerAlign ?? "left";
  const avatarRight = (avatarCfg.position ?? "left") === "right";
  const avatarBorderColor =
    avatarCfg.borderColor === "white"
      ? "#fff"
      : avatarCfg.borderColor === "secondary"
        ? "var(--cv-secondary)"
        : avatarCfg.borderColor === "muted"
          ? "var(--cv-muted)"
          : "var(--cv-primary)";
  const avatarRadius =
    avatarCfg.shape === "circle"
      ? "50%"
      : avatarCfg.shape === "rounded"
        ? "1rem"
        : "0.25rem";
  const avatar = showAvatar ? (
    hasAvatarPhoto ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={data.avatarUrl}
        alt={`Ảnh đại diện ${data.name || ""}`.trim() || "Ảnh đại diện"}
        style={{
          width: avatarCfg.sizePx,
          height: avatarCfg.sizePx,
          objectFit: "cover",
          flexShrink: 0,
          borderRadius: avatarRadius,
          border: avatarCfg.hasBorder
            ? `3px solid ${avatarBorderColor}`
            : undefined,
        }}
      />
    ) : (
      <div
        aria-hidden="true"
        style={{
          width: avatarCfg.sizePx,
          height: avatarCfg.sizePx,
          flexShrink: 0,
          borderRadius: avatarRadius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accentFill(theme),
          color: readableTextColor(accentFill(theme)),
          fontSize: `${Math.round(avatarCfg.sizePx * 0.36)}px`,
          fontWeight: 800,
          letterSpacing: "0.02em",
          lineHeight: 1,
          border: avatarCfg.hasBorder
            ? `3px solid ${avatarBorderColor}`
            : undefined,
        }}
      >
        {initials(data.name)}
      </div>
    )
  ) : null;

  const titleBlock = (
    <>
      {data.customTitle && (
        <p
          style={{
            color: headDark ? "#fff" : "var(--cv-primary)",
            fontSize: "0.78em",
            fontWeight: 700,
            letterSpacing: "0.2em",
          }}
        >
          {data.customTitle}
        </p>
      )}
      <h1
        style={{
          fontSize: "1.9em",
          fontWeight: 800,
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
        }}
      >
        {data.name || "Họ và tên"}
      </h1>
      {data.title && (
        <p
          style={{
            color: headDark ? "#fff" : "var(--cv-secondary)",
            fontWeight: 600,
          }}
        >
          {data.title}
        </p>
      )}
    </>
  );

  const contactsInline =
    data.contacts.length > 0 && !contactsInSidebar ? (
      <p
        style={{
          color: headDark ? "rgba(255,255,255,0.85)" : "var(--cv-muted)",
          fontSize: "0.92em",
          marginTop: "0.25em",
          overflowWrap: "anywhere",
          wordBreak: "break-all",
        }}
      >
        {data.contacts.map((c, i) => (
          <span key={`${c.label}-${i}`}>
            {i > 0 && <span style={{ margin: "0 0.375em" }}>·</span>}
            {c.href ? (
              <a href={c.href} style={{ textDecoration: "underline", overflowWrap: "anywhere" }}>
                {c.value}
              </a>
            ) : (
              <span>{c.value}</span>
            )}
          </span>
        ))}
      </p>
    ) : null;

  const textAlignValue = headerAlign as CSSProperties["textAlign"];
  // split: tên/chức danh bên trái, avatar (nếu có) dồn sang phải.
  const isSplit = headerAlign === "split";
  const header = isSplit ? (
    avatar ? (
      <header
        style={{
          display: "flex",
          gap: "1.25em",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div className="min-w-0" style={{ flex: "1 1 auto", textAlign: "left" }}>
          {titleBlock}
          {contactsInline}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.5em",
            flexShrink: 0,
          }}
        >
          {avatar}
        </div>
      </header>
    ) : (
      <header style={{ textAlign: "left" }}>
        {titleBlock}
        {contactsInline}
      </header>
    )
  ) : (
    <header
      style={
        showAvatar
          ? {
              display: "flex",
              gap: "1em",
              alignItems: "center",
              flexDirection: avatarRight ? "row-reverse" : "row",
            }
          : { textAlign: textAlignValue }
      }
    >
      {avatar}
      <div
        className="min-w-0"
        style={{ flex: showAvatar ? 1 : undefined, textAlign: textAlignValue }}
      >
        {titleBlock}
        {contactsInline}
      </div>
    </header>
  );

  // Full-bleed: hộp màu KHÔNG padding/border-radius — padding chỉ nằm ở
  // div nội dung bên trong, màu ăn sát mép giấy (trái/phải/đáy, banner cả đỉnh).
  const banner =
    structure === "banner-top" && zones.headerBg !== "transparent" ? (
      <div
        data-cv-zone="header"
        style={{
          background: zones.headerBg,
          color: headDark ? "#fff" : undefined,
          marginBottom: overlap ? 0 : "var(--cv-section-gap)",
          ...(overlap
            ? {
                borderBottomLeftRadius: `${radius}px`,
                borderBottomRightRadius: `${radius}px`,
                paddingBottom: "0.4em",
              }
            : {}),
        }}
      >
        <div style={{ padding: "var(--cv-page-padding)" }}>{header}</div>
      </div>
    ) : (
      <div
        data-cv-zone="header"
        style={{
          marginBottom: "var(--cv-section-gap)",
          padding: "var(--cv-page-padding)",
          paddingBottom: 0,
        }}
      >
        {header}
      </div>
    );

  const body =
    structure === "single" ? (
      <div
        className="cv-theme-flow"
        data-cv-zone="main"
        style={{
          gap: "var(--cv-section-gap)",
          background: zones.mainBg !== "transparent" ? zones.mainBg : undefined,
          padding: "var(--cv-page-padding)",
          paddingTop: 0,
          ...bodyOverlap,
          ...mainConstrained,
        }}
      >
        {flow(mainIds.concat(railIds), false)}
      </div>
    ) : (
      <div
        className="cv-theme-columns"
        style={{
          gap: "var(--cv-section-gap)",
          ...bodyOverlap,
        }}
      >
        {structure === "sidebar-left" ? (
          <>
            <div
              data-cv-zone="sidebar"
              style={{
                width: "var(--cv-sidebar-width)",
                flexShrink: 0,
                background: zones.sidebarBg,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "var(--cv-page-padding)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--cv-section-gap)",
                }}
              >
                {contactsInSidebar && contactsRail(sideDark)}
                {flow(railIds, sideDark)}
              </div>
            </div>
            <div
              className="min-w-0 flex-1"
              data-cv-zone="main"
              style={{
                background:
                  zones.mainBg !== "transparent" ? zones.mainBg : undefined,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "var(--cv-page-padding)",
                  paddingTop: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--cv-section-gap)",
                  ...mainConstrained,
                }}
              >
                {flow(mainIds, false)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="min-w-0 flex-1"
              data-cv-zone="main"
              style={{
                background:
                  zones.mainBg !== "transparent" ? zones.mainBg : undefined,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "var(--cv-page-padding)",
                  paddingTop: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--cv-section-gap)",
                  ...mainConstrained,
                }}
              >
                {flow(mainIds, false)}
              </div>
            </div>
            <div
              data-cv-zone="sidebar"
              style={{
                width: "var(--cv-sidebar-width)",
                flexShrink: 0,
                background: zones.sidebarBg,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "var(--cv-page-padding)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--cv-section-gap)",
                }}
              >
                {contactsInSidebar && contactsRail(sideDark)}
                {flow(railIds, sideDark)}
              </div>
            </div>
          </>
        )}
      </div>
    );

  return (
    <ThemeRuntimeProvider theme={theme}>
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
    </ThemeRuntimeProvider>
  );
}
