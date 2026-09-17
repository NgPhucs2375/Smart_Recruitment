"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell, SkillChips } from "./shared";

/**
 * Data Specialist — stack strip directly under the header, project-led
 * body with mono tech tags. For Data / AI / ML candidates.
 * HIREAI-native, ResumeData only.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: NAVY }}>
      <span style={{ color: SUBTLE }}>{"// "}</span>
      {children}
    </h2>
  );
}

export function DataSpecialistTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  const stack = [...new Set([...data.skills.map((s) => s.name), ...data.projects.flatMap((p) => p.tech)])];

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-4 pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="shrink-0 font-mono text-[11.5px] font-bold" style={{ color: NAVY }}>{data.title}</p>
          )}
        </div>
        {data.contacts.length > 0 && (
          <p className="mt-1 font-mono text-[11px]" style={{ color: SUBTLE }}>
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5">|</span>}
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">{c.value}</a>
                ) : (
                  <span>{c.value}</span>
                )}
              </span>
            ))}
          </p>
        )}
        {stack.length > 0 && (
          <div className="cv-section-item mt-3 flex flex-wrap gap-1">
            {stack.slice(0, 14).map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="rounded px-1.5 py-0.5 font-mono text-[10.5px] font-medium"
                style={{ backgroundColor: "var(--hire-navy-soft)", color: NAVY }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-4 px-7 py-5" style={{ borderTop: "1px solid var(--hire-line)" }}>
        {data.summary && (
          <SectionShell>
            <Title>profile</Title>
            <p className="whitespace-pre-line" style={{ color: SUBTLE }}>{data.summary}</p>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>selected_work</Title>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="font-mono text-[11px]" />
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>{p.description}</p>
                  )}
                  {p.tech.length > 0 && (
                    <p className="mt-0.5 font-mono text-[10.5px]" style={{ color: NAVY }}>
                      {"stack: "}{p.tech.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>experience</Title>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>
                      {job.role || "Chức danh"} <span className="font-medium" style={{ color: NAVY }}>@ {job.company}</span>
                    </h3>
                    <DateText range={job.range} className="font-mono text-[11px]" />
                  </div>
                  {job.description && (
                    <p className="mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        <div className="grid grid-cols-2 gap-4">
          {data.education.length > 0 && (
            <SectionShell>
              <Title>education</Title>
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
              <Title>certs</Title>
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

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>skills</Title>
            <SkillChips skills={data.skills} variant="outline" />
          </SectionShell>
        )}
      </div>
    </div>
  );
}
