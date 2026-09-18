"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Elegant Serif — restrained serif headings (Georgia/Charter stack,
 * print-safe) with a readable sans body. Premium editorial feel that
 * stays ATS-friendly. HIREAI-native, ResumeData only.
 */

const SERIF = "Georgia, 'Times New Roman', Charter, serif";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 text-[17px] font-bold leading-snug text-neutral-950"
      style={{ fontFamily: SERIF }}
    >
      {children}
    </h2>
  );
}

export function ElegantSerifTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-10 py-8 text-[12.5px] leading-relaxed text-neutral-700">
      <header className="border-b border-neutral-300 pb-5">
        <h1
          className="text-[30px] font-bold leading-tight tracking-tight text-neutral-950"
          style={{ fontFamily: SERIF }}
        >
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] italic text-neutral-600" style={{ fontFamily: SERIF }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <p className="mt-2 text-[11.5px] text-neutral-500">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5 text-neutral-300">·</span>}
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
            <p className="whitespace-pre-line border-l-2 border-neutral-300 pl-4 italic" style={{ fontFamily: SERIF }}>
              {data.summary}
            </p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Kinh nghiệm</Title>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[13px] font-bold text-neutral-900" style={{ fontFamily: SERIF }}>
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[11.5px] italic text-neutral-500" />
                  </div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                    {job.company}
                  </p>
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
                    <h3 className="text-[13px] font-bold text-neutral-900" style={{ fontFamily: SERIF }}>
                      {edu.school || "Trường"}
                    </h3>
                    <DateText range={edu.range} className="text-[11.5px] italic text-neutral-500" />
                  </div>
                  {edu.degree && <p className="italic text-neutral-600">{edu.degree}</p>}
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

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Dự án</Title>
            <div className="space-y-2.5">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <h3 className="text-[13px] font-bold text-neutral-900" style={{ fontFamily: SERIF }}>
                    {p.name || "Dự án"}
                  </h3>
                  {p.description && <p className="mt-0.5 whitespace-pre-line">{p.description}</p>}
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
                  {i > 0 && <span className="mx-1.5 text-neutral-300">·</span>}
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
