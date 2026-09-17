"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Compact Developer — one-column dense layout for fresher / junior IT.
 * Inline contact line, two-line experience rows, tightest section rhythm.
 * HIREAI-native, ResumeData only.
 */

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1.5 border-b border-neutral-300 pb-0.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-neutral-900">
      {children}
    </h2>
  );
}

export function CompactDeveloperTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-8 py-6 text-[12px] leading-snug text-neutral-800">
      <header>
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-neutral-950">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && <p className="shrink-0 text-[12px] font-semibold text-neutral-700">{data.title}</p>}
        </div>
        {data.contacts.length > 0 && (
          <p className="mt-1 text-[11px] text-neutral-600">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1 text-neutral-400">|</span>}
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">{c.value}</a>
                ) : (
                  <span>{c.value}</span>
                )}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="mt-4 space-y-3">
        {data.summary && (
          <SectionShell>
            <Title>Tóm tắt</Title>
            <p className="whitespace-pre-line">{data.summary}</p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Kinh nghiệm</Title>
            <div className="space-y-2">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <p className="font-bold text-neutral-950">
                    {job.role || "Chức danh"} <span className="font-medium text-neutral-600">— {job.company}</span>
                    <DateText range={job.range} className="float-right text-[11px] font-normal text-neutral-500" />
                  </p>
                  {job.description && <p className="mt-0.5 whitespace-pre-line">{job.description}</p>}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>Kỹ năng</Title>
            <SkillChips skills={data.skills} variant="soft" />
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Dự án</Title>
            <div className="space-y-2">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <p className="font-bold text-neutral-950">
                    {p.name || "Dự án"}
                    {p.tech.length > 0 && (
                      <span className="ml-2 font-mono text-[10.5px] font-medium text-neutral-500">
                        [{p.tech.join(", ")}]
                      </span>
                    )}
                  </p>
                  {p.description && <p className="mt-0.5 whitespace-pre-line">{p.description}</p>}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <Title>Học vấn</Title>
            <div className="space-y-1.5">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <p className="font-bold text-neutral-950">
                    {edu.school || "Trường"}
                    {edu.degree && <span className="font-medium text-neutral-600"> — {edu.degree}</span>}
                    <DateText range={edu.range} className="float-right text-[11px] font-normal text-neutral-500" />
                  </p>
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <Title>Chứng chỉ</Title>
            <p>
              {data.certificates.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                  <span className="font-medium text-neutral-800">{c.name}</span>
                  {c.issuer && <span className="text-neutral-500"> ({c.issuer})</span>}
                </span>
              ))}
            </p>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
