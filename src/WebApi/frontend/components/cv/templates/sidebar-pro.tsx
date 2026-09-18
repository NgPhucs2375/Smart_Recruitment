"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Sidebar Pro — mirrored two-column layout with the rail on the RIGHT
 * and skills pinned at the top of the rail. Skill-forward IT generalist.
 * HIREAI-native, ResumeData only.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em]" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.14em]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

export function SidebarProTemplate({ data }: { data: ResumeData }) {
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
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: NAVY }}>
          {data.title || "Curriculum Vitae"}
        </p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight">
          {data.name || "Họ và tên"}
        </h1>
      </header>

      <div className="grid grid-cols-[70%_30%]">
        <div className="space-y-4 px-7 py-5">
          {data.summary && (
            <SectionShell>
              <MainTitle>Giới thiệu</MainTitle>
              <p className="whitespace-pre-line" style={{ color: SUBTLE }}>{data.summary}</p>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <MainTitle>Kinh nghiệm</MainTitle>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="text-[11px]" />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{job.company}</p>
                    {job.description && (
                      <p className="mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>{job.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.projects.length > 0 && (
            <SectionShell>
              <MainTitle>Dự án</MainTitle>
              <div className="space-y-2.5">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <p className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</p>
                    {p.description && (
                      <p className="mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>{p.description}</p>
                    )}
                    {p.tech.length > 0 && (
                      <p className="mt-0.5 font-mono text-[10.5px]" style={{ color: NAVY }}>
                        {p.tech.join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.education.length > 0 && (
            <SectionShell>
              <MainTitle>Học vấn</MainTitle>
              <div className="space-y-2">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <p className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</p>
                    {edu.degree && <p style={{ color: SUBTLE }}>{edu.degree}</p>}
                    {(edu.range.start || edu.range.end) && (
                      <DateText range={edu.range} className="text-[11px]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>

        <aside className="px-5 py-5" style={{ backgroundColor: "var(--hire-navy-soft)" }}>
          <div className="space-y-4">
            {data.skills.length > 0 && (
              <div className="cv-section-item">
                <RailTitle>Kỹ năng chính</RailTitle>
                <SkillChips skills={data.skills} variant="outline" />
              </div>
            )}

            {data.contacts.length > 0 && (
              <div className="cv-section-item">
                <RailTitle>Liên hệ</RailTitle>
                <div className="space-y-1.5">
                  {data.contacts.map((c, i) => (
                    <p key={`${c.label}-${i}`} className="break-all text-[11.5px] leading-snug" style={{ color: SUBTLE }}>
                      {c.href ? (
                        <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">{c.value}</a>
                      ) : (
                        c.value
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {data.certificates.length > 0 && (
              <div className="cv-section-item">
                <RailTitle>Chứng chỉ</RailTitle>
                <div className="space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.id}>
                      <p className="text-[11.5px] font-bold leading-snug" style={{ color: INK }}>{c.name}</p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p className="text-[11px]" style={{ color: SUBTLE }}>
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
