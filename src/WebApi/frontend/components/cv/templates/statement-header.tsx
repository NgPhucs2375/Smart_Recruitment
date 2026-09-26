"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const COBALT = "#1e40af";
const INK = "#1f2a37";
const SUBTLE = "#5b6470";
const MUTED = "#6b7280";
const RULE = "#e5e7eb";

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
  return <Icon className="size-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.8)" }} strokeWidth={2} />;
}

function PlainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2.5 border-b pb-1.5 text-[12px] font-bold uppercase tracking-[0.18em]"
      style={{ color: MUTED, borderColor: RULE }}
    >
      {children}
    </h2>
  );
}

export function StatementHeaderTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-6 pt-7" style={{ backgroundColor: COBALT }}>
        <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.7)" }} />
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-white">
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-1 text-[13px] font-medium text-white/80">{data.title}</p>}
        {data.contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p key={`${c.label}-${i}`} className="cv-section-item flex items-center gap-1.5 text-[12px] text-white/80">
                <ContactIcon label={c.label} />
                <span className="break-all">{c.value}</span>
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-5 bg-white px-7 py-6">
        {data.summary && (
          <SectionShell>
            <PlainTitle>Tóm tắt</PlainTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <PlainTitle>Kinh nghiệm</PlainTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-center gap-1.5 font-bold" style={{ color: INK }}>
                      <Briefcase className="size-3.5 shrink-0" style={{ color: COBALT }} strokeWidth={2} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[12px]" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: COBALT }}>{job.company}</p>
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <PlainTitle>Kỹ năng</PlainTitle>
            <p className="text-[13px] leading-loose" style={{ color: SUBTLE }}>
              {data.skills.map((s, i) => (
                <span key={s.id} className="cv-section-item">
                  {i > 0 && <span className="mx-1.5" style={{ color: RULE }}>·</span>}
                  <span className="font-medium" style={{ color: INK }}>{s.name}</span>
                </span>
              ))}
            </p>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <PlainTitle>Dự án</PlainTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[12px]" />
                    )}
                  </div>
                  {p.role && <p className="text-[12px] font-semibold" style={{ color: COBALT }}>{p.role}</p>}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <PlainTitle>Học vấn</PlainTitle>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="text-[12px]" />
                  </div>
                  {edu.degree && <p className="text-[12px] font-semibold" style={{ color: COBALT }}>{edu.degree}</p>}
                  {edu.description && (
                    <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <PlainTitle>Chứng chỉ</PlainTitle>
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <p className="flex items-start gap-1.5 text-[12px] font-semibold" style={{ color: INK }}>
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: COBALT }} strokeWidth={2} />
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
      </div>
    </div>
  );
}
