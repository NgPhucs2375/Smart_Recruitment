"use client";

import type { ResumeData } from "@/features/tao-cv/resume-data";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SkillChips, SplitBlocks } from "./shared";

/**
 * DevOps Stack — left date-rail timeline, tool-group blocks and a
 * certification band. For DevOps / infrastructure candidates.
 * HIREAI-native, ResumeData only.
 */

const NAVY = "var(--hire-navy)";
const INK = "var(--hire-ink)";
const SUBTLE = "var(--hire-subtle)";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

function DateRail({ start, end }: { start: string; end: string }) {
  if (!start && !end) return null;
  return (
    <p className="pt-0.5 font-mono text-[10.5px] leading-snug" style={{ color: NAVY }}>
      {start || "?"}
      <br />
      <span style={{ color: SUBTLE }}>│</span>
      <br />
      {end || "?"}
    </p>
  );
}

export function DevopsStackTemplate({ data }: { data: ResumeData }) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ color: INK }}>
      <header className="flex items-center justify-between gap-4 px-7 pb-4 pt-6" style={{ backgroundColor: "var(--hire-ivory)" }}>
        <BannerSlot data={data} className="mb-1 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: NAVY }} />
        <div>
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-0.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: NAVY }}>
              {data.title}
            </p>
          )}
        </div>
        {data.contacts.length > 0 && (
          <div className="min-w-0 shrink-0 space-y-1 text-right">
            {data.contacts.slice(0, 4).map((c, i) => (
              <p key={`${c.label}-${i}`} className="font-mono text-[10.5px]" style={{ color: SUBTLE }}>
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">{c.value}</a>
                ) : (
                  c.value
                )}
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-4 px-7 py-5">
        {data.summary && (
          <SectionShell>
            <Title>Mục tiêu</Title>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Title>Hạ tầng & vận hành</Title>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item grid grid-cols-[64px_1fr] gap-3">
                  <DateRail start={job.range.start} end={job.range.end} />
                  <div>
                    <p className="font-bold" style={{ color: INK }}>
                      {job.role || "Chức danh"} <span style={{ color: NAVY }}>· {job.company}</span>
                    </p>
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                    )}
                    {job.skills.length > 0 && (
                      <p className="mt-0.5 font-mono text-[10.5px]" style={{ color: SUBTLE }}>
                        {job.skills.join(" / ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <Title>Công cụ & nền tảng</Title>
            <SkillChips skills={data.skills} variant="outline" />
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Title>Triển khai tiêu biểu</Title>
            <div className="space-y-2.5">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item grid grid-cols-[64px_1fr] gap-3">
                  <DateRail start={p.range?.start ?? ""} end={p.range?.end ?? ""} />
                  <div>
                    <p className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</p>
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: SUBTLE }} />
                    )}
                    {p.tech.length > 0 && (
                      <p className="mt-0.5 font-mono text-[10.5px]" style={{ color: NAVY }}>
                        {p.tech.join(" / ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        <div className="grid grid-cols-2 gap-4">
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
          {data.certificates.length > 0 && (
            <SectionShell>
              <Title>Chứng chỉ</Title>
              <div className="space-y-1.5">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item text-[11.5px]">
                    <p className="font-bold" style={{ color: NAVY }}>{c.name}</p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p style={{ color: SUBTLE }}>{[c.issuer, c.date].filter(Boolean).join(" · ")}</p>
                    )}
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
