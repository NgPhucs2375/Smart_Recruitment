"use client";

// Portfolio Đơn Sắc — đen trắng tối giản kiểu portfolio cá nhân.
// Ảnh grayscale + markers // + bars + khung boxes. Không màu mè.
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const INK = "#111111";
const MUTED = "#6b7280";
const LINE = "#d1d5db";

function Marker({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 font-mono text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: INK }}>
      <span style={{ color: MUTED }}>{"// "}</span>
      {children}
    </h2>
  );
}

function Bar({ level }: { level?: number }) {
  // level 0..3 (mặc định 2) — thanh đen đặc trên nền xám.
  const v = Math.max(0, Math.min(3, level ?? 2));
  return (
    <span className="mt-1 flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-10"
          style={{ backgroundColor: i < v ? INK : LINE }}
        />
      ))}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MonoPortfolioTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-8 py-7 font-mono text-[12.5px] leading-relaxed" style={{ color: INK }}>
      {/* Header: ảnh + tên */}
      <header className="flex gap-6">
        <div className="w-[30%] shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={data.name || "Ảnh đại diện"}
              className="aspect-[4/5] w-full border border-neutral-300 object-cover grayscale"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center border border-neutral-300 bg-neutral-100">
              <span className="text-[40px] font-bold" style={{ color: MUTED }}>
                {initials(data.name)}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[30px] font-bold uppercase leading-tight tracking-wide">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.14em]">
              {data.title}
            </p>
          )}
          {data.contacts.length > 0 && (
            <div className="mt-3 space-y-1 text-[12px]" style={{ color: MUTED }}>
              {data.contacts.slice(0, 4).map((c, i) => (
                <p key={`${c.label}-${i}`} className="break-all">
                  <span className="font-bold" style={{ color: INK }}>
                    {"// "}
                    {c.label}:
                  </span>{" "}
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
          )}
        </div>
      </header>

      <div className="my-4 border-t-2" style={{ borderColor: INK }} />

      {data.summary && (
        <SectionShell section="summary">
          <Marker>Tóm tắt</Marker>
          <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" />
        </SectionShell>
      )}

      {data.experience.length > 0 && (
        <SectionShell section="experience">
          <div className="mt-4">
            <Marker>Kinh nghiệm làm việc</Marker>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item border border-neutral-300 p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold uppercase">{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="shrink-0 text-[11.5px]" />
                  </div>
                  {job.company && (
                    <p className="text-[12.5px] font-bold" style={{ color: MUTED }}>
                      {job.company}
                    </p>
                  )}
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                  )}
                  {job.skills.length > 0 && (
                    <p className="mt-1 text-[11.5px]">
                      <span className="font-bold">Stack: </span>
                      {job.skills.join(" / ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SectionShell>
      )}

      <div className="mt-4 grid grid-cols-2 gap-5">
        <div className="min-w-0">
          {data.education.length > 0 && (
            <SectionShell section="education">
              <Marker>Học vấn</Marker>
              <div className="space-y-2.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <h3 className="font-bold">{edu.school || "Trường"}</h3>
                    {edu.degree && <p className="text-[12px]">{edu.degree}</p>}
                    <DateText range={edu.range} className="text-[11.5px]" />
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.skills.length > 0 && (
            <SectionShell section="skills">
              <div className="mt-4">
                <Marker>Kỹ năng</Marker>
                <div className="space-y-2">
                  {data.skills.map((s) => (
                    <div key={s.id} className="cv-section-item">
                      <p className="text-[12px] font-bold">{s.name}</p>
                      <Bar />
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
              <Marker>Dự án</Marker>
              <div className="space-y-2.5">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <h3 className="font-bold">{p.name || "Dự án"}</h3>
                    {p.role && (
                      <p className="text-[12px]" style={{ color: MUTED }}>
                        {p.role}
                      </p>
                    )}
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words text-[12px] [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <div className="mt-4">
                <Marker>Chứng chỉ</Marker>
                <ul className="list-inside list-disc space-y-1 text-[12px]">
                  {data.certificates.map((c) => (
                    <li key={c.id} className="cv-section-item">
                      <span className="font-bold">{c.name || "Chứng chỉ"}</span>
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
