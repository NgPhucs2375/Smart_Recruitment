"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell } from "./shared";

/**
 * Minimal ATS — single column, black/charcoal on white, no graphics,
 * no icons, no progress bars, no multi-column content. Content flows
 * naturally across pages when printing.
 */

function AtsTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">
      {children}
    </h2>
  );
}

export function MinimalAtsTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-10 py-9 text-[13px] leading-relaxed text-neutral-800">
      {/* Header */}
      <header>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-neutral-950">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-1 text-[14px] font-medium text-neutral-700">{data.title}</p>}
        {data.contacts.length > 0 && (
          <p className="mt-2 text-[12px] text-neutral-600">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">
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

      <div className="mt-6 space-y-5">
        {data.summary && (
          <SectionShell>
            <AtsTitle>Tóm tắt</AtsTitle>
            <p className="whitespace-pre-line">{data.summary}</p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <AtsTitle>Kinh nghiệm làm việc</AtsTitle>
            <div className="space-y-4">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="text-[12px] text-neutral-500" />
                  </div>
                  <p className="font-medium text-neutral-700">{job.company}</p>
                  {job.description && <p className="mt-1 whitespace-pre-line">{job.description}</p>}
                  {job.skills.length > 0 && (
                    <p className="mt-1 text-[12px] text-neutral-600">Kỹ năng: {job.skills.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <AtsTitle>Học vấn</AtsTitle>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="text-[12px] text-neutral-500" />
                  </div>
                  {edu.degree && <p className="font-medium text-neutral-700">{edu.degree}</p>}
                  {edu.description && <p className="mt-1 whitespace-pre-line">{edu.description}</p>}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <AtsTitle>Kỹ năng</AtsTitle>
            <p>
              {data.skills.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                  <span className="font-medium text-neutral-800">{s.name}</span>
                  {s.detail && <span className="text-neutral-600"> ({s.detail})</span>}
                </span>
              ))}
            </p>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <AtsTitle>Dự án</AtsTitle>
            <div className="space-y-4">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{p.name || "Dự án"}</h3>
                    {p.link && (
                      <a href={p.link.startsWith("http") ? p.link : `https://${p.link}`} className="text-[12px] text-neutral-500 underline decoration-neutral-300 underline-offset-2">
                        {p.link}
                      </a>
                    )}
                  </div>
                  {p.role && <p className="font-medium text-neutral-700">{p.role}</p>}
                  {p.range && (p.range.start || p.range.end) && (
                    <DateText range={p.range} className="text-[12px] text-neutral-500" />
                  )}
                  {p.description && <p className="mt-1 whitespace-pre-line">{p.description}</p>}
                  {p.tech.length > 0 && (
                    <p className="mt-1 text-[12px] text-neutral-600">Công nghệ: {p.tech.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <AtsTitle>Chứng chỉ</AtsTitle>
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{c.name || "Chứng chỉ"}</h3>
                    {c.date && <span className="text-[12px] text-neutral-500">{c.date}</span>}
                  </div>
                  {[c.issuer, c.code].filter(Boolean).length > 0 && (
                    <p className="text-neutral-600">{[c.issuer, c.code].filter(Boolean).join(" · ")}</p>
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
