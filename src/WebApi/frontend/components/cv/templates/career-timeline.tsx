"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const NAVY = "#1e3a5f";
const ORANGE = "#f97316";
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
  return <Icon className="size-3.5 shrink-0" style={{ color: NAVY }} strokeWidth={2} />;
}

function CenterTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-center text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

export function CareerTimelineTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-7 py-6 text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="pb-5 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.25em]" style={{ color: ORANGE }}>
          Hồ sơ nghề nghiệp
        </p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight" style={{ color: NAVY }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-semibold" style={{ color: SUBTLE }}>{data.title}</p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p key={`${c.label}-${i}`} className="cv-section-item flex items-center gap-1.5 text-[12px]" style={{ color: SUBTLE }}>
                <ContactIcon label={c.label} />
                <span className="break-all">{c.value}</span>
              </p>
            ))}
          </div>
        )}
        <div className="mx-auto mt-4 h-[2px] w-16" style={{ backgroundColor: ORANGE }} />
      </header>

      <div className="space-y-6">
        {data.summary && (
          <SectionShell>
            <CenterTitle>Tóm tắt</CenterTitle>
            <p className="mx-auto max-w-[60ch] whitespace-pre-line text-center text-[13px]" style={{ color: SUBTLE }}>
              {data.summary}
            </p>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <CenterTitle>Kinh nghiệm</CenterTitle>
            <div className="relative">
              <div className="absolute bottom-1 left-1/2 top-1 w-[2px] -translate-x-1/2" style={{ backgroundColor: NAVY }} />
              <div className="space-y-4">
                {data.experience.map((job, i) => {
                  const left = i % 2 === 0;
                  return (
                    <div key={job.id} className="cv-section-item relative grid grid-cols-2 gap-6">
                      <span
                        className="absolute left-1/2 top-1 z-10 size-3 -translate-x-1/2 rounded-full"
                        style={{ backgroundColor: ORANGE, border: "2px solid #ffffff", outline: `2px solid ${ORANGE}` }}
                      />
                      <div className={left ? "pr-2 text-right" : "col-start-2 pl-2"}>
                        <p className="text-[12px] font-black" style={{ color: ORANGE }}>
                          <DateText range={job.range} />
                        </p>
                        <h3 className="mt-0.5 flex items-center gap-1.5 font-bold" style={{ color: NAVY, justifyContent: left ? "flex-end" : "flex-start" }}>
                          {!left && <Briefcase className="size-3.5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />}
                          {job.role || "Chức danh"}
                          {left && <Briefcase className="size-3.5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />}
                        </h3>
                        <p className="text-[12px] font-semibold" style={{ color: INK }}>{job.company}</p>
                        {job.description && (
                          <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{job.description}</p>
                        )}
                      </div>
                      <div className={left ? "col-start-2" : ""} />
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <CenterTitle>Dự án</CenterTitle>
            <div className="mx-auto max-w-[62ch] space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item text-center">
                  <h3 className="font-bold" style={{ color: NAVY }}>{p.name || "Dự án"}</h3>
                  {p.role && <p className="text-[12px] font-semibold" style={{ color: ORANGE }}>{p.role}</p>}
                  {p.range && (p.range.start || p.range.end) && (
                    <p className="text-[12px] font-bold" style={{ color: NAVY }}>
                      <DateText range={p.range} />
                    </p>
                  )}
                  {p.description && (
                    <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{p.description}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <CenterTitle>Kỹ năng</CenterTitle>
            <div className="flex flex-wrap justify-center gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="cv-section-item rounded-full px-2.5 py-1 text-[12px] font-semibold"
                  style={{ color: NAVY, border: `1px solid ${NAVY}`, backgroundColor: "#ffffff" }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <CenterTitle>Học vấn</CenterTitle>
            <div className="mx-auto max-w-[62ch] space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold" style={{ color: NAVY }}>{edu.school || "Trường"}</h3>
                    {edu.degree && <p className="text-[12px] font-semibold" style={{ color: INK }}>{edu.degree}</p>}
                    {edu.description && (
                      <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{edu.description}</p>
                    )}
                  </div>
                  <DateText range={edu.range} className="text-[12px] font-bold" />
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <CenterTitle>Chứng chỉ</CenterTitle>
            <div className="mx-auto max-w-[62ch] space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item flex items-start justify-between gap-3">
                  <p className="flex items-start gap-1.5 text-[12px] font-semibold" style={{ color: INK }}>
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />
                    {c.name || "Chứng chỉ"}
                  </p>
                  {[c.issuer, c.date].filter(Boolean).length > 0 && (
                    <p className="shrink-0 text-[12px]" style={{ color: SUBTLE }}>
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
