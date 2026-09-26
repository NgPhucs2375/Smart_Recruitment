"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

/**
 * Startup Modern — high-energy compact layout: oversized name, pill
 * section labels on tint, two-column skills grid. Still professional.
 * HIREAI-native, ResumeData only.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 w-fit rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em]"
      style={{ backgroundColor: "var(--hire-navy-soft)", color: NAVY }}
    >
      {children}
    </h2>
  );
}

export function StartupModernTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-4 pt-6">
        <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: SUBTLE }} />
        <h1 className="text-[30px] font-bold leading-none tracking-tighter">
          {data.name || "Họ và tên"}
          <span aria-hidden="true" style={{ color: NAVY }}>.</span>
        </h1>
        {data.title && (
          <p className="mt-1.5 text-[13.5px] font-semibold" style={{ color: NAVY }}>{data.title}</p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.contacts.map((c, i) => (
              <span
                key={`${c.label}-${i}`}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: "var(--hire-ivory)", color: SUBTLE }}
              >
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">{c.value}</a>
                ) : (
                  c.value
                )}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-4 px-7 py-5" style={{ borderTop: "3px solid var(--hire-navy)" }}>
        {data.summary && (
          <SectionShell>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px] font-medium" style={{ color: INK }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Kinh nghiệm</Title>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item rounded-xl p-3" style={{ border: "1px solid var(--hire-line)" }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{job.company}</p>
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>Stack</Title>
            <div className="grid grid-cols-2 gap-1.5">
              {data.skills.map((s) => (
                <p key={s.id} className="min-w-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold" style={{ backgroundColor: "var(--hire-navy-soft)", color: NAVY }}>
                  {s.name}
                </p>
              ))}
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Dự án</Title>
            <div className="space-y-2.5">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.tech.length > 0 && (
                      <p className="font-mono text-[10.5px]" style={{ color: NAVY }}>{p.tech.join(" · ")}</p>
                    )}
                  </div>
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        <div className="grid grid-cols-2 gap-4">
          {data.education.length > 0 && (
            <SectionShell>
              <Title>Học vấn</Title>
              <div className="space-y-2">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <p className="text-[12px] font-bold leading-snug" style={{ color: INK }}>{edu.school}</p>
                    {edu.degree && <p className="text-[11.5px]" style={{ color: SUBTLE }}>{edu.degree}</p>}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell>
              <Title>Chứng chỉ</Title>
              <div className="space-y-1.5">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item text-[11.5px]">
                    <p className="font-bold" style={{ color: INK }}>{c.name}</p>
                    {c.issuer && <p style={{ color: SUBTLE }}>{c.issuer}</p>}
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
