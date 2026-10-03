"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import {
  BannerSlot,
  DateText,
  EmptyPaper,
  SectionShell,
  SplitBlocks,
  resolveSectionTitle,
} from "./shared";

// Modern Tech Minimalist — phẳng, slate + Electric Indigo, không blob/skew.
// Giữ nguyên slug, props, data flow và mọi class .cv-section-item.
const INK = "#0f172a";
const MUTED = "#64748b";
const ACCENT = "#4f46e5";
const ACCENT_SOFT = "#eef2ff";
const BORDER = "#e2e8f0";
const CARD_BG = "#ffffff";

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
  return <Icon className="size-3.5 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />;
}

function SectionTitle({ titleKey, fallback }: { titleKey: "summary" | "experience" | "skills" | "projects" | "education" | "certificates"; fallback: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span aria-hidden="true" className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} />
      <h2 className="text-[12px] font-extrabold uppercase" style={{ color: INK, letterSpacing: "0.16em" }}>
        {resolveSectionTitle(titleKey, fallback)}
      </h2>
    </div>
  );
}

function ContactPill({ contact }: { contact: ResumeContact }) {
  return (
    <p
      className="cv-section-item flex min-w-0 items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11.5px] font-medium [overflow-wrap:anywhere]"
      style={{ borderColor: BORDER, color: MUTED }}
    >
      <ContactIcon label={contact.label} />
      {contact.href ? (
        <a href={contact.href} className="break-all underline decoration-slate-200 underline-offset-2">
          {contact.value}
        </a>
      ) : (
        <span className="break-all">{contact.value}</span>
      )}
    </p>
  );
}

export function MotionCreativeTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 min-w-0 bg-white text-[13px] leading-relaxed [overflow-wrap:anywhere]" style={{ color: INK }}>
      {/* Flat header — border-bottom, không band nghiêng/blob */}
      <header className="border-b px-7 pb-5 pt-6" style={{ borderColor: BORDER }}>
        <BannerSlot
          data={data}
          className="mb-2 inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ borderColor: "#c7d2fe", backgroundColor: "#eef2ff", color: "#4f46e5" }}
        />
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight" style={{ color: INK }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-1 text-[13.5px] font-semibold" style={{ color: ACCENT }}>{data.title}</p>}
        {data.contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-medium [overflow-wrap:anywhere]" style={{ color: MUTED }}>
                <ContactIcon label={c.label} />
                {c.href ? (
                  <a href={c.href} className="break-all underline decoration-slate-200 underline-offset-2">
                    {c.value}
                  </a>
                ) : (
                  <span className="break-all">{c.value}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="min-w-0 space-y-4 px-7 py-5">
        {data.summary && (
          <SectionShell>
            <div className="cv-section-item min-w-0 rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
              <SectionTitle titleKey="summary" fallback="Tóm tắt" />
              <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <div className="min-w-0">
              <SectionTitle titleKey="experience" fallback="Kinh nghiệm" />
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item min-w-0 rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <h3 className="flex min-w-0 items-center gap-1.5 font-bold" style={{ color: INK }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
                        <span className="break-words [overflow-wrap:anywhere]">{job.role || "Chức danh"}</span>
                      </h3>
                      <DateText range={job.range} className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" />
                    </div>
                    <p className="mt-0.5 break-words text-[12.5px] font-bold [overflow-wrap:anywhere]" style={{ color: ACCENT }}>
                      {job.company}
                    </p>
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <div className="cv-section-item min-w-0 rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
              <SectionTitle titleKey="skills" fallback="Kỹ năng" />
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s) => (
                  <span
                    key={s.id}
                    className="max-w-full break-words rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-800 [overflow-wrap:anywhere]"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <div className="min-w-0">
              <SectionTitle titleKey="projects" fallback="Dự án" />
              <div className="grid min-w-0 grid-cols-2 gap-3">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item min-w-0 rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
                    <h3 className="break-words text-[12.5px] font-bold leading-snug [overflow-wrap:anywhere]" style={{ color: INK }}>
                      {p.name || "Dự án"}
                    </h3>
                    {p.role && (
                      <p className="break-words text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ color: ACCENT }}>
                        {p.role}
                        {p.link ? ` · ${p.link}` : ""}
                      </p>
                    )}
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11px]" />
                    )}
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words text-[12px] [overflow-wrap:anywhere]" style={{ color: MUTED }} />
                    )}
                    {p.tech.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.tech.map((t, i) => (
                          <span
                            key={`${p.id}-${i}`}
                            className="max-w-full break-words rounded-full px-2 py-0.5 text-[10.5px] font-bold [overflow-wrap:anywhere]"
                            style={{ backgroundColor: ACCENT_SOFT, color: ACCENT }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <div className="min-w-0">
              <SectionTitle titleKey="education" fallback="Học vấn" />
              <div className="space-y-2.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <h3 className="break-words font-bold [overflow-wrap:anywhere]" style={{ color: INK }}>
                        {edu.school || "Trường"}
                      </h3>
                      <DateText range={edu.range} className="shrink-0 text-[11.5px]" />
                    </div>
                    {edu.degree && (
                      <p className="break-words text-[12.5px] font-semibold [overflow-wrap:anywhere]" style={{ color: ACCENT }}>
                        {edu.degree}
                      </p>
                    )}
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <div className="min-w-0">
              <SectionTitle titleKey="certificates" fallback="Chứng chỉ" />
              <div className="space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item flex min-w-0 items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <span className="rounded-full p-1.5" style={{ backgroundColor: ACCENT_SOFT }}>
                      <Award className="size-3.5" style={{ color: ACCENT }} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-[12.5px] font-bold leading-snug [overflow-wrap:anywhere]" style={{ color: INK }}>
                        {c.name || "Chứng chỉ"}
                      </p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p className="break-words text-[11.5px] [overflow-wrap:anywhere]" style={{ color: MUTED }}>
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
