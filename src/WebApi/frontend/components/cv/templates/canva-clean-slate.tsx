"use client";

// Modern Clean Slate — sidebar phải slate nhẹ, kỹ năng tag phẳng (không bóng),
// headings vạch trái. Tinh giản, thoáng đãng.
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";
import { safeHref } from "@/features/tao-cv/resume-data";

const TEAL = "#0f766e";
const INK = "#1e293b";
const MUTED = "#64748b";
const RAIL_BG = "#f1f5f9";
const HAIRLINE = "#cbd5e1";

function ContactIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const Icon =
    l.includes("mail") || l.includes("email")
      ? Mail
      : l.includes("điện") || l.includes("phone") || l.includes("sđt")
        ? Phone
        : l.includes("địa chỉ") || l.includes("address")
          ? MapPin
          : Globe;
  return <Icon className="size-3.5 shrink-0" style={{ color: TEAL }} strokeWidth={2} />;
}

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-l-[3px] pl-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: TEAL, borderColor: TEAL }}>
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 border-b pb-1.5 text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: INK, borderColor: HAIRLINE }}>
      {children}
    </h2>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CanvaCleanSlateTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      {/* Header trái + avatar phải */}
      <header className="flex items-center gap-5 px-7 pb-4 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-0.5 text-[13px] font-semibold" style={{ color: TEAL }}>
              {data.title}
            </p>
          )}
        </div>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={data.name || "Ảnh đại diện"}
            className="size-20 shrink-0 rounded-full border object-cover"
            style={{ borderColor: HAIRLINE }}
          />
        ) : (
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: HAIRLINE, backgroundColor: RAIL_BG }}
            aria-hidden="true"
          >
            <span className="text-[22px] font-bold" style={{ color: TEAL }}>
              {initials(data.name)}
            </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-[68%_32%]">
        {/* Main */}
        <div className="min-w-0 space-y-4 px-7 py-5">
          {data.summary && (
            <SectionShell section="summary">
              <MainTitle>Tóm tắt</MainTitle>
              <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
            </SectionShell>
          )}
          {data.experience.length > 0 && (
            <SectionShell section="experience">
              <MainTitle>Kinh nghiệm làm việc</MainTitle>
              <div className="space-y-3.5">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[13.5px] font-bold">{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="shrink-0 text-[11px] tabular-nums" />
                    </div>
                    {job.company && (
                      <p className="text-[12.5px] font-semibold" style={{ color: TEAL }}>
                        {job.company}
                      </p>
                    )}
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.projects.length > 0 && (
            <SectionShell section="projects">
              <MainTitle>Dự án</MainTitle>
              <div className="space-y-3">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[13px] font-bold">{p.name || "Dự án"}</h3>
                      {p.link && (
                        <a
                          href={safeHref(p.link)}
                          className="shrink-0 text-[11px] underline underline-offset-2"
                          style={{ color: MUTED }}
                        >
                          {p.link}
                        </a>
                      )}
                    </div>
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.education.length > 0 && (
            <SectionShell section="education">
              <MainTitle>Học vấn</MainTitle>
              <div className="space-y-2.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[13px] font-bold">{edu.school || "Trường"}</h3>
                      <DateText range={edu.range} className="shrink-0 text-[11px] tabular-nums" />
                    </div>
                    {edu.degree && (
                      <p className="text-[12px]" style={{ color: MUTED }}>
                        {edu.degree}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>

        {/* Rail phải */}
        <aside className="min-w-0 px-5 py-5" style={{ backgroundColor: RAIL_BG }}>
          {data.contacts.length > 0 && (
            <div className="cv-section-item">
              <RailTitle>Liên hệ</RailTitle>
              <div className="space-y-1.5">
                {data.contacts.map((c, i) => (
                  <p key={`${c.label}-${i}`} className="flex items-start gap-1.5 text-[11.5px] leading-snug" style={{ color: MUTED }}>
                    <ContactIcon label={c.label} />
                    <span className="break-all">
                      {c.href ? (
                        <a href={c.href} className="underline underline-offset-2">
                          {c.value}
                        </a>
                      ) : (
                        c.value
                      )}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}
          {data.skills.length > 0 && (
            <SectionShell section="skills">
              <div className="mt-4">
                <RailTitle>Kỹ năng</RailTitle>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => (
                    <span
                      key={s.id}
                      className="cv-section-item border bg-white px-2 py-1 text-[11px] font-semibold"
                      style={{ borderColor: HAIRLINE, color: INK }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <div className="mt-4">
                <RailTitle>Chứng chỉ</RailTitle>
                <div className="space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item text-[11.5px]">
                      <p className="font-bold">{c.name || "Chứng chỉ"}</p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p style={{ color: MUTED }}>
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
        </aside>
      </div>
    </div>
  );
}
