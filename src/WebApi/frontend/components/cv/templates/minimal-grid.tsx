"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SkillChips, SplitBlocks } from "./shared";

/**
 * Minimal Grid — modular structure: full-width header and experience,
 * then a two-column grid for the supporting sections. Compact visual
 * rhythm without sidebar chrome. HIREAI-native, ResumeData only.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.18em]"
      style={{ color: NAVY, borderColor: "var(--hire-chip-border)" }}
    >
      {children}
    </h2>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ border: "1px solid var(--hire-line)" }}>
      {children}
    </div>
  );
}

export function MinimalGridTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="flex items-end justify-between gap-4 px-7 pb-4 pt-6">
        <div className="min-w-0">
          <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: SUBTLE }} />
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: NAVY }}>{data.title}</p>
          )}
        </div>
        {data.contacts.length > 0 && (
          <div className="shrink-0 space-y-0.5 text-right">
            {data.contacts.slice(0, 4).map((c, i) => (
              <p key={`${c.label}-${i}`} className="text-[11px]" style={{ color: SUBTLE }}>
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">{c.value}</a>
                ) : (
                  c.value
                )}
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-3 px-7 py-5" style={{ borderTop: "1px solid var(--hire-line)" }}>
        {data.summary && (
          <SectionShell>
            <Cell>
              <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
            </Cell>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Cell>
              <Title>Kinh nghiệm</Title>
              <div className="space-y-2.5">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>
                        {job.role || "Chức danh"} <span className="font-medium" style={{ color: NAVY }}>· {job.company}</span>
                      </h3>
                      <DateText range={job.range} className="shrink-0 text-[11px]" />
                    </div>
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                    )}
                  </div>
                ))}
              </div>
            </Cell>
          </SectionShell>
        )}

        <div className="grid grid-cols-2 gap-3">
          {data.skills.length > 0 && (
            <SectionShell>
              <Cell>
                <Title>Kỹ năng</Title>
                <SkillChips skills={data.skills} variant="soft" />
              </Cell>
            </SectionShell>
          )}
          {data.projects.length > 0 && (
            <SectionShell>
              <Cell>
                <Title>Dự án</Title>
                <div className="space-y-2">
                  {data.projects.map((p) => (
                    <div key={p.id} className="cv-section-item">
                      <p className="text-[12px] font-bold leading-snug" style={{ color: INK }}>{p.name}</p>
                      {p.description && (
                        <SplitBlocks text={p.description} className="mt-0.5 text-[11.5px] whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                      )}
                      {p.tech.length > 0 && (
                        <p className="mt-0.5 font-mono text-[10px]" style={{ color: NAVY }}>
                          {p.tech.join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Cell>
            </SectionShell>
          )}
          {data.education.length > 0 && (
            <SectionShell>
              <Cell>
                <Title>Học vấn</Title>
                <div className="space-y-2">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="cv-section-item">
                      <p className="text-[12px] font-bold leading-snug" style={{ color: INK }}>{edu.school}</p>
                      {edu.degree && <p className="text-[11.5px]" style={{ color: SUBTLE }}>{edu.degree}</p>}
                      {(edu.range.start || edu.range.end) && (
                        <DateText range={edu.range} className="text-[11px]" />
                      )}
                    </div>
                  ))}
                </div>
              </Cell>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell>
              <Cell>
                <Title>Chứng chỉ</Title>
                <div className="space-y-1.5">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item text-[11.5px]">
                      <p className="font-bold" style={{ color: INK }}>{c.name}</p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p style={{ color: SUBTLE }}>{[c.issuer, c.date].filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Cell>
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
