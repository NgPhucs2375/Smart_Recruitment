"use client";

// Đồ Họa Lime — sidebar xanh dương đậm + quote lime, titles xanh lá.
// Avatar tròn, pills liên hệ, bars phần mềm, bullets lime.
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const BLUE = "#1d4ed8";
const BLUE_DEEP = "#1e3a8a";
const LIME_DEEP = "#65a30d";
const GREEN = "#15803d";
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
  return <Icon className="size-3.5 shrink-0 text-white" strokeWidth={2.2} />;
}

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-white/25 pb-1.5 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-white">
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-left text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: GREEN }}>
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

export function DoHoaLimeTemplate({ data }: ResumeTemplateProps) {
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
      <div className="grid grid-cols-[32%_68%]">
        {/* Sidebar xanh */}
        <aside className="min-w-0 px-4 py-6 text-left text-white" style={{ backgroundColor: BLUE }}>
          <div className="flex flex-col items-start text-left">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={data.name || "Ảnh đại diện"}
                className="size-24 rounded-full border-[3px] border-white/70 object-cover"
              />
            ) : (
              <div
                className="flex size-24 items-center justify-center rounded-full border-[3px] border-white/70 bg-white/15"
                aria-hidden="true"
              >
                <span className="text-[26px] font-bold text-white">
                  {initials(data.name)}
                </span>
              </div>
            )}
            <h1 className="mt-2 text-[19px] font-bold uppercase leading-tight">
              {data.name || "Họ và tên"}
            </h1>
            {data.title && (
              <p className="mt-0.5 text-[11.5px] font-medium text-white/85">
                {data.title}
              </p>
            )}
          </div>

          {data.contacts.length > 0 && (
            <div className="cv-section-item mt-4">
              <RailTitle>Liên hệ</RailTitle>
              <div className="space-y-1.5">
                {data.contacts.map((c, i) => (
                  <p key={`${c.label}-${i}`} className="flex items-start gap-1.5 text-[11px] leading-snug text-white/90">
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
                <RailTitle>Phần mềm</RailTitle>
                <div className="space-y-2">
                  {data.skills.map((s) => (
                    <div key={s.id} className="cv-section-item">
                      <p className="text-[11px] font-semibold text-white/90">{s.name}</p>
                      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-white/25" aria-hidden="true">
                        <span className="block h-full w-4/5 rounded-full bg-white" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}

          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <div className="mt-4">
                <RailTitle>Chứng chỉ</RailTitle>
                <ul className="space-y-1 text-[11px] text-white/90">
                  {data.certificates.map((c) => (
                    <li key={c.id} className="cv-section-item">
                      <span className="font-semibold text-white">{c.name || "Chứng chỉ"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionShell>
          )}
        </aside>

        {/* Main */}
        <div className="min-w-0 px-6 py-6">
          {data.summary && (
            <SectionShell section="summary">
              <div className="border-l-[3px] pl-3.5 text-[12px] font-medium leading-relaxed" style={{ borderColor: LIME_DEEP }}>
                <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere]" />
              </div>
            </SectionShell>
          )}

          {data.education.length > 0 && (
            <SectionShell section="education">
              <div className="mt-4">
                <MainTitle>Học vấn</MainTitle>
                <div className="space-y-2.5">
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
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell section="experience">
              <div className="mt-4">
                <MainTitle>Kinh nghiệm</MainTitle>
                <div className="space-y-3">
                  {data.experience.map((job) => (
                    <div key={job.id} className="cv-section-item">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-bold">{job.role || "Chức danh"}</h3>
                        <DateText range={job.range} className="shrink-0 text-[11px]" />
                      </div>
                      {job.company && (
                        <p className="text-[12px] font-semibold" style={{ color: GREEN }}>
                          {job.company}
                        </p>
                      )}
                      {job.description && (
                        <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" />
                      )}
                      {job.skills.length > 0 && (
                        <p className="mt-1 text-[11.5px]" style={{ color: LIME_DEEP }}>
                          ✦ {job.skills.join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}

          {data.projects.length > 0 && (
            <SectionShell section="projects">
              <div className="mt-4">
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
              </div>
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
