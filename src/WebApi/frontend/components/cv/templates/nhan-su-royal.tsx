"use client";

// Nhân Sự Royal — xanh hoàng gia cho HR/tuyển dụng: photo blob, headings
// xanh kèm markers +, bars kỹ năng, pills ngoại ngữ, sóng footer.
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const BLUE = "#1d4ed8";
const BLUE_DEEP = "#1e3a8a";
const BLUE_SOFT = "#dbeafe";
const INK = "#1e293b";
const MUTED = "#64748b";

function ContactIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const Icon =
    l.includes("mail") || l.includes("email")
      ? Mail
      : l.includes("điện") || l.includes("phone") || l.includes("sđt")
        ? Phone
        : l.includes("địa chỉ") || l.includes("address")
          ? MapPin
          : Globe;
  return <Icon className="size-3.5 shrink-0" style={{ color: BLUE }} strokeWidth={2.2} />;
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: BLUE }}>
      {children}
      <span className="font-mono font-bold" style={{ color: BLUE_SOFT }} aria-hidden="true">
        +
      </span>
    </h2>
  );
}

function WaveFooter() {
  return (
    <svg viewBox="0 0 210 8" preserveAspectRatio="none" className="block h-[10px] w-full" aria-hidden="true">
      <path
        d="M0,8 Q10.5,0 21,8 T42,8 T63,8 T84,8 T105,8 T126,8 T147,8 T168,8 T189,8 T210,8 L210,8 L0,8 Z"
        fill={BLUE}
      />
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NhanSuRoyalTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[12.5px] leading-relaxed" style={{ color: INK }}>
      {/* Header: tên trái + photo blob phải */}
      <header className="flex items-center gap-5 px-7 pb-4 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-bold uppercase leading-tight tracking-wide" style={{ color: BLUE_DEEP }}>
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-0.5 text-[13px] font-semibold" style={{ color: BLUE }}>
              {data.title}
            </p>
          )}
          {data.contacts.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {data.contacts.slice(0, 4).map((c, i) => (
                <p key={`${c.label}-${i}`} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: MUTED }}>
                  <ContactIcon label={c.label} />
                  <span className="break-all">
                    {c.href ? (
                      <a href={c.href} className="underline underline-offset-2">
                        {c.value}
                      </a>
                    ) : (
                      c.value
                    )}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={data.name || "Ảnh đại diện"}
            className="h-32 w-28 shrink-0 object-cover"
            style={{ borderRadius: "38% 62% 55% 45% / 45% 42% 58% 55%" }}
          />
        ) : (
          <div
            className="flex h-32 w-28 shrink-0 items-center justify-center"
            style={{ backgroundColor: BLUE_SOFT, borderRadius: "38% 62% 55% 45% / 45% 42% 58% 55%" }}
            aria-hidden="true"
          >
            <span className="text-[30px] font-bold" style={{ color: BLUE }}>
              {initials(data.name)}
            </span>
          </div>
        )}
      </header>

      <div className="px-7 pb-6">
        {data.summary && (
          <SectionShell section="summary">
            <SectionHead>Tóm tắt</SectionHead>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" />
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell section="education">
            <div className="mt-4">
              <SectionHead>Học vấn</SectionHead>
              <div className="space-y-2.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold">{edu.school || "Trường"}</h3>
                      <DateText range={edu.range} className="shrink-0 text-[11px]" />
                    </div>
                    {edu.degree && (
                      <p className="text-[12px] font-semibold" style={{ color: BLUE }}>
                        {edu.degree}
                      </p>
                    )}
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-0.5 whitespace-pre-line break-words text-[12px] [overflow-wrap:anywhere]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell section="experience">
            <div className="mt-4">
              <SectionHead>Kinh nghiệm</SectionHead>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item rounded-xl border border-neutral-200 p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold">{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="shrink-0 text-[11px]" />
                    </div>
                    {job.company && (
                      <p className="text-[12px] font-semibold" style={{ color: BLUE }}>
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

        <div className="mt-4 grid grid-cols-2 gap-5">
          <div className="min-w-0">
            {data.skills.length > 0 && (
              <SectionShell section="skills">
                <SectionHead>Kỹ năng</SectionHead>
                <div className="space-y-2">
                  {data.skills.map((s) => (
                    <div key={s.id} className="cv-section-item">
                      <p className="text-[12px] font-semibold">{s.name}</p>
                      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: BLUE_SOFT }} aria-hidden="true">
                        <span className="block h-full w-4/5 rounded-full" style={{ backgroundColor: BLUE }} />
                      </span>
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}
          </div>
          <div className="min-w-0">
            {data.projects.length > 0 && (
              <SectionShell section="projects">
                <SectionHead>Dự án</SectionHead>
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
            {data.certificates.length > 0 && (
              <SectionShell section="certificates">
                <div className="mt-4">
                  <SectionHead>Chứng chỉ</SectionHead>
                  <div className="flex flex-wrap gap-1.5">
                    {data.certificates.map((c) => (
                      <span
                        key={c.id}
                        className="cv-section-item rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                        style={{ borderColor: BLUE_SOFT, backgroundColor: "#eff6ff", color: BLUE_DEEP }}
                      >
                        {c.name || "Chứng chỉ"}
                      </span>
                    ))}
                  </div>
                </div>
              </SectionShell>
            )}
          </div>
        </div>
      </div>

      <WaveFooter />
      <div className="px-7 pb-5 pt-1 text-center" style={{ backgroundColor: BLUE }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80">
          {data.name || "Curriculum Vitae"}
        </p>
      </div>
    </div>
  );
}
