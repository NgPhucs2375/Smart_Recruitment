"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const CORAL = "#f43f5e";
const VIOLET = "#7c3aed";
const INK = "#1f2a37";
const MUTED = "#5b6470";

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
  return <Icon className="size-3.5 shrink-0" style={{ color: CORAL }} strokeWidth={2} />;
}

function MotionLines({ color }: { color: string }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1">
      <div className="h-1 rounded-full" style={{ width: "34px", backgroundColor: color }} />
      <div className="h-1 rounded-full" style={{ width: "22px", backgroundColor: color }} />
      <div className="h-1 rounded-full" style={{ width: "28px", backgroundColor: color }} />
    </div>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <MotionLines color={accent} />
      <h2 className="text-[12px] font-extrabold uppercase" style={{ color: INK, letterSpacing: "0.16em" }}>
        {children}
      </h2>
    </div>
  );
}

function ContactPill({ contact }: { contact: ResumeContact }) {
  return (
    <p
      className="cv-section-item flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11.5px] font-medium"
      style={{ color: MUTED }}
    >
      <ContactIcon label={contact.label} />
      {contact.href ? (
        <a href={contact.href} className="break-all underline decoration-neutral-200 underline-offset-2">
          {contact.value}
        </a>
      ) : (
        <span className="break-all">{contact.value}</span>
      )}
    </p>
  );
}

export function MotionCreativeTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      {/* Slanted header band */}
      <header className="relative overflow-hidden px-7 pb-7 pt-6">
        <div
          aria-hidden="true"
          className="absolute inset-x-[-20px] top-[-26px] h-[168px]"
          style={{ backgroundColor: CORAL, transform: "skewY(-4deg)" }}
        />
        <div
          aria-hidden="true"
          className="absolute right-8 top-4 size-14 rounded-2xl"
          style={{ backgroundColor: VIOLET, transform: "rotate(12deg)" }}
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <MotionLines color="#ffffff" />
            <p className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase text-white" style={{ letterSpacing: "0.2em" }}>
              Portfolio · CV
            </p>
          </div>
          <h1 className="mt-3 text-[28px] font-black leading-tight tracking-tight text-white">
            {data.name || "Họ và tên"}
          </h1>
          {data.title && <p className="mt-1 text-[13.5px] font-semibold text-white">{data.title}</p>}
        </div>
      </header>

      <div className="space-y-4 px-7 pb-8">
        {data.contacts.length > 0 && (
          <SectionShell>
            <div className="cv-section-item -mt-4 flex flex-wrap gap-1.5">
              {data.contacts.map((c, i) => (
                <ContactPill key={`${c.label}-${i}`} contact={c} />
              ))}
            </div>
          </SectionShell>
        )}

        {data.summary && (
          <SectionShell>
            <div className="cv-section-item rounded-3xl bg-neutral-50 p-5" style={{ border: `2px solid ${VIOLET}` }}>
              <SectionTitle accent={VIOLET}>Tóm tắt</SectionTitle>
              <p className="whitespace-pre-line" style={{ color: MUTED }}>
                {data.summary}
              </p>
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <div>
              <SectionTitle accent={CORAL}>Kinh nghiệm</SectionTitle>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item rounded-2xl border border-neutral-200 bg-white p-4" style={{ borderLeft: `6px solid ${CORAL}` }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 font-bold" style={{ color: INK }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: CORAL }} strokeWidth={2} />
                        {job.role || "Chức danh"}
                      </h3>
                      <DateText range={job.range} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold" />
                    </div>
                    <p className="mt-0.5 text-[12.5px] font-bold" style={{ color: VIOLET }}>
                      {job.company}
                    </p>
                    {job.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: MUTED }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <div className="cv-section-item rounded-3xl p-5" style={{ backgroundColor: VIOLET }}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <MotionLines color="#ffffff" />
                <h2 className="text-[12px] font-extrabold uppercase text-white" style={{ letterSpacing: "0.16em" }}>
                  Kỹ năng
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s, i) => (
                  <span
                    key={s.id}
                    className="cv-section-item rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{ backgroundColor: "#ffffff", color: i % 2 === 0 ? CORAL : VIOLET }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <div>
              <SectionTitle accent={VIOLET}>Dự án</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item rounded-2xl border border-neutral-200 bg-white p-4" style={{ borderTop: `5px solid ${VIOLET}` }}>
                    <h3 className="text-[12.5px] font-bold leading-snug" style={{ color: INK }}>
                      {p.name || "Dự án"}
                    </h3>
                    {p.role && (
                      <p className="text-[12px] font-semibold" style={{ color: CORAL }}>
                        {p.role}
                        {p.link ? ` · ${p.link}` : ""}
                      </p>
                    )}
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11px]" />
                    )}
                    {p.description && (
                      <p className="mt-1 whitespace-pre-line text-[12px]" style={{ color: MUTED }}>
                        {p.description}
                      </p>
                    )}
                    {p.tech.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.tech.map((t, i) => (
                          <span
                            key={`${p.id}-${i}`}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white"
                            style={{ backgroundColor: i % 2 === 0 ? CORAL : VIOLET }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <div>
              <SectionTitle accent={CORAL}>Học vấn</SectionTitle>
              <div className="space-y-2.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item rounded-2xl bg-neutral-50 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>
                        {edu.school || "Trường"}
                      </h3>
                      <DateText range={edu.range} className="text-[11.5px]" />
                    </div>
                    {edu.degree && (
                      <p className="text-[12.5px] font-semibold" style={{ color: CORAL }}>
                        {edu.degree}
                      </p>
                    )}
                    {edu.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: MUTED }}>
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <div>
              <SectionTitle accent={VIOLET}>Chứng chỉ</SectionTitle>
              <div className="space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item flex items-start gap-2 rounded-2xl border border-neutral-200 p-3">
                    <span className="rounded-full p-1.5" style={{ backgroundColor: "#fff1f2" }}>
                      <Award className="size-3.5" style={{ color: CORAL }} strokeWidth={2} />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-bold leading-snug" style={{ color: INK }}>
                        {c.name || "Chứng chỉ"}
                      </p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p className="text-[11.5px]" style={{ color: MUTED }}>
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}
      </div>
    </div>
  );
}
