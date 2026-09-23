"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const INK = "#44403c";
const SUBTLE = "#78716c";
const PINK = "#fce7f3";
const LAVENDER = "#ede9fe";
const MINT = "#d1fae5";

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
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: "#a855f7" }} strokeWidth={2} />;
}

function Card({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg }}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PastelStudioTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-6 py-6 text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="flex items-center gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full text-[18px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #f472b6, #a78bfa)" }}
        >
          {initials(data.name || "")}
        </span>
        <div>
          <h1 className="text-[24px] font-bold leading-tight tracking-tight" style={{ color: INK }}>
            {data.name || "Họ và tên"}
          </h1>
          {data.title && <p className="mt-0.5 text-[13px] font-medium" style={{ color: SUBTLE }}>{data.title}</p>}
        </div>
      </header>

      <div className="mt-4 grid grid-cols-[35%_65%] gap-3">
        <div className="space-y-3">
          {data.contacts.length > 0 && (
            <SectionShell>
              <Card bg={PINK}>
                <CardTitle>Liên hệ</CardTitle>
                <div className="space-y-1.5">
                  {data.contacts.map((c, i) => (
                    <p key={`${c.label}-${i}`} className="cv-section-item flex items-start gap-1.5 text-[12px]" style={{ color: SUBTLE }}>
                      <ContactIcon label={c.label} />
                      <span className="break-all">{c.value}</span>
                    </p>
                  ))}
                </div>
              </Card>
            </SectionShell>
          )}

          {data.skills.length > 0 && (
            <SectionShell>
              <Card bg={MINT}>
                <CardTitle>Kỹ năng</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => (
                    <span
                      key={s.id}
                      className="cv-section-item rounded-full bg-white px-2.5 py-0.5 text-[12px] font-semibold"
                      style={{ color: INK }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </Card>
            </SectionShell>
          )}

          {data.certificates.length > 0 && (
            <SectionShell>
              <Card bg={PINK}>
                <CardTitle>Chứng chỉ</CardTitle>
                <div className="space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item">
                      <p className="flex items-start gap-1.5 text-[12px] font-semibold" style={{ color: INK }}>
                        <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: "#a855f7" }} strokeWidth={2} />
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
              </Card>
            </SectionShell>
          )}
        </div>

        <div className="space-y-3">
          {data.summary && (
            <SectionShell>
              <Card bg={LAVENDER}>
                <CardTitle>Tóm tắt</CardTitle>
                <p className="cv-section-item whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{data.summary}</p>
              </Card>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <Card bg={MINT}>
                <CardTitle>Kinh nghiệm</CardTitle>
                <div className="space-y-3">
                  {data.experience.map((job) => (
                    <div key={job.id} className="cv-section-item rounded-xl bg-white/80 p-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: INK }}>
                          <Briefcase className="size-3.5 shrink-0" style={{ color: "#a855f7" }} strokeWidth={2} />
                          {job.role || "Chức danh"}
                        </h3>
                        <DateText range={job.range} className="text-[11px]" />
                      </div>
                      <p className="text-[12px] font-semibold" style={{ color: SUBTLE }}>{job.company}</p>
                      {job.description && (
                        <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{job.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </SectionShell>
          )}

          {data.projects.length > 0 && (
            <SectionShell>
              <Card bg={PINK}>
                <CardTitle>Dự án</CardTitle>
                <div className="space-y-2">
                  {data.projects.map((p) => (
                    <div key={p.id} className="cv-section-item rounded-xl bg-white/80 p-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[13px] font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                        {p.range && (p.range.start || p.range.end) && (
                          <DateText range={p.range} className="text-[11px]" />
                        )}
                      </div>
                      {p.role && <p className="text-[12px] font-semibold" style={{ color: SUBTLE }}>{p.role}</p>}
                      {p.description && (
                        <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{p.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </SectionShell>
          )}

          {data.education.length > 0 && (
            <SectionShell>
              <Card bg={LAVENDER}>
                <CardTitle>Học vấn</CardTitle>
                <div className="space-y-2">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="cv-section-item">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[13px] font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                        <DateText range={edu.range} className="text-[11px]" />
                      </div>
                      {edu.degree && <p className="text-[12px] font-semibold" style={{ color: SUBTLE }}>{edu.degree}</p>}
                      {edu.description && (
                        <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
