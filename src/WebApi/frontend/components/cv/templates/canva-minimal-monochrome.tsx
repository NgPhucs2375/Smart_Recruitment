"use client";

// Minimalist Monochrome ATS — 1 cột đen trắng tinh tế, line mảnh 1px,
// serif/sans sắc nét. Không ảnh (tối ưu tuyệt đối cho máy quét).
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";
import { safeHref } from "@/features/tao-cv/resume-data";

const INK = "#18181b";
const MUTED = "#52525b";
const HAIRLINE = "#d4d4d8";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b pb-1 text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: INK, borderColor: INK }}>
      {children}
    </h2>
  );
}

export function CanvaMinimalMonochromeTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-9 py-8 text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="text-center">
        <h1 className="font-serif text-[30px] font-bold leading-tight tracking-tight">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.14em]" style={{ color: MUTED }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <p className="mx-auto mt-2.5 max-w-[92%] border-b border-t py-2 text-[11.5px]" style={{ borderColor: HAIRLINE, color: MUTED }}>
            {data.contacts.slice(0, 5).map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span style={{ margin: "0 0.6em" }}>·</span>}
                {c.href ? (
                  <a href={c.href} className="underline underline-offset-2">
                    {c.value}
                  </a>
                ) : (
                  c.value
                )}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="mt-4 space-y-4">
        {data.summary && (
          <SectionShell section="summary">
            <Title>Tóm tắt</Title>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" />
          </SectionShell>
        )}
        {data.experience.length > 0 && (
          <SectionShell section="experience">
            <Title>Kinh nghiệm làm việc</Title>
            <div className="space-y-3.5">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[13.5px] font-bold">{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="shrink-0 font-mono text-[11px] tabular-nums" />
                  </div>
                  {job.company && (
                    <p className="font-serif text-[12.5px] font-bold italic" style={{ color: MUTED }}>
                      {job.company}
                    </p>
                  )}
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                  )}
                  {job.skills.length > 0 && (
                    <p className="mt-1 font-mono text-[11.5px]" style={{ color: MUTED }}>
                      {job.skills.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
        {data.education.length > 0 && (
          <SectionShell section="education">
            <Title>Học vấn</Title>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[13px] font-bold">{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="shrink-0 font-mono text-[11px] tabular-nums" />
                  </div>
                  {edu.degree && (
                    <p className="text-[12px]" style={{ color: MUTED }}>
                      {edu.degree}
                    </p>
                  )}
                  {edu.description && (
                    <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
        {data.projects.length > 0 && (
          <SectionShell section="projects">
            <Title>Dự án</Title>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[13px] font-bold">{p.name || "Dự án"}</h3>
                    {p.link && (
                      <a
                        href={safeHref(p.link)}
                        className="shrink-0 font-mono text-[11px] underline underline-offset-2"
                        style={{ color: MUTED }}
                      >
                        {p.link}
                      </a>
                    )}
                  </div>
                  {p.role && (
                    <p className="text-[12px]" style={{ color: MUTED }}>
                      {p.role}
                    </p>
                  )}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                  )}
                  {p.tech.length > 0 && (
                    <p className="mt-1 font-mono text-[11.5px]" style={{ color: MUTED }}>
                      {p.tech.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
        <div className="grid grid-cols-2 gap-6">
          <div className="min-w-0">
            {data.skills.length > 0 && (
              <SectionShell section="skills">
                <Title>Kỹ năng</Title>
                <ul className="space-y-1">
                  {data.skills.map((s) => (
                    <li key={s.id} className="cv-section-item text-[12.5px]">
                      — {s.name}
                    </li>
                  ))}
                </ul>
              </SectionShell>
            )}
          </div>
          <div className="min-w-0">
            {data.certificates.length > 0 && (
              <SectionShell section="certificates">
                <Title>Chứng chỉ</Title>
                <div className="space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item text-[12.5px]">
                      <p className="font-bold">{c.name || "Chứng chỉ"}</p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p style={{ color: MUTED }}>
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
