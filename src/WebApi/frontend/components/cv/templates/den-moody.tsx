"use client";

// Đen Moody — cột trái nền đen ảnh duotone + chữ trắng, cột phải sáng.
// Ảnh grayscale tối dần, headings nhỏ caps xám.
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const DARK = "#1c1917";
const DARK_SOFT = "#44403c";
const INK = "#292524";
const MUTED = "#78716c";
const PAPER = "#fafaf9";

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/60">
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 border-b-2 border-neutral-900 pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: INK }}>
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

export function DenMoodyTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ backgroundColor: PAPER, color: INK }}>
      <div className="grid grid-cols-[34%_66%]">
        {/* Cột đen */}
        <aside className="min-w-0" style={{ backgroundColor: DARK }}>
          {avatar ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt={data.name || "Ảnh đại diện"}
                className="aspect-[4/5] w-full object-cover grayscale"
                style={{ filter: "grayscale(1) brightness(0.72)" }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(28,25,23,0.9))" }}
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center" style={{ backgroundColor: DARK_SOFT }} aria-hidden="true">
              <span className="text-[44px] font-bold text-white/70">
                {initials(data.name)}
              </span>
            </div>
          )}
          <div className="space-y-4 p-5">
            <div>
              <h1 className="text-[22px] font-bold uppercase leading-tight tracking-wide text-white">
                {data.name || "Họ và tên"}
              </h1>
              {data.title && (
                <p className="mt-1 text-[12px] font-medium text-white/70">
                  {data.title}
                </p>
              )}
            </div>
            {data.summary && (
              <SectionShell section="summary">
                <RailTitle>Mục tiêu</RailTitle>
                <SplitBlocks text={data.summary} className="whitespace-pre-line break-words text-[11.5px] text-white/85 [overflow-wrap:anywhere]" />
              </SectionShell>
            )}
            {data.skills.length > 0 && (
              <SectionShell section="skills">
                <RailTitle>Điểm mạnh</RailTitle>
                <ul className="list-inside list-disc space-y-1 text-[11.5px] text-white/85">
                  {data.skills.slice(0, 6).map((s) => (
                    <li key={s.id} className="cv-section-item">
                      {s.name}
                    </li>
                  ))}
                </ul>
              </SectionShell>
            )}
            {data.contacts.length > 0 && (
              <div className="cv-section-item">
                <RailTitle>Liên hệ</RailTitle>
                <div className="space-y-1.5 text-[11px] text-white/85">
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
          </div>
        </aside>

        {/* Cột sáng */}
        <div className="min-w-0 space-y-4 px-6 py-6">
          {data.experience.length > 0 && (
            <SectionShell section="experience">
              <MainTitle>Quá trình làm việc</MainTitle>
              <div className="space-y-3.5">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item border-l-2 border-neutral-900 pl-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold">{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="shrink-0 text-[11px]" />
                    </div>
                    {job.company && (
                      <p className="text-[12px] font-semibold" style={{ color: MUTED }}>
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
          {data.education.length > 0 && (
            <SectionShell section="education">
              <MainTitle>Quá trình học tập</MainTitle>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold">{edu.school || "Trường"}</h3>
                      <DateText range={edu.range} className="shrink-0 text-[11px]" />
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
              <MainTitle>Dự án</MainTitle>
              <div className="space-y-2.5">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <h3 className="font-bold">{p.name || "Dự án"}</h3>
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words text-[12px] [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.skills.length > 6 && (
            <SectionShell section="skills">
              <MainTitle>Kỹ năng bổ sung</MainTitle>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.slice(6).map((s) => (
                  <span
                    key={s.id}
                    className="cv-section-item rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <MainTitle>Chứng chỉ</MainTitle>
              <ul className="list-inside list-disc space-y-1 text-[12px]">
                {data.certificates.map((c) => (
                  <li key={c.id} className="cv-section-item">
                    <span className="font-semibold">{c.name || "Chứng chỉ"}</span>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <span style={{ color: MUTED }}>
                        {" — "}
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
