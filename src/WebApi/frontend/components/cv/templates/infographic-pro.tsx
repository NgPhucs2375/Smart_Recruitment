"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const TEAL = "#0d9488";
const TEAL_DARK = "#0f766e";
const INK = "#1f2a37";
const SUBTLE = "#5b6470";

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
  return <Icon className="size-3.5 shrink-0" style={{ color: "#ffffff" }} strokeWidth={2} />;
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2.5 border-b-2 pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em]"
      style={{ color: TEAL_DARK, borderColor: TEAL }}
    >
      {children}
    </h2>
  );
}

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "#ffffff" }}>
      {children}
    </h2>
  );
}

export function InfographicProTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  const stats = [
    { value: data.experience.length, label: "Kinh nghiệm" },
    { value: data.projects.length, label: "Dự án" },
    { value: data.certificates.length, label: "Chứng chỉ" },
  ];

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-5 pt-6" style={{ backgroundColor: TEAL }}>
        <h1 className="text-[26px] font-bold leading-tight text-white">{data.name || "Họ và tên"}</h1>
        {data.title && <p className="mt-1 text-[13px] font-medium text-white/85">{data.title}</p>}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="cv-section-item rounded-md px-3 py-2 text-center" style={{ backgroundColor: TEAL_DARK }}>
              <p className="text-[24px] font-black leading-none text-white">{s.value}</p>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-widest text-white/85">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-[65%_35%]">
        <div className="space-y-4 px-7 py-5">
          {data.summary && (
            <SectionShell>
              <MainTitle>Tóm tắt</MainTitle>
              <p className="whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{data.summary}</p>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <MainTitle>Kinh nghiệm</MainTitle>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 font-bold" style={{ color: INK }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: TEAL }} strokeWidth={2} />
                        {job.role || "Chức danh"}
                      </h3>
                      <span className="rounded-full px-2 py-0.5 text-[12px] font-bold text-white" style={{ backgroundColor: TEAL }}>
                        <DateText range={job.range} />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] font-semibold" style={{ color: TEAL_DARK }}>{job.company}</p>
                    {job.description && (
                      <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{job.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.projects.length > 0 && (
            <SectionShell>
              <MainTitle>Dự án</MainTitle>
              <div className="space-y-3">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                      {p.range && (p.range.start || p.range.end) && (
                        <span className="rounded-full px-2 py-0.5 text-[12px] font-bold text-white" style={{ backgroundColor: TEAL }}>
                          <DateText range={p.range} />
                        </span>
                      )}
                    </div>
                    {p.role && <p className="text-[12px] font-semibold" style={{ color: TEAL_DARK }}>{p.role}</p>}
                    {p.description && (
                      <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.education.length > 0 && (
            <SectionShell>
              <MainTitle>Học vấn</MainTitle>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                      <DateText range={edu.range} className="text-[12px] font-bold" />
                    </div>
                    {edu.degree && <p className="text-[12px] font-semibold" style={{ color: TEAL_DARK }}>{edu.degree}</p>}
                    {edu.description && (
                      <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>

        <aside className="space-y-5 px-5 py-5" style={{ backgroundColor: TEAL_DARK }}>
          {data.contacts.length > 0 && (
            <div className="cv-section-item">
              <RailTitle>Liên hệ</RailTitle>
              <div className="space-y-1.5">
                {data.contacts.map((c, i) => (
                  <p key={`${c.label}-${i}`} className="cv-section-item flex items-start gap-2 text-[12px] text-white/90">
                    <span className="mt-0.5"><ContactIcon label={c.label} /></span>
                    <span className="break-all">{c.value}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {data.skills.length > 0 && (
            <div className="cv-section-item">
              <RailTitle>Kỹ năng</RailTitle>
              <div className="space-y-2.5">
                {data.skills.map((s, i) => {
                  const w = Math.max(45, 95 - i * 7);
                  return (
                    <div key={s.id} className="cv-section-item">
                      <p className="text-[12px] font-semibold text-white">{s.name}</p>
                      <div className="mt-1 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                        <div className="h-1.5 rounded-full bg-white" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.certificates.length > 0 && (
            <div className="cv-section-item">
              <RailTitle>Chứng chỉ</RailTitle>
              <div className="space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item">
                    <p className="flex items-start gap-1.5 text-[12px] font-semibold text-white">
                      <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: "#ffffff" }} strokeWidth={2} />
                      {c.name || "Chứng chỉ"}
                    </p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p className="mt-0.5 pl-5 text-[12px] text-white/75">
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
