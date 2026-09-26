"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

/**
 * ATS Classic — single-column, compact, decoration-free layout for
 * Backend / DevOps / Data candidates.
 * Layout inspiration: Reactive Resume's Onyx family (centered header,
 * ruled section titles, single-column flow). HIREAI-native implementation
 * on the ResumeData contract — no upstream code reused.
 */

function ClassicTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 border-b border-neutral-300 pb-1 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900"
    >
      {children}
    </h2>
  );
}

export function AtsClassicTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-9 py-7 text-[12.5px] leading-relaxed text-neutral-800">
      <header className="text-center">
        <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: "#737373" }} />
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-neutral-950">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-0.5 text-[13px] font-semibold text-neutral-700">{data.title}</p>}
        {data.contacts.length > 0 && (
          <p className="mt-1.5 text-[11.5px] text-neutral-600">
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

      <div className="mt-5 space-y-4">
        {data.summary && (
          <SectionShell>
            <ClassicTitle>Tóm tắt</ClassicTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-center" />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <ClassicTitle>Kinh nghiệm làm việc</ClassicTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="text-[11.5px] text-neutral-500" />
                  </div>
                  <p className="font-medium text-neutral-700">{job.company}</p>
                  {job.description && <SplitBlocks text={job.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />}
                  {job.skills.length > 0 && (
                    <p className="mt-0.5 text-[11.5px] text-neutral-600">{job.skills.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <ClassicTitle>Học vấn</ClassicTitle>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="text-[11.5px] text-neutral-500" />
                  </div>
                  {edu.degree && <p className="font-medium text-neutral-700">{edu.degree}</p>}
                  {edu.description && <SplitBlocks text={edu.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <ClassicTitle>Kỹ năng</ClassicTitle>
            {/* Names only — no years, no proficiency suffixes. */}
            <p className="text-center leading-loose">
              {data.skills.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                  <span className="font-medium text-neutral-800">{s.name}</span>
                </span>
              ))}
            </p>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <ClassicTitle>Dự án</ClassicTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-neutral-950">{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11.5px] text-neutral-500" />
                    )}
                  </div>
                  {p.role && <p className="font-medium text-neutral-700">{p.role}</p>}
                  {p.description && <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />}
                  {p.tech.length > 0 && (
                    <p className="mt-0.5 text-[11.5px] text-neutral-600">{p.tech.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <ClassicTitle>Chứng chỉ</ClassicTitle>
            <div className="space-y-1.5">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <p className="font-bold text-neutral-950">
                    {c.name || "Chứng chỉ"}
                    {c.date && <span className="ml-2 font-normal text-neutral-500">· {c.date}</span>}
                  </p>
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
