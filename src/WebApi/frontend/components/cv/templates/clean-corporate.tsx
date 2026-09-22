"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Clean Corporate — restrained centered business style with hairline
 * rules and small-caps labels. For BA / PM / QA / HR.
 * HIREAI-native, ResumeData only.
 */

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
      {children}
    </h2>
  );
}

export function CleanCorporateTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-10 py-8 text-[12.5px] leading-relaxed text-neutral-800">
      <header className="border-b-2 border-neutral-900 pb-4 text-center">
        <h1 className="text-[24px] font-bold uppercase leading-tight tracking-[0.04em] text-neutral-950">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-1 text-[13px] font-medium text-neutral-600">{data.title}</p>}
        {data.contacts.length > 0 && (
          <p className="mt-1.5 text-[11.5px] text-neutral-500">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5">·</span>}
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

      <div className="mt-5 space-y-4">
        {data.summary && (
          <SectionShell>
            <Title>Hồ sơ</Title>
            <p className="whitespace-pre-line text-center">{data.summary}</p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Kinh nghiệm làm việc</Title>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item border-b border-neutral-200 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{job.role || "Chức danh"} — {job.company}</h3>
                    <DateText range={job.range} className="text-[11.5px] text-neutral-500" />
                  </div>
                  {job.description && <p className="mt-1 whitespace-pre-line">{job.description}</p>}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <Title>Học vấn</Title>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-bold text-neutral-950">
                      {edu.school || "Trường"}
                      {edu.degree && <span className="font-medium text-neutral-600">, {edu.degree}</span>}
                    </p>
                    <DateText range={edu.range} className="text-[11.5px] text-neutral-500" />
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>Kỹ năng</Title>
            <div className="flex justify-center">
              <SkillChips skills={data.skills} variant="plain" className="text-center" />
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Dự án</Title>
            <div className="space-y-2.5">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <p className="font-bold text-neutral-950">{p.name || "Dự án"}</p>
                  {p.description && <p className="mt-0.5 whitespace-pre-line">{p.description}</p>}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <Title>Chứng chỉ</Title>
            <p className="text-center">
              {data.certificates.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                  <span className="font-medium text-neutral-800">{c.name}</span>
                </span>
              ))}
            </p>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
