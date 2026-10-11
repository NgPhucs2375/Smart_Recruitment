"use client";

// Editorial Be — phong cách báo chí trên nền be: band tối, pills thông tin,
// sections đóng khung viền, bars kỹ năng.
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const PAPER = "#ece3d2";
const CARD = "#f7f2e7";
const INK = "#292524";
const MUTED = "#78716c";
const BAND = "#292524";
const BAR_BG = "#d6cdb8";

function BoxTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11.5px] font-bold uppercase tracking-[0.2em]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

function LevelBar() {
  return (
    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: BAR_BG }} aria-hidden="true">
      <span className="block h-full w-2/3 rounded-full" style={{ backgroundColor: INK }} />
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function BeigeEditorialTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 px-7 py-6 text-[12.5px] leading-relaxed" style={{ backgroundColor: PAPER, color: INK }}>
      {/* Band tối: RESUME + tên + avatar */}
      <div className="flex items-center gap-5 rounded-xl px-6 py-5 text-white" style={{ backgroundColor: BAND }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={data.name || "Ảnh đại diện"}
            className="size-20 shrink-0 rounded-full border-2 border-white/40 object-cover"
          />
        ) : (
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/10"
            aria-hidden="true"
          >
            <span className="text-[22px] font-bold text-white">
              {initials(data.name)}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.3em] text-white/70">
            {resolveBannerTitle3(data, undefined, "Resume")}
          </p>
          <h1 className="mt-0.5 font-serif text-[28px] font-bold leading-tight">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-0.5 text-[12.5px] font-medium text-white/80">
              {data.title}
            </p>
          )}
        </div>
      </div>

      {/* Pills thông tin */}
      {data.contacts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.contacts.slice(0, 6).map((c, i) => (
            <span
              key={`${c.label}-${i}`}
              className="cv-section-item min-w-0 max-w-full break-all rounded-full border px-2.5 py-1 text-[11px] font-medium [overflow-wrap:anywhere]"
              style={{ backgroundColor: CARD, borderColor: BAR_BG, color: INK }}
            >
              {c.href ? (
                <a href={c.href} className="break-all underline underline-offset-2">
                  {c.value}
                </a>
              ) : (
                c.value
              )}
            </span>
          ))}
        </div>
      )}

      {data.summary && (
        <SectionShell section="summary">
          <div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BAR_BG }}>
            <BoxTitle>Tóm tắt</BoxTitle>
            <SplitBlocks text={data.summary} className="mt-1.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
          </div>
        </SectionShell>
      )}

      {data.skills.length > 0 && (
        <SectionShell section="skills">
          <div className="mt-3 rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BAR_BG }}>
            <BoxTitle>Kỹ năng</BoxTitle>
            <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2">
              {data.skills.map((s) => (
                <div key={s.id} className="cv-section-item">
                  <p className="text-[12px] font-semibold">{s.name}</p>
                  <LevelBar />
                </div>
              ))}
            </div>
          </div>
        </SectionShell>
      )}

      {data.experience.length > 0 && (
        <SectionShell section="experience">
          <div className="mt-3 rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BAR_BG }}>
            <BoxTitle>Kinh nghiệm làm việc</BoxTitle>
            <div className="mt-2 space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold uppercase">{job.role || "Chức danh"}</h3>
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
          </div>
        </SectionShell>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="min-w-0">
          {data.education.length > 0 && (
            <SectionShell section="education">
              <div className="rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BAR_BG }}>
                <BoxTitle>Học vấn</BoxTitle>
                <div className="mt-2 space-y-2.5">
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
              </div>
            </SectionShell>
          )}
        </div>
        <div className="min-w-0">
          {data.projects.length > 0 && (
            <SectionShell section="projects">
              <div className="rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BAR_BG }}>
                <BoxTitle>Dự án</BoxTitle>
                <div className="mt-2 space-y-2.5">
                  {data.projects.map((p) => (
                    <div key={p.id} className="cv-section-item">
                      <h3 className="font-bold">{p.name || "Dự án"}</h3>
                      {p.description && (
                        <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words text-[12px] [overflow-wrap:anywhere]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <div className="mt-3 rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BAR_BG }}>
                <BoxTitle>Chứng chỉ</BoxTitle>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[12px]">
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
      </div>
    </div>
  );
}
