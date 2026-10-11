"use client";

// Darkroom Creative — sidebar than chì đậm chữ trắng, dải chữ dọc mép giấy,
// main sáng thoáng. Tương phản mạnh nhưng tiết chế, không màu chóe.
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";
import { safeHref } from "@/features/tao-cv/resume-data";

const CHARCOAL = "#1c1917";
const INK = "#292524";
const MUTED = "#78716c";
const HAIRLINE = "#e7e5e4";

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 border-b-2 pb-1.5 text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: INK, borderColor: INK }}>
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

export function CanvaDarkroomCreativeTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 relative bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      {/* Dải chữ dọc mép phải */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold uppercase"
        style={{ writingMode: "vertical-rl", letterSpacing: "0.35em", color: MUTED, opacity: 0.6 }}
      >
        Creative Portfolio — {new Date().getFullYear()}
      </div>

      <div className="grid grid-cols-[32%_68%]">
        {/* Rail than chì */}
        <aside className="min-w-0 px-5 py-6 text-white" style={{ backgroundColor: CHARCOAL }}>
          <div className="flex flex-col items-center text-center">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={data.name || "Ảnh đại diện"}
                className="size-24 rounded-full object-cover grayscale"
              />
            ) : (
              <div
                className="flex size-24 items-center justify-center rounded-full border border-white/30 bg-white/10"
                aria-hidden="true"
              >
                <span className="text-[24px] font-bold text-white">
                  {initials(data.name)}
                </span>
              </div>
            )}
            <h1 className="mt-2.5 text-[19px] font-bold uppercase leading-tight tracking-wide text-white">
              {data.name || "Họ và tên"}
            </h1>
            {data.title && (
              <p className="mt-0.5 text-[12px] font-medium text-white/70">
                {data.title}
              </p>
            )}
          </div>

          {data.contacts.length > 0 && (
            <div className="cv-section-item mt-4">
              <RailTitle>Liên hệ</RailTitle>
              <div className="space-y-1.5 text-left text-[11px] text-white/85">
                {data.contacts.map((c, i) => (
                  <p key={`${c.label}-${i}`} className="break-all">
                    <span className="font-semibold text-white">{c.label}: </span>
                    {c.href ? (
                      <a href={c.href} className="underline underline-offset-2">
                        {c.value}
                      </a>
                    ) : (
                      c.value
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {data.skills.length > 0 && (
            <SectionShell section="skills">
              <div className="mt-4">
                <RailTitle>Kỹ năng</RailTitle>
                <ul className="space-y-1 text-left text-[12px] font-medium text-white/90">
                  {data.skills.map((s) => (
                    <li key={s.id} className="cv-section-item border-b border-dashed border-white/20 pb-1">
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionShell>
          )}

          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <div className="mt-4">
                <RailTitle>Chứng chỉ</RailTitle>
                <div className="space-y-2 text-left">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item text-[11.5px] text-white/85">
                      <p className="font-bold text-white">{c.name || "Chứng chỉ"}</p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p>{[c.issuer, c.date].filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
        </aside>

        {/* Main sáng */}
        <div className="min-w-0 space-y-4 px-7 py-6">
          {data.summary && (
            <SectionShell section="summary">
              <MainTitle>Tóm tắt</MainTitle>
              <SplitBlocks text={data.summary} className="font-serif italic whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
            </SectionShell>
          )}
          {data.experience.length > 0 && (
            <SectionShell section="experience">
              <MainTitle>Kinh nghiệm làm việc</MainTitle>
              <div className="space-y-3.5">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item border-l-2 pl-3" style={{ borderColor: CHARCOAL }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[13.5px] font-bold">{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="shrink-0 font-mono text-[11px] tabular-nums" />
                    </div>
                    {job.company && (
                      <p className="text-[12.5px] font-semibold" style={{ color: MUTED }}>
                        {job.company}
                      </p>
                    )}
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.projects.length > 0 && (
            <SectionShell section="projects">
              <MainTitle>Dự án</MainTitle>
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
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.education.length > 0 && (
            <SectionShell section="education">
              <MainTitle>Học vấn</MainTitle>
              <div className="space-y-2.5">
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
