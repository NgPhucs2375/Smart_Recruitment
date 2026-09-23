"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const SLATE = "#334155";
const STEEL = "#475569";
const BG = "#f8fafc";
const LINE = "#94a3b8";

function TechLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] font-semibold uppercase" style={{ color: STEEL, letterSpacing: "0.22em" }}>
      {children}
    </p>
  );
}

function Frame({ label, code, children }: { label: string; code: string; children: React.ReactNode }) {
  return (
    <div className="p-4" style={{ border: `1px solid ${LINE}`, backgroundColor: "#ffffff" }}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <TechLabel>{label}</TechLabel>
        <span className="font-mono text-[9px]" style={{ color: LINE }}>
          {code}
        </span>
      </div>
      {children}
    </div>
  );
}

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
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: STEEL }} strokeWidth={2} />;
}

function TitleBlockCell({ label, contact }: { label: string; contact?: ResumeContact }) {
  return (
    <div className="px-3 py-2" style={{ border: `1px solid ${LINE}` }}>
      <TechLabel>{label}</TechLabel>
      <p className="mt-0.5 truncate text-[12px] font-semibold" style={{ color: SLATE }}>
        {contact ? (
          contact.href ? (
            <a href={contact.href} className="underline decoration-slate-300 underline-offset-2">
              {contact.value}
            </a>
          ) : (
            contact.value
          )
        ) : (
          <span style={{ color: LINE }}>—</span>
        )}
      </p>
    </div>
  );
}

export function ArchiPortfolioTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  const findContact = (match: (c: ResumeContact) => boolean) => data.contacts.find(match);

  return (
    <div className="cv-paper cv-paper-a4 text-[13px] leading-relaxed" style={{ color: SLATE, backgroundColor: BG }}>
      {/* Title block */}
      <header className="px-6 pt-6">
        <div style={{ border: `1px solid ${LINE}`, backgroundColor: "#ffffff" }}>
          <div className="flex items-end justify-between gap-4 px-4 pb-3 pt-4">
            <div>
              <TechLabel>Bản vẽ · Hồ sơ ứng viên</TechLabel>
              <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight" style={{ color: SLATE }}>
                {data.name || "Họ và tên"}
              </h1>
              {data.title && (
                <p className="mt-0.5 text-[13px] font-semibold" style={{ color: STEEL }}>
                  {data.title}
                </p>
              )}
            </div>
            <p className="font-mono text-[9px]" style={{ color: LINE }}>
              SHEET A-01 · SCALE 1:1
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            <TitleBlockCell
              label="Email"
              contact={findContact((c) => c.label.toLowerCase().includes("mail"))}
            />
            <TitleBlockCell
              label="Điện thoại"
              contact={findContact((c) => c.label.includes("Điện"))}
            />
            <TitleBlockCell
              label="Địa chỉ"
              contact={findContact((c) => c.label.includes("Địa"))}
            />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-6 py-5">
        {data.contacts.length > 3 && (
          <SectionShell>
            <Frame label="Liên hệ bổ sung" code="SEC-00">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {data.contacts.slice(3).map((c, i) => (
                  <p key={`${c.label}-${i}`} className="cv-section-item flex items-start gap-2 text-[12px]" style={{ color: STEEL }}>
                    <ContactIcon label={c.label} />
                    <span className="break-all">
                      <span className="font-semibold" style={{ color: SLATE }}>
                        {c.label}:{" "}
                      </span>
                      {c.href ? (
                        <a href={c.href} className="underline decoration-slate-300 underline-offset-2">
                          {c.value}
                        </a>
                      ) : (
                        c.value
                      )}
                    </span>
                  </p>
                ))}
              </div>
            </Frame>
          </SectionShell>
        )}

        {data.summary && (
          <SectionShell>
            <Frame label="Tóm tắt · Ghi chú chung" code="SEC-01">
              <p className="cv-section-item whitespace-pre-line" style={{ color: STEEL }}>
                {data.summary}
              </p>
            </Frame>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <Frame label="Kinh nghiệm · Mặt cắt" code="SEC-02">
              <div className="space-y-3">
                {data.experience.map((job, i) => (
                  <div key={job.id} className="cv-section-item px-3 py-2" style={{ borderLeft: `2px solid ${LINE}` }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 font-bold" style={{ color: SLATE }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: STEEL }} strokeWidth={2} />
                        <span>
                          {String(i + 1).padStart(2, "0")} · {job.role || "Chức danh"}
                        </span>
                      </h3>
                      <DateText range={job.range} className="text-[11.5px]" />
                    </div>
                    <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: STEEL }}>
                      {job.company}
                    </p>
                    {job.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: STEEL }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Frame>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <Frame label="Dự án · Mặt bằng" code="SEC-03">
              <div className="grid grid-cols-2 gap-3">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item p-3" style={{ border: `1px solid ${LINE}` }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[12.5px] font-bold leading-snug" style={{ color: SLATE }}>
                        {p.name || "Dự án"}
                      </h3>
                    </div>
                    {p.role && (
                      <p className="text-[12px] font-semibold" style={{ color: STEEL }}>
                        {p.role}
                      </p>
                    )}
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11px]" />
                    )}
                    {p.description && (
                      <p className="mt-1 whitespace-pre-line text-[12px]" style={{ color: STEEL }}>
                        {p.description}
                      </p>
                    )}
                    {p.tech.length > 0 && (
                      <p className="mt-1 text-[11.5px]" style={{ color: STEEL }}>
                        {p.tech.join(" / ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Frame>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <Frame label="Học vấn" code="SEC-04">
              <div className="space-y-2.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: SLATE }}>
                        {edu.school || "Trường"}
                      </h3>
                      <DateText range={edu.range} className="text-[11.5px]" />
                    </div>
                    {edu.degree && (
                      <p className="text-[12.5px] font-semibold" style={{ color: STEEL }}>
                        {edu.degree}
                      </p>
                    )}
                    {edu.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: STEEL }}>
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Frame>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <Frame label="Kỹ năng · Bảng vật liệu" code="SEC-05">
              <div className="cv-section-item grid grid-cols-2 gap-x-4 gap-y-1">
                {data.skills.map((s, i) => (
                  <p key={s.id} className="cv-section-item flex gap-2 border-b border-dashed pb-1 text-[12.5px]" style={{ borderColor: LINE, color: SLATE }}>
                    <span className="font-mono text-[11px]" style={{ color: STEEL }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium">{s.name}</span>
                  </p>
                ))}
              </div>
            </Frame>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <Frame label="Chứng chỉ" code="SEC-06">
              <div className="space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item">
                    <p className="flex items-start gap-1.5 text-[12px] font-semibold leading-snug" style={{ color: SLATE }}>
                      <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: STEEL }} strokeWidth={2} />
                      {c.name || "Chứng chỉ"}
                    </p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p className="mt-0.5 pl-5 text-[11.5px]" style={{ color: STEEL }}>
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Frame>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
