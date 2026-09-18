"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Creative Portfolio — strongest visual hierarchy of the set: display
 * name, burgundy accent band, tinted project cards. For frontend /
 * designer / product candidates. HIREAI-native, ResumeData only.
 */

const ACCENT = "var(--hire-burgundy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[13px] font-bold lowercase tracking-tight" style={{ color: ACCENT }}>
      {children}
    </h2>
  );
}

export function CreativePortfolioTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-5 pt-7">
        <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: ACCENT }} />
        <h1 className="mt-3 text-[30px] font-bold leading-none tracking-tight">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1.5 text-[14px] font-medium" style={{ color: ACCENT }}>{data.title}</p>
        )}
        {data.contacts.length > 0 && (
          <p className="mt-2 text-[11.5px]" style={{ color: SUBTLE }}>
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5 text-neutral-400">/</span>}
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

      <div className="space-y-4 px-7 py-5">
        {data.summary && (
          <SectionShell>
            <p className="whitespace-pre-line text-[13px] font-medium leading-relaxed" style={{ color: INK }}>
              {data.summary}
            </p>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>dự án nổi bật</Title>
            <div className="grid grid-cols-2 gap-2.5">
              {data.projects.map((p) => (
                <div
                  key={p.id}
                  className="cv-section-item rounded-xl p-3"
                  style={{ backgroundColor: "var(--hire-ivory)" }}
                >
                  <p className="font-bold leading-snug" style={{ color: INK }}>{p.name || "Dự án"}</p>
                  {p.role && <p className="text-[11.5px] font-semibold" style={{ color: ACCENT }}>{p.role}</p>}
                  {p.description && (
                    <p className="mt-1 whitespace-pre-line text-[11.5px]" style={{ color: SUBTLE }}>
                      {p.description}
                    </p>
                  )}
                  {p.tech.length > 0 && (
                    <p className="mt-1 font-mono text-[10px]" style={{ color: SUBTLE }}>{p.tech.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>kinh nghiệm</Title>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item border-l-2 pl-3" style={{ borderColor: ACCENT }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="text-[11px]" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: ACCENT }}>{job.company}</p>
                  {job.description && (
                    <p className="mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>kỹ năng</Title>
            <SkillChips skills={data.skills} variant="soft" />
          </SectionShell>
        )}

        <div className="grid grid-cols-2 gap-4">
          {data.education.length > 0 && (
            <SectionShell>
              <Title>học vấn</Title>
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
              <Title>chứng chỉ</Title>
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
