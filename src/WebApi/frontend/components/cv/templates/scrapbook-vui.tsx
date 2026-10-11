"use client";

// Scrapbook Vui — bản gọn lấy tinh thần collage: khung xanh, giấy kraft,
// cards trắng dán băng keo, stamp đỏ, checklist kỹ năng. Lưới gọn gàng để
// nội dung dài không vỡ (không xếp tuyệt đối tự do như bản gốc).
import { Star, Check, Paperclip } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const BLUE = "#2563eb";
const KRAFT = "#f3e7c9";
const PAPER = "#fffdf7";
const INK = "#44403c";
const RED = "#dc2626";
const TAPE = "rgba(251,191,36,0.55)";

function Tape({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute h-5 w-16 ${className ?? ""}`}
      style={{ backgroundColor: TAPE }}
      aria-hidden="true"
    />
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 inline-block -rotate-1 rounded-md px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: BLUE }}>
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

export function ScrapbookVuiTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 p-2.5 text-[12px] leading-relaxed" style={{ backgroundColor: BLUE, color: INK }}>
      <div className="min-h-full rounded-lg p-4" style={{ backgroundColor: KRAFT }}>
        {/* Header: photo + tên + stamp */}
        <div className="relative rounded-xl border-2 border-dashed border-neutral-400 bg-white/60 p-4">
          <Tape className="-top-2.5 left-8 -rotate-6" />
          <Tape className="-top-2.5 right-8 rotate-6" />
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 -rotate-2 rounded-lg border-4 border-white bg-white shadow-md">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={data.name || "Ảnh đại diện"}
                  className="size-24 object-cover"
                />
              ) : (
                <div className="flex size-24 items-center justify-center" style={{ backgroundColor: PAPER }} aria-hidden="true">
                  <span className="text-[26px] font-bold" style={{ color: BLUE }}>
                    {initials(data.name)}
                  </span>
                </div>
              )}
              <Paperclip className="absolute -right-2 -top-3 size-5 rotate-12 text-neutral-500" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                {resolveBannerTitle3(data, undefined, "Hồ sơ ứng viên")}
              </p>
              <h1 className="mt-0.5 text-[26px] font-bold leading-tight">
                {data.name || "Họ và tên"}
              </h1>
              {data.title && (
                <p
                  className="mx-auto mt-1 inline-block rounded-full border-2 px-3 py-0.5 text-[12px] font-bold"
                  style={{ borderColor: RED, color: RED }}
                >
                  {data.title}
                </p>
              )}
            </div>
            <Star className="size-6 shrink-0 fill-amber-300 text-amber-500" aria-hidden="true" />
          </div>
          {data.contacts.length > 0 && (
            <p className="mt-3 text-center text-[11px] text-neutral-600">
              {data.contacts.slice(0, 4).map((c, i) => (
                <span key={`${c.label}-${i}`}>
                  {i > 0 && <span style={{ margin: "0 0.5em" }}>✦</span>}
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
        </div>

        {data.summary && (
          <SectionShell section="summary">
            <div className="relative mt-3 rounded-xl p-3.5 shadow-sm" style={{ backgroundColor: PAPER }}>
              <Tape className="-top-2 left-1/2 -translate-x-1/2 -rotate-2" />
              <SplitBlocks text={data.summary} className="whitespace-pre-line break-words text-center italic [overflow-wrap:anywhere]" />
            </div>
          </SectionShell>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="min-w-0 space-y-3">
            {data.experience.length > 0 && (
              <SectionShell section="experience">
                <div className="rounded-xl p-3.5 shadow-sm" style={{ backgroundColor: PAPER }}>
                  <CardTitle>Kinh nghiệm</CardTitle>
                  <div className="space-y-2.5">
                    {data.experience.map((job) => (
                      <div key={job.id} className="cv-section-item">
                        <h3 className="font-bold">{job.role || "Chức danh"}</h3>
                        {job.company && (
                          <p className="text-[11.5px] font-semibold" style={{ color: BLUE }}>
                            {job.company}
                          </p>
                        )}
                        <DateText range={job.range} className="text-[11px]" />
                        {job.description && (
                          <SplitBlocks text={job.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </SectionShell>
            )}
            {data.education.length > 0 && (
              <SectionShell section="education">
                <div className="rounded-xl p-3.5 shadow-sm" style={{ backgroundColor: PAPER }}>
                  <CardTitle>Học vấn</CardTitle>
                  <div className="space-y-2">
                    {data.education.map((edu) => (
                      <div key={edu.id} className="cv-section-item">
                        <h3 className="font-bold">{edu.school || "Trường"}</h3>
                        <DateText range={edu.range} className="text-[11px]" />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionShell>
            )}
          </div>
          <div className="min-w-0 space-y-3">
            {data.projects.length > 0 && (
              <SectionShell section="projects">
                <div className="rounded-xl p-3.5 shadow-sm" style={{ backgroundColor: PAPER }}>
                  <CardTitle>Dự án</CardTitle>
                  <div className="space-y-2">
                    {data.projects.map((p) => (
                      <div key={p.id} className="cv-section-item">
                        <h3 className="font-bold">{p.name || "Dự án"}</h3>
                        {p.description && (
                          <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </SectionShell>
            )}
            {data.skills.length > 0 && (
              <SectionShell section="skills">
                <div className="rounded-xl p-3.5 shadow-sm" style={{ backgroundColor: PAPER }}>
                  <CardTitle>Kỹ năng</CardTitle>
                  <ul className="space-y-1.5">
                    {data.skills.map((s) => (
                      <li key={s.id} className="cv-section-item flex items-center gap-2 text-[11.5px] font-medium">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded border" style={{ borderColor: BLUE }} aria-hidden="true">
                          <Check className="size-3" style={{ color: BLUE }} strokeWidth={3} />
                        </span>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionShell>
            )}
            {data.certificates.length > 0 && (
              <SectionShell section="certificates">
                <div className="rounded-xl p-3.5 shadow-sm" style={{ backgroundColor: PAPER }}>
                  <CardTitle>Chứng chỉ</CardTitle>
                  <ul className="list-inside list-disc space-y-1 text-[11.5px]">
                    {data.certificates.map((c) => (
                      <li key={c.id} className="cv-section-item">
                        <span className="font-semibold">{c.name || "Chứng chỉ"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionShell>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
