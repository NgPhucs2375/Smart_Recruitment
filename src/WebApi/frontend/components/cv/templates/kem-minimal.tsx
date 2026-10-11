"use client";

// Tối Giản Kem — nền kem thanh lịch, căn giữa, tối giản tuyệt đối.
// Photo tròn nhỏ, headings small-caps có gạch chân, bars 2 cột.
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const PAPER = "#f7f2e9";
const INK = "#1c1917";
const MUTED = "#78716c";
const BAR_BG = "#e7e0d3";

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-left text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

function Rule() {
  return <div className="mt-1.5 h-px w-16" style={{ backgroundColor: MUTED }} aria-hidden="true" />;
}

function LevelBar() {
  return (
    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: BAR_BG }} aria-hidden="true">
      <span className="block h-full w-3/4 rounded-full" style={{ backgroundColor: INK }} />
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function KemMinimalTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 px-10 py-8 text-left text-[12.5px] leading-relaxed" style={{ backgroundColor: PAPER, color: INK }}>
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: MUTED }}>
          {resolveBannerTitle3(data, data.title, "Curriculum Vitae")}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">
              {data.name || "Họ và tên"}
            </h1>
            {data.title && (
              <p className="mt-0.5 text-[12.5px] font-medium" style={{ color: MUTED }}>
                {data.title}
              </p>
            )}
          </div>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={data.name || "Ảnh đại diện"}
              className="size-20 shrink-0 rounded-full border border-neutral-300 object-cover"
            />
          ) : (
            <div
              className="flex size-20 shrink-0 items-center justify-center rounded-full border border-neutral-300"
              style={{ backgroundColor: BAR_BG }}
              aria-hidden="true"
            >
              <span className="text-[22px] font-bold" style={{ color: MUTED }}>
                {initials(data.name)}
              </span>
            </div>
          )}
        </div>
        {data.contacts.length > 0 && (
          <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: MUTED }}>
            {data.contacts.slice(0, 4).map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span style={{ margin: "0 0.5em" }}>·</span>}
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

      {data.summary && (
        <SectionShell section="summary">
          <div className="mt-5">
            <Caption>Tóm tắt</Caption>
            <Rule />
            <SplitBlocks text={data.summary} className="mt-2 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
          </div>
        </SectionShell>
      )}

      <div className="mt-5 grid grid-cols-2 gap-6 text-left">
        <div className="min-w-0">
          {data.experience.length > 0 && (
            <SectionShell section="experience">
              <Caption>Kinh nghiệm</Caption>
              <Rule />
              <div className="mt-2 space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <h3 className="font-bold">{job.role || "Chức danh"}</h3>
                    {job.company && (
                      <p className="text-[12px]" style={{ color: MUTED }}>
                        {job.company}
                      </p>
                    )}
                    <DateText range={job.range} className="text-[11px]" />
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>
        <div className="min-w-0">
          {data.education.length > 0 && (
            <SectionShell section="education">
              <Caption>Học vấn</Caption>
              <Rule />
              <div className="mt-2 space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <h3 className="font-bold">{edu.school || "Trường"}</h3>
                    {edu.degree && (
                      <p className="text-[12px]" style={{ color: MUTED }}>
                        {edu.degree}
                      </p>
                    )}
                    <DateText range={edu.range} className="text-[11px]" />
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.projects.length > 0 && (
            <SectionShell section="projects">
              <div className="mt-4">
                <Caption>Dự án</Caption>
                <Rule />
              </div>
              <div className="mt-2 space-y-2.5 text-left">
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
        </div>
      </div>

      {data.skills.length > 0 && (
        <SectionShell section="skills">
          <div className="mt-5">
            <Caption>Kỹ năng</Caption>
            <Rule />
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-left">
              {data.skills.map((s) => (
                <div key={s.id} className="cv-section-item">
                  <p className="text-[12px] font-semibold">• {s.name}</p>
                  <LevelBar />
                </div>
              ))}
            </div>
          </div>
        </SectionShell>
      )}

      {data.certificates.length > 0 && (
        <SectionShell section="certificates">
          <div className="mt-4">
            <Caption>Chứng chỉ</Caption>
            <Rule />
            <ul className="mt-2 space-y-1 text-left text-[12px]">
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
          </div>
        </SectionShell>
      )}
    </div>
  );
}
