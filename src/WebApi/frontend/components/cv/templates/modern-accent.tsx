"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

/**
 * Modern Accent — contemporary layout with a solid navy header band and
 * accent-led section titles, for Product / Frontend / Designer candidates.
 * Layout inspiration: Reactive Resume's Pikachu family (strong header
 * block, accent section markers, balanced whitespace). HIREAI-native
 * implementation on the ResumeData contract — no upstream code reused.
 */

const NAVY = "var(--hire-navy)";
const NAVY_SOFT = "var(--hire-navy-soft)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";
const CHIP_BORDER = "var(--hire-chip-border)";

function AccentTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.16em]" style={{ color: NAVY }}>
      <span aria-hidden="true" className="inline-block h-3.5 w-1 rounded-full" style={{ backgroundColor: NAVY }} />
      {children}
    </h2>
  );
}

export function ModernAccentTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-5 pt-6 text-white" style={{ backgroundColor: NAVY }}>
        <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.65)" }} />
        <h1 className="text-[24px] font-bold leading-tight tracking-tight">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-0.5 text-[13px] font-medium opacity-90">{data.title}</p>}
        {data.contacts.length > 0 && (
          <p className="mt-2 text-[11.5px] opacity-85">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5 opacity-60">·</span>}
                {c.href ? (
                  <a href={c.href} className="underline decoration-white/40 underline-offset-2">
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

      <div className="space-y-4 px-7 py-5">
        {data.summary && (
          <SectionShell>
            <AccentTitle>Tóm tắt</AccentTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <AccentTitle>Kinh nghiệm làm việc</AccentTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item rounded-lg px-3 py-2.5" style={{ backgroundColor: NAVY_SOFT }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="text-[11px]" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{job.company}</p>
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                  )}
                  {job.skills.length > 0 && (
                    <p className="mt-0.5 text-[11px]" style={{ color: SUBTLE }}>{job.skills.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {(data.education.length > 0 || data.skills.length > 0) && (
          <div className={data.education.length > 0 && data.skills.length > 0 ? "grid grid-cols-2 gap-4" : ""}>
            {data.education.length > 0 && (
              <SectionShell>
                <AccentTitle>Học vấn</AccentTitle>
                <div className="space-y-2">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="cv-section-item">
                      <p className="text-[12px] font-bold leading-snug" style={{ color: INK }}>
                        {edu.school || "Trường"}
                      </p>
                      {edu.degree && <p style={{ color: SUBTLE }}>{edu.degree}</p>}
                      {(edu.range.start || edu.range.end) && (
                        <DateText range={edu.range} className="text-[11px]" />
                      )}
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}

            {data.skills.length > 0 && (
              <SectionShell>
                <AccentTitle>Kỹ năng</AccentTitle>
                {/* Names only — no years, no proficiency suffixes. */}
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ color: NAVY, border: `1px solid ${CHIP_BORDER}`, backgroundColor: NAVY_SOFT }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </SectionShell>
            )}
          </div>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <AccentTitle>Dự án</AccentTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11px]" />
                    )}
                  </div>
                  {p.role && (
                    <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{p.role}</p>
                  )}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                  )}
                  {p.tech.length > 0 && (
                    <p className="mt-0.5 text-[11px]" style={{ color: SUBTLE }}>{p.tech.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <AccentTitle>Chứng chỉ</AccentTitle>
            <div className="space-y-1.5">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <p className="text-[12px] font-bold" style={{ color: INK }}>
                    {c.name || "Chứng chỉ"}
                    {c.date && <span className="ml-2 font-normal" style={{ color: SUBTLE }}>· {c.date}</span>}
                  </p>
                  {[c.issuer, c.code].filter(Boolean).length > 0 && (
                    <p className="text-[11.5px]" style={{ color: SUBTLE }}>
                      {[c.issuer, c.code].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
