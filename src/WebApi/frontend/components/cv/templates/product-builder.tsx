"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Product Builder — project-first ordering with bold outcome lead lines.
 * For PM / product / freelance candidates selling impact.
 * HIREAI-native, ResumeData only.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 inline-block rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white"
      style={{ backgroundColor: NAVY }}
    >
      {children}
    </h2>
  );
}

export function ProductBuilderTemplate({ data }: { data: ResumeData }) {
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
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13.5px] font-semibold" style={{ color: NAVY }}>{data.title}</p>
        )}
        {data.contacts.length > 0 && (
          <p className="mt-1.5 text-[11.5px]" style={{ color: SUBTLE }}>
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
        {data.summary && (
          <p className="mt-3 whitespace-pre-line border-l-2 pl-3 italic" style={{ borderColor: NAVY, color: SUBTLE }}>
            {data.summary}
          </p>
        )}
      </header>

      <div className="space-y-4 px-7 py-5" style={{ borderTop: "1px solid var(--hire-line)" }}>
        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Kết quả sản phẩm</Title>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[13px] font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11px]" />
                    )}
                  </div>
                  {p.role && (
                    <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{p.role}</p>
                  )}
                  {p.description && (
                    <p className="mt-1 whitespace-pre-line" style={{ color: SUBTLE }}>{p.description}</p>
                  )}
                  {p.tech.length > 0 && (
                    <p className="mt-1 text-[11px] font-medium" style={{ color: SUBTLE }}>
                      Đóng góp: {p.tech.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Kinh nghiệm</Title>
            <div className="space-y-2.5">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item flex items-baseline justify-between gap-3">
                  <p>
                    <span className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</span>
                    <span style={{ color: SUBTLE }}> — {job.company}</span>
                  </p>
                  <DateText range={job.range} className="shrink-0 text-[11px]" />
                </div>
              ))}
              {data.experience.some((j) => j.description) && (
                <div className="space-y-2 pt-1">
                  {data.experience.filter((j) => j.description).map((job) => (
                    <p key={`${job.id}-d`} className="whitespace-pre-line text-[12px]" style={{ color: SUBTLE }}>
                      <span className="font-semibold" style={{ color: INK }}>{job.role}: </span>
                      {job.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </SectionShell>
        )}

        <div className="grid grid-cols-2 gap-4">
          {data.skills.length > 0 && (
            <SectionShell>
              <Title>Kỹ năng</Title>
              <SkillChips skills={data.skills} variant="soft" />
            </SectionShell>
          )}
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
        </div>

        {data.certificates.length > 0 && (
          <SectionShell>
            <Title>Chứng chỉ</Title>
            <p>
              {data.certificates.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                  <span className="font-medium" style={{ color: INK }}>{c.name}</span>
                </span>
              ))}
            </p>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
