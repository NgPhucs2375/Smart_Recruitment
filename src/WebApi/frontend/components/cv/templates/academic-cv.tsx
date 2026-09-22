"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Academic CV — education-first ordering with numbered research and
 * certification entries. For researchers and academia.
 * HIREAI-native, ResumeData only.
 */

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b-2 border-neutral-900 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-950">
      {children}
    </h2>
  );
}

export function AcademicCvTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-9 py-7 text-[12.5px] leading-relaxed text-neutral-800">
      <header>
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-neutral-950">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-0.5 text-[13px] font-medium italic text-neutral-700">{data.title}</p>}
        {data.contacts.length > 0 && (
          <p className="mt-1.5 text-[11.5px] text-neutral-600">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
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
            <Title>Hồ sơ học thuật</Title>
            <p className="whitespace-pre-line">{data.summary}</p>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <Title>Học vấn</Title>
            <ol className="list-none space-y-3">
              {data.education.map((edu, n) => (
                <li key={edu.id} className="cv-section-item flex gap-3">
                  <span className="font-mono text-[11px] font-bold text-neutral-400">[{n + 1}]</span>
                  <div>
                    <p className="font-bold text-neutral-950">
                      {edu.school || "Trường"}
                      <DateText range={edu.range} className="ml-2 text-[11.5px] font-normal text-neutral-500" />
                    </p>
                    {edu.degree && <p className="italic text-neutral-700">{edu.degree}</p>}
                    {edu.description && <p className="mt-0.5 whitespace-pre-line">{edu.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <Title>Chứng chỉ & ấn phẩm</Title>
            <ol className="list-none space-y-1.5">
              {data.certificates.map((c, n) => (
                <li key={c.id} className="cv-section-item flex gap-3">
                  <span className="font-mono text-[11px] font-bold text-neutral-400">[{n + 1}]</span>
                  <p>
                    <span className="font-bold text-neutral-950">{c.name || "Chứng chỉ"}</span>
                    {[c.issuer, c.date, c.code].filter(Boolean).length > 0 && (
                      <span className="text-neutral-600"> — {[c.issuer, c.date, c.code].filter(Boolean).join(", ")}</span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Kinh nghiệm</Title>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{job.role || "Chức danh"} — {job.company}</h3>
                    <DateText range={job.range} className="text-[11.5px] text-neutral-500" />
                  </div>
                  {job.description && <p className="mt-0.5 whitespace-pre-line">{job.description}</p>}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Đề tài & dự án</Title>
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

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>Kỹ năng</Title>
            <SkillChips skills={data.skills} variant="plain" />
          </SectionShell>
        )}
      </div>
    </div>
  );
}
