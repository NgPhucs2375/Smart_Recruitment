"use client";

// Blue & Gold Executive — navy sang trọng, line vàng gold mảnh ở chức danh
// và bullets. Không fill vàng, không card phồng.
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const NAVY = "#0c4a6e";
const GOLD = "#b8860b";
const GOLD_SOFT = "#f5eeda";
const INK = "#0f172a";
const MUTED = "#475569";
const RAIL_BG = "#f0f5f9";
const HAIRLINE = "#cbd5e1";

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
  return <Icon className="size-3.5 shrink-0" style={{ color: NAVY }} strokeWidth={2} />;
}

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b pb-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: NAVY, borderColor: HAIRLINE }}>
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 border-b-2 pb-1.5 text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: NAVY, borderColor: NAVY }}>
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

export function CanvaBlueGoldDesignerTemplate({ data }: ResumeTemplateProps) {
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
      {/* Header: avatar + tên + line vàng */}
      <header className="flex items-center gap-5 px-7 pb-4 pt-6">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={data.name || "Ảnh đại diện"}
            className="size-20 shrink-0 rounded-full border-2 object-cover"
            style={{ borderColor: GOLD }}
          />
        ) : (
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full border-2"
            style={{ borderColor: GOLD, backgroundColor: GOLD_SOFT }}
            aria-hidden="true"
          >
            <span className="font-serif text-[22px] font-bold" style={{ color: NAVY }}>
              {initials(data.name)}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
            {resolveBannerTitle3(data, data.title, "Curriculum Vitae")}
          </p>
          <h1 className="mt-0.5 font-serif text-[28px] font-bold leading-tight" style={{ color: NAVY }}>
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-0.5 border-l-[3px] pl-2.5 text-[13px] font-semibold" style={{ borderColor: GOLD, color: INK }}>
              {data.title}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-[30%_70%]">
        {/* Rail */}
        <aside className="min-w-0 px-5 py-5" style={{ backgroundColor: RAIL_BG }}>
          {data.contacts.length > 0 && (
            <div className="cv-section-item">
              <RailTitle>Liên hệ</RailTitle>
              <div className="space-y-1.5">
                {data.contacts.map((c, i) => (
                  <p key={`${c.label}-${i}`} className="flex items-start gap-1.5 text-[11.5px] leading-snug" style={{ color: MUTED }}>
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
            </div>
          )}
          {data.skills.length > 0 && (
            <SectionShell section="skills">
              <div className="mt-4">
                <RailTitle>Kỹ năng</RailTitle>
                <ul className="space-y-1.5 text-[12px] font-medium">
                  {data.skills.map((s) => (
                    <li key={s.id} className="cv-section-item flex items-baseline gap-1.5">
                      <span className="font-bold" style={{ color: GOLD }} aria-hidden="true">
                        ◆
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

        {/* Main */}
        <div className="min-w-0 space-y-4 px-7 py-5">
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
                      <p className="border-l-[3px] pl-2.5 text-[12.5px] font-semibold" style={{ borderColor: GOLD, color: NAVY }}>
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
                    <h3 className="text-[13px] font-bold">{p.name || "Dự án"}</h3>
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
      </div>
    </div>
  );
}
