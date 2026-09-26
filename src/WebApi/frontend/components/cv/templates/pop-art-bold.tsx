"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const INK = "#111111";
const SUBTLE = "#4b5563";

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
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: "#1d4ed8" }} strokeWidth={2.5} />;
}

function PopTitle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2
      className="mb-2.5 border-b-2 pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em]"
      style={{ color: INK, borderColor: color }}
    >
      {children}
    </h2>
  );
}

export function PopArtBoldTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-4 pt-6">
        <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: SUBTLE }} />
        <h1 className="text-[28px] font-bold leading-tight tracking-tight" style={{ color: INK }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1.5 text-[13px] font-semibold" style={{ color: "#1d4ed8" }}>
            {data.title}
          </p>
        )}
      </header>

      <div className="space-y-5 px-7 py-5">
        {data.contacts.length > 0 && (
          <SectionShell>
            <PopTitle color="#facc15">Liên hệ</PopTitle>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {data.contacts.map((c, i) => (
                <p key={`${c.label}-${i}`} className="cv-section-item flex min-w-0 items-start gap-2 text-[12px]" style={{ color: SUBTLE }}>
                  <ContactIcon label={c.label} />
                  <span className="break-all">{c.value}</span>
                </p>
              ))}
            </div>
          </SectionShell>
        )}

        {data.summary && (
          <SectionShell>
            <PopTitle color="#ef4444">Tóm tắt</PopTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] border-l-4 pl-3 text-[13px]" style={{ color: SUBTLE, borderColor: "#ef4444" }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <PopTitle color="#1d4ed8">Kinh nghiệm</PopTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item border-l-4 pl-3" style={{ borderColor: "#1d4ed8" }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-center gap-1.5 font-bold" style={{ color: INK }}>
                      <Briefcase className="size-3.5 shrink-0" style={{ color: "#ef4444" }} strokeWidth={2.5} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[12px] font-bold" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: "#1d4ed8" }}>{job.company}</p>
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
            <PopTitle color="#facc15">Kỹ năng</PopTitle>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="cv-section-item rounded-md px-2 py-1 text-[12px] font-semibold"
                  style={{ backgroundColor: "#fefce8", color: INK, border: "1px solid #fde68a" }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <PopTitle color="#ef4444">Dự án</PopTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item border-l-4 pl-3" style={{ borderColor: "#ef4444" }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[12px] font-bold" />
                    )}
                  </div>
                  {p.role && <p className="text-[12px] font-bold" style={{ color: "#ef4444" }}>{p.role}</p>}
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
            <PopTitle color="#1d4ed8">Học vấn</PopTitle>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="text-[12px] font-bold" />
                  </div>
                  {edu.degree && <p className="text-[12px] font-bold" style={{ color: "#1d4ed8" }}>{edu.degree}</p>}
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
            <PopTitle color="#facc15">Chứng chỉ</PopTitle>
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                    <p className="flex items-start gap-1.5 text-[12px] font-bold" style={{ color: INK }}>
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: "#ef4444" }} strokeWidth={2.5} />
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
