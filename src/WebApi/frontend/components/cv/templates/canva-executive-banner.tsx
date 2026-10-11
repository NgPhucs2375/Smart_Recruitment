"use client";

// Executive Banner — khối banner ngang xanh sẫm tràn viền trên đỉnh,
// bên dưới chia 2 cột trắng thoáng đãng. Avatar tròn viền trắng.
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";
import { safeHref } from "@/features/tao-cv/resume-data";

const BANNER = "#1e3a8a";
const BLUE = "#1d4ed8";
const INK = "#0f172a";
const MUTED = "#475569";
const HAIRLINE = "#cbd5e1";

function ContactIcon({ label, light }: { label: string; light?: boolean }) {
  const l = label.toLowerCase();
  const Icon =
    l.includes("mail") || l.includes("email")
      ? Mail
      : l.includes("điện") || l.includes("phone") || l.includes("sđt")
        ? Phone
        : l.includes("địa chỉ") || l.includes("address")
          ? MapPin
          : Globe;
  return (
    <Icon
      className="size-3.5 shrink-0"
      style={{ color: light ? "#fff" : BLUE }}
      strokeWidth={2}
    />
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 border-b-2 pb-1.5 text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: BLUE, borderColor: BLUE }}>
      {children}
    </h2>
  );
}

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b pb-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: BLUE, borderColor: HAIRLINE }}>
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

export function CanvaExecutiveBannerTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      {/* Banner tràn viền */}
      <div className="px-7 pb-5 pt-6 text-white" style={{ backgroundColor: BANNER }}>
        <div className="flex items-center gap-5">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={data.name || "Ảnh đại diện"}
              className="size-24 shrink-0 rounded-full border-[3px] border-white/80 object-cover"
            />
          ) : (
            <div
              className="flex size-24 shrink-0 items-center justify-center rounded-full border-[3px] border-white/80 bg-white/10"
              aria-hidden="true"
            >
              <span className="font-serif text-[24px] font-bold text-white">
                {initials(data.name)}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white">
              {data.name || "Họ và tên"}
            </h1>
            {data.title && (
              <p className="mt-0.5 text-[13.5px] font-semibold text-white/90">
                {data.title}
              </p>
            )}
            {data.contacts.length > 0 && (
              <p className="mt-2 text-[11.5px] text-white/80">
                {data.contacts.slice(0, 4).map((c, i) => (
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
          </div>
        </div>
      </div>

      {/* 2 cột thoáng */}
      <div className="grid grid-cols-[70%_30%] gap-6 px-7 py-6">
        <div className="min-w-0 space-y-4">
          {data.summary && (
            <SectionShell section="summary">
              <MainTitle>Tóm tắt</MainTitle>
              <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
            </SectionShell>
          )}
          {data.experience.length > 0 && (
            <SectionShell section="experience">
              <MainTitle>Kinh nghiệm làm việc</MainTitle>
              <div className="space-y-3.5">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[13.5px] font-bold">{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="shrink-0 text-[11px] tabular-nums" />
                    </div>
                    {job.company && (
                      <p className="text-[12.5px] font-semibold" style={{ color: BLUE }}>
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
                          className="shrink-0 text-[11px] underline underline-offset-2"
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
                      <DateText range={edu.range} className="shrink-0 text-[11px] tabular-nums" />
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
        <aside className="min-w-0">
          {data.skills.length > 0 && (
            <SectionShell section="skills">
              <RailTitle>Kỹ năng</RailTitle>
              <ul className="space-y-1.5 text-[12px] font-medium">
                {data.skills.map((s) => (
                  <li key={s.id} className="cv-section-item border-b border-dashed pb-1.5" style={{ borderColor: HAIRLINE }}>
                    {s.name}
                  </li>
                ))}
              </ul>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <div className="mt-4">
                <RailTitle>Chứng chỉ</RailTitle>
                <div className="space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item text-[11.5px]">
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
        </aside>
      </div>
    </div>
  );
}
