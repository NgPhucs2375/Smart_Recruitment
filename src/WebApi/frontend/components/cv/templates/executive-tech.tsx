"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { DateText, EmptyPaper, SectionShell } from "./shared";

/**
 * Executive Tech — professional corporate composition with structured
 * sections and letterspaced kickers, for senior candidates and leads.
 * Layout inspiration: Reactive Resume's Bronzor family (formal centered
 * header, hairline rules, measured two-part entries). HIREAI-native
 * implementation on the ResumeData contract — no upstream code reused.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";
const CHIP_BORDER = "var(--hire-chip-border)";

function ExecTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-3">
      <h2 className="shrink-0 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: NAVY }}>
        {children}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-neutral-300" />
    </div>
  );
}

export function ExecutiveTechTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 px-9 py-7 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="text-center">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em]" style={{ color: NAVY }}>
          Curriculum Vitae
        </p>
        <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: SUBTLE }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <p className="mt-2 text-[11.5px]" style={{ color: SUBTLE }}>
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span className="mx-1.5 text-neutral-400">|</span>}
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
            <ExecTitle>Hồ sơ năng lực</ExecTitle>
            <p className="whitespace-pre-line text-center italic" style={{ color: SUBTLE }}>{data.summary}</p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <ExecTitle>Kinh nghiệm làm việc</ExecTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item grid grid-cols-[1fr_auto] gap-x-4">
                  <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                  <DateText range={job.range} className="text-[11.5px] text-neutral-500" />
                  <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{job.company}</p>
                  <span />
                  {job.description && (
                    <p className="col-span-2 mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>
                      {job.description}
                    </p>
                  )}
                  {job.skills.length > 0 && (
                    <p className="col-span-2 mt-0.5 text-[11.5px]" style={{ color: SUBTLE }}>
                      {job.skills.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <ExecTitle>Học vấn</ExecTitle>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item grid grid-cols-[1fr_auto] gap-x-4">
                  <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                  <DateText range={edu.range} className="text-[11.5px] text-neutral-500" />
                  {edu.degree && (
                    <p className="font-medium" style={{ color: SUBTLE }}>{edu.degree}</p>
                  )}
                  <span />
                  {edu.description && (
                    <p className="col-span-2 mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <ExecTitle>Kỹ năng chuyên môn</ExecTitle>
            {/* Names only — no years, no proficiency suffixes. */}
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="rounded-md px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{ color: INK, border: `1px solid ${CHIP_BORDER}`, backgroundColor: "var(--hire-ivory)" }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <ExecTitle>Dự án tiêu biểu</ExecTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item grid grid-cols-[1fr_auto] gap-x-4">
                  <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                  {p.range && (p.range.start || p.range.end) ? (
                    <DateText range={p.range} className="text-[11.5px] text-neutral-500" />
                  ) : (
                    <span />
                  )}
                  {p.role && (
                    <p className="text-[12px] font-semibold" style={{ color: NAVY }}>{p.role}</p>
                  )}
                  <span />
                  {p.description && (
                    <p className="col-span-2 mt-0.5 whitespace-pre-line" style={{ color: SUBTLE }}>
                      {p.description}
                    </p>
                  )}
                  {p.tech.length > 0 && (
                    <p className="col-span-2 mt-0.5 text-[11.5px]" style={{ color: SUBTLE }}>
                      {p.tech.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <ExecTitle>Chứng chỉ</ExecTitle>
            <div className="space-y-1.5">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item grid grid-cols-[1fr_auto] gap-x-4">
                  <p className="font-bold" style={{ color: INK }}>{c.name || "Chứng chỉ"}</p>
                  {c.date ? <span className="text-[11.5px] text-neutral-500">{c.date}</span> : <span />}
                  {[c.issuer, c.code].filter(Boolean).length > 0 && (
                    <p className="col-span-2" style={{ color: SUBTLE }}>
                      {[c.issuer, c.code].filter(Boolean).join(" · ")}
                    </p>
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
