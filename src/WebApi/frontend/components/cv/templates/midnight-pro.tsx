"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const BG = "#0f172a";
const PANEL = "#1e293b";
const INK = "#e2e8f0";
const SUBTLE = "#94a3b8";
const NEON = "#22d3ee";

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
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: NEON }} strokeWidth={2} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5">
      <h2
        className="font-mono text-[12px] font-bold uppercase tracking-[0.22em]"
        style={{ color: NEON }}
      >
        {children}
      </h2>
      <div className="mt-1.5 h-px w-full" style={{ backgroundColor: "#334155" }} />
    </div>
  );
}

export function MidnightProTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 px-7 py-6 font-mono text-[13px] leading-relaxed" style={{ backgroundColor: BG, color: INK }}>
      <header className="border-b pb-4" style={{ borderColor: "#334155" }}>
        <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: NEON }}>
          ./profile
        </p>
        <h1 className="mt-1 font-mono text-[27px] font-bold leading-tight" style={{ color: INK }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 font-mono text-[13px]" style={{ color: NEON }}>
            <span style={{ color: SUBTLE }}>&gt; </span>{data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p key={`${c.label}-${i}`} className="cv-section-item flex items-start gap-2 font-mono text-[12px]" style={{ color: SUBTLE }}>
                <ContactIcon label={c.label} />
                <span className="break-all">{c.value}</span>
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="mt-4 space-y-4">
        {data.summary && (
          <SectionShell>
            <SectionTitle>Tóm tắt</SectionTitle>
            <p className="cv-section-item whitespace-pre-line font-mono text-[13px]" style={{ color: SUBTLE }}>{data.summary}</p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <SectionTitle>Kinh nghiệm</SectionTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item rounded-lg p-3" style={{ backgroundColor: PANEL }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-center gap-1.5 font-mono font-bold" style={{ color: INK }}>
                      <Briefcase className="size-3.5 shrink-0" style={{ color: NEON }} strokeWidth={2} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="font-mono text-[11px]" />
                  </div>
                  <p className="font-mono text-[12px] font-semibold" style={{ color: NEON }}>{job.company}</p>
                  {job.description && (
                    <p className="mt-1 whitespace-pre-line font-mono text-[13px]" style={{ color: SUBTLE }}>{job.description}</p>
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
                  className="cv-section-item rounded px-2 py-1 font-mono text-[12px] font-medium"
                  style={{ color: NEON, backgroundColor: PANEL, border: "1px solid #334155" }}
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
                <div key={p.id} className="cv-section-item rounded-lg p-3" style={{ backgroundColor: PANEL }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-mono font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="font-mono text-[11px]" />
                    )}
                  </div>
                  {p.role && <p className="font-mono text-[12px] font-semibold" style={{ color: NEON }}>{p.role}</p>}
                  {p.description && (
                    <p className="mt-1 whitespace-pre-line font-mono text-[13px]" style={{ color: SUBTLE }}>{p.description}</p>
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
                    <h3 className="font-mono font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="font-mono text-[11px]" />
                  </div>
                  {edu.degree && <p className="font-mono text-[12px] font-semibold" style={{ color: NEON }}>{edu.degree}</p>}
                  {edu.description && (
                    <p className="mt-1 whitespace-pre-line font-mono text-[13px]" style={{ color: SUBTLE }}>{edu.description}</p>
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
                  <p className="flex items-start gap-1.5 font-mono text-[13px] font-semibold" style={{ color: INK }}>
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: NEON }} strokeWidth={2} />
                    {c.name || "Chứng chỉ"}
                  </p>
                  {[c.issuer, c.date].filter(Boolean).length > 0 && (
                    <p className="mt-0.5 pl-5 font-mono text-[12px]" style={{ color: SUBTLE }}>
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
                <p key={`${c.label}-${i}`} className="cv-section-item font-mono text-[12px]" style={{ color: SUBTLE }}>
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
