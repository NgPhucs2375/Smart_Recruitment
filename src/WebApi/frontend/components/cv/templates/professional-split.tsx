"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell } from "./shared";

/**
 * Professional Split — clean two-column layout with a narrow sidebar and
 * restrained navy accent, for IT / BA / PM candidates.
 * Layout inspiration: Reactive Resume's Azurill family (narrow rail +
 * main column). HIREAI-native implementation on the ResumeData contract —
 * no upstream code reused. Palette comes from HIREAI paper tokens.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";
const SIDEBAR_BG = "var(--hire-ivory)";
const CHIP_BORDER = "var(--hire-chip-border)";

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em]" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.14em]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

export function ProfessionalSplitTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-4 pt-6" style={{ borderBottom: "2px solid var(--hire-navy)" }}>
        <h1 className="text-[24px] font-bold leading-tight tracking-tight">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-0.5 text-[13px] font-semibold" style={{ color: NAVY }}>
            {data.title}
          </p>
        )}
      </header>

      <div className="grid grid-cols-[28%_72%]">
        <aside className="px-5 py-5" style={{ backgroundColor: SIDEBAR_BG }}>
          <div className="space-y-4">
            {data.contacts.length > 0 && (
              <div className="cv-section-item">
                <RailTitle>Liên hệ</RailTitle>
                <div className="space-y-1.5">
                  {data.contacts.map((c, i) => (
                    <p key={`${c.label}-${i}`} className="text-[11.5px] leading-snug" style={{ color: SUBTLE }}>
                      <span className="font-semibold" style={{ color: INK }}>{c.label}: </span>
                      {c.href ? (
                        <a href={c.href} className="break-all underline decoration-neutral-300 underline-offset-2">
                          {c.value}
                        </a>
                      ) : (
                        <span className="break-all">{c.value}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {data.skills.length > 0 && (
              <div className="cv-section-item">
                <RailTitle>Kỹ năng</RailTitle>
                {/* Names only — no years, no proficiency suffixes. */}
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold"
                      style={{ color: NAVY, border: `1px solid ${CHIP_BORDER}` }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.education.length > 0 && (
              <div className="cv-section-item">
                <RailTitle>Học vấn</RailTitle>
                <div className="space-y-2.5">
                  {data.education.map((edu) => (
                    <div key={edu.id}>
                      <p className="text-[12px] font-bold leading-snug" style={{ color: INK }}>
                        {edu.school || "Trường"}
                      </p>
                      {edu.degree && (
                        <p className="text-[11.5px]" style={{ color: SUBTLE }}>{edu.degree}</p>
                      )}
                      {(edu.range.start || edu.range.end) && (
                        <DateText range={edu.range} className="text-[11px]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-4 px-7 py-5">
          {data.summary && (
            <SectionShell>
              <MainTitle>Tóm tắt</MainTitle>
              <p className="whitespace-pre-line" style={{ color: SUBTLE }}>{data.summary}</p>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <MainTitle>Kinh nghiệm làm việc</MainTitle>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="text-[11px]" />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{job.company}</p>
                    {job.description && (
                      <p className="mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>{job.description}</p>
                    )}
                    {job.skills.length > 0 && (
                      <p className="mt-0.5 text-[11px]" style={{ color: SUBTLE }}>{job.skills.join(" · ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.projects.length > 0 && (
            <SectionShell>
              <MainTitle>Dự án</MainTitle>
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
                      <p className="mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>{p.description}</p>
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
              <MainTitle>Chứng chỉ</MainTitle>
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
    </div>
  );
}
