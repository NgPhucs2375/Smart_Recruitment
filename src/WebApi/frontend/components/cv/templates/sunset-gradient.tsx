"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const ACCENT = "#c2410c";
const INK = "#1f2937";
const SUBTLE = "#6b7280";

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
  return <Icon className="size-3.5 shrink-0 text-white/90" strokeWidth={2} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
        {children}
      </h2>
      <div
        className="mt-1.5 h-0.5 w-full rounded-full"
        style={{ background: "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)" }}
      />
    </div>
  );
}

export function SunsetGradientTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      <header
        className="px-7 pb-6 pt-7 text-white"
        style={{ background: "linear-gradient(120deg, #f97316, #ec4899, #8b5cf6)" }}
      >
        <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.8)" }} />
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-1 text-[13px] font-medium text-white/95">{data.title}</p>}
        {data.contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p key={`${c.label}-${i}`} className="cv-section-item flex items-center gap-1.5 text-[12px] text-white/95">
                <ContactIcon label={c.label} />
                <span className="break-all">{c.value}</span>
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-4 bg-white px-7 py-5">
        {data.summary && (
          <SectionShell>
            <SectionTitle>Tóm tắt</SectionTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <SectionTitle>Kinh nghiệm</SectionTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-center gap-1.5 font-bold" style={{ color: INK }}>
                      <Briefcase className="size-3.5 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[11px]" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: ACCENT }}>{job.company}</p>
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <SectionTitle>Học vấn</SectionTitle>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="text-[11px]" />
                  </div>
                  {edu.degree && <p className="text-[12px] font-semibold" style={{ color: ACCENT }}>{edu.degree}</p>}
                  {edu.description && (
                    <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <SectionTitle>Kỹ năng</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="cv-section-item rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold"
                  style={{ color: ACCENT, border: "1px solid #fed7aa" }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <SectionTitle>Dự án</SectionTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11px]" />
                    )}
                  </div>
                  {p.role && <p className="text-[12px] font-semibold" style={{ color: ACCENT }}>{p.role}</p>}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                  {p.tech.length > 0 && (
                    <p className="mt-1 text-[12px]" style={{ color: SUBTLE }}>{p.tech.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <SectionTitle>Chứng chỉ</SectionTitle>
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <p className="flex items-start gap-1.5 text-[13px] font-semibold" style={{ color: INK }}>
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
                    {c.name || "Chứng chỉ"}
                  </p>
                  {[c.issuer, c.date].filter(Boolean).length > 0 && (
                    <p className="mt-0.5 pl-5 text-[12px]" style={{ color: SUBTLE }}>
                      {[c.issuer, c.date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.contacts.length > 0 && (
          <SectionShell>
            <SectionTitle>Liên hệ</SectionTitle>
            <div className="space-y-1">
              {data.contacts.map((c, i) => (
                <p key={`${c.label}-${i}`} className="cv-section-item text-[12px]" style={{ color: SUBTLE }}>
                  <span className="font-semibold" style={{ color: INK }}>{c.label}: </span>
                  {c.value}
                </p>
              ))}
            </div>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
