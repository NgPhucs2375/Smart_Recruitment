"use client";

import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const INK = "#111111";
const MUTED = "#9ca3af";

function ZenTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-center text-[10px] font-medium uppercase" style={{ color: MUTED, letterSpacing: "0.3em" }}>
      {children}
    </h2>
  );
}

function Hairline() {
  return <div className="mx-auto my-8 h-px w-full" style={{ backgroundColor: MUTED, opacity: 0.4 }} />;
}

export function ZenMinimalTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-12 py-12 text-[13px] leading-loose" style={{ color: INK }}>
      <header className="pb-2 text-center">
        <h1 className="text-[28px] font-normal leading-tight" style={{ color: INK, letterSpacing: "0.02em" }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-3 text-[12px] font-normal uppercase" style={{ color: MUTED, letterSpacing: "0.3em" }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p key={`${c.label}-${i}`} className="cv-section-item text-[12px]" style={{ color: MUTED }}>
                {c.value}
              </p>
            ))}
          </div>
        )}
      </header>

      <Hairline />

      <div className="space-y-10">
        {data.summary && (
          <SectionShell>
            <ZenTitle>Tóm tắt</ZenTitle>
            <p className="mx-auto max-w-[58ch] whitespace-pre-line text-center text-[13px] italic" style={{ color: INK }}>
              {data.summary}
            </p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <ZenTitle>Kinh nghiệm</ZenTitle>
            <div className="space-y-8">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item text-center">
                  <h3 className="font-medium" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                  <p className="mt-1 text-[12px]" style={{ color: MUTED }}>{job.company}</p>
                  <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                    <DateText range={job.range} />
                  </p>
                  {job.description && (
                    <p className="mx-auto mt-3 max-w-[58ch] whitespace-pre-line text-[13px]" style={{ color: INK }}>
                      {job.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <ZenTitle>Kỹ năng</ZenTitle>
            <p className="text-center text-[13px] leading-loose" style={{ color: INK }}>
              {data.skills.map((s, i) => (
                <span key={s.id} className="cv-section-item">
                  {i > 0 && <span className="mx-3" style={{ color: MUTED }}>·</span>}
                  {s.name}
                </span>
              ))}
            </p>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <ZenTitle>Dự án</ZenTitle>
            <div className="space-y-8">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item text-center">
                  <h3 className="font-medium" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                  {p.role && <p className="mt-1 text-[12px]" style={{ color: MUTED }}>{p.role}</p>}
                  {p.range && (p.range.start || p.range.end) && (
                    <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                      <DateText range={p.range} />
                    </p>
                  )}
                  {p.description && (
                    <p className="mx-auto mt-3 max-w-[58ch] whitespace-pre-line text-[13px]" style={{ color: INK }}>
                      {p.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <ZenTitle>Học vấn</ZenTitle>
            <div className="space-y-8">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item text-center">
                  <h3 className="font-medium" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                  {edu.degree && <p className="mt-1 text-[12px]" style={{ color: MUTED }}>{edu.degree}</p>}
                  <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                    <DateText range={edu.range} />
                  </p>
                  {edu.description && (
                    <p className="mx-auto mt-3 max-w-[58ch] whitespace-pre-line text-[13px]" style={{ color: INK }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <ZenTitle>Chứng chỉ</ZenTitle>
            <div className="space-y-4">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item text-center">
                  <p className="text-[12px] font-medium" style={{ color: INK }}>{c.name || "Chứng chỉ"}</p>
                  {[c.issuer, c.date].filter(Boolean).length > 0 && (
                    <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                      {[c.issuer, c.date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
      </div>

      <Hairline />
    </div>
  );
}
