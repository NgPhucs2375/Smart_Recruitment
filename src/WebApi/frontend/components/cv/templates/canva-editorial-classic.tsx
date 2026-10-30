"use client";

// Editorial Classic — serif sang trọng, phân cách bằng khoảng trắng vàng
// (whitespace + hairlines). Không khung hộp, không màu mè.
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const INK = "#292524";
const MUTED = "#78716c";
const HAIRLINE = "#d6d3d1";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[17px] font-bold tracking-tight" style={{ color: INK }}>
      {children}
    </h2>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CanvaEditorialClassicTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-10 py-9 text-[13px] leading-[1.75]" style={{ color: INK }}>
      <header className="flex items-center gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em]" style={{ color: MUTED }}>
            {resolveBannerTitle3(data, data.title, "Curriculum Vitae")}
          </p>
          <h1 className="mt-1 font-serif text-[32px] font-bold leading-tight">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-1 font-serif text-[14px] italic" style={{ color: MUTED }}>
              {data.title}
            </p>
          )}
        </div>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={data.name || "Ảnh đại diện"}
            className="size-24 shrink-0 rounded-full border object-cover"
            style={{ borderColor: HAIRLINE }}
          />
        ) : (
          <div
            className="flex size-24 shrink-0 items-center justify-center rounded-full border bg-stone-50"
            style={{ borderColor: HAIRLINE }}
            aria-hidden="true"
          >
            <span className="font-serif text-[24px] font-bold" style={{ color: MUTED }}>
              {initials(data.name)}
            </span>
          </div>
        )}
      </header>

      {data.contacts.length > 0 && (
        <p className="mt-3 border-b border-t py-2.5 text-center text-[11.5px]" style={{ borderColor: HAIRLINE, color: MUTED }}>
          {data.contacts.slice(0, 5).map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {i > 0 && <span style={{ margin: "0 0.7em" }}>·</span>}
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

      <div className="mt-6 space-y-7">
        {data.summary && (
          <SectionShell section="summary">
            <Title>Tóm tắt</Title>
            <div className="mt-2 h-px w-12" style={{ backgroundColor: INK }} aria-hidden="true" />
            <SplitBlocks text={data.summary} className="mt-2.5 font-serif text-[13.5px] italic whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
          </SectionShell>
        )}
        {data.experience.length > 0 && (
          <SectionShell section="experience">
            <Title>Kinh nghiệm</Title>
            <div className="mb-3 mt-2 h-px w-12" style={{ backgroundColor: INK }} aria-hidden="true" />
            <div className="space-y-5">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-[15px] font-bold">{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="shrink-0 font-mono text-[11px] tabular-nums" />
                  </div>
                  {job.company && (
                    <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                      {job.company}
                    </p>
                  )}
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
        <div className="grid grid-cols-2 gap-8">
          <div className="min-w-0">
            {data.education.length > 0 && (
              <SectionShell section="education">
                <Title>Học vấn</Title>
                <div className="mb-2.5 mt-2 h-px w-12" style={{ backgroundColor: INK }} aria-hidden="true" />
                <div className="space-y-3.5">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="cv-section-item">
                      <h3 className="font-serif text-[14px] font-bold">{edu.school || "Trường"}</h3>
                      {edu.degree && (
                        <p className="text-[12px]" style={{ color: MUTED }}>
                          {edu.degree}
                        </p>
                      )}
                      <DateText range={edu.range} className="font-mono text-[11px] tabular-nums" />
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}
            {data.projects.length > 0 && (
              <SectionShell section="projects">
                <div className="mt-7">
                  <Title>Dự án</Title>
                  <div className="mb-2.5 mt-2 h-px w-12" style={{ backgroundColor: INK }} aria-hidden="true" />
                  <div className="space-y-3">
                    {data.projects.map((p) => (
                      <div key={p.id} className="cv-section-item">
                        <h3 className="font-serif text-[14px] font-bold">{p.name || "Dự án"}</h3>
                        {p.description && (
                          <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </SectionShell>
            )}
          </div>
          <div className="min-w-0">
            {data.skills.length > 0 && (
              <SectionShell section="skills">
                <Title>Kỹ năng</Title>
                <div className="mb-2.5 mt-2 h-px w-12" style={{ backgroundColor: INK }} aria-hidden="true" />
                <ul className="space-y-1.5">
                  {data.skills.map((s) => (
                    <li key={s.id} className="cv-section-item border-b border-dotted pb-1.5 text-[12.5px]" style={{ borderColor: HAIRLINE }}>
                      {s.name}
                    </li>
                  ))}
                </ul>
              </SectionShell>
            )}
            {data.certificates.length > 0 && (
              <SectionShell section="certificates">
                <div className="mt-7">
                  <Title>Chứng chỉ</Title>
                  <div className="mb-2.5 mt-2 h-px w-12" style={{ backgroundColor: INK }} aria-hidden="true" />
                  <div className="space-y-2.5">
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
                </div>
              </SectionShell>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
