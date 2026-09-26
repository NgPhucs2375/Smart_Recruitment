"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SkillChips, SplitBlocks } from "./shared";

/**
 * Senior Executive — generous whitespace, leadership statement first,
 * one role per visual block. For leads and managers.
 * HIREAI-native, ResumeData only.
 */

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.26em] text-neutral-500">
      {children}
    </h2>
  );
}

export function SeniorExecutiveTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-10 py-9 text-[13px] font-light leading-loose text-neutral-700">
      <header className="text-center">
        <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: "#737373" }} />
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-neutral-950">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-1 text-[14px] font-normal text-neutral-600">{data.title}</p>}
        {data.contacts.length > 0 && (
          <p className="mt-2 text-[11.5px] tracking-wide text-neutral-500">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-2 text-neutral-300">·</span>}
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-4">{c.value}</a>
                ) : (
                  <span>{c.value}</span>
                )}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="mx-auto mt-6 h-px w-16 bg-neutral-300" aria-hidden="true" />

      <div className="mt-6 space-y-6">
        {data.summary && (
          <SectionShell>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-center text-[13.5px] italic leading-relaxed text-neutral-700" />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Kinh nghiệm lãnh đạo</Title>
            <div className="space-y-5">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item text-center">
                  <h3 className="text-[14px] font-semibold text-neutral-950">{job.role || "Chức danh"}</h3>
                  <p className="mt-0.5 font-medium text-neutral-600">{job.company}</p>
                  <DateText range={job.range} className="mt-0.5 block text-[11.5px] uppercase tracking-[0.14em] text-neutral-400" />
                  {job.description && (
                    <SplitBlocks text={job.description} className="mx-auto mt-2 max-w-xl whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <Title>Học vấn</Title>
            <div className="space-y-2 text-center">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <p className="font-semibold text-neutral-900">
                    {edu.school || "Trường"}
                    {edu.degree && <span className="font-light text-neutral-600"> — {edu.degree}</span>}
                  </p>
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>Năng lực cốt lõi</Title>
            <div className="flex justify-center">
              <SkillChips skills={data.skills} variant="plain" className="text-center" />
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Dự án then chốt</Title>
            <div className="space-y-3 text-center">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <p className="font-semibold text-neutral-900">{p.name || "Dự án"}</p>
                  {p.description && <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <Title>Chứng nhận</Title>
            <p className="text-center">
              {data.certificates.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <span className="mx-2 text-neutral-300">·</span>}
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
