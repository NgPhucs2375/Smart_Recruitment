"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const INK = "#1e3a5f";
const SUBTLE = "#5b6470";
const BLUE_BG = "#eff6ff";
const BLUE_BORDER = "#bfdbfe";
const TILE_BG = "#f8fafc";
const TILE_BORDER = "#e2e8f0";

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
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: INK }} strokeWidth={2} />;
}

function TileTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

export function BentoGridTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-6 py-6 text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="rounded-xl p-5" style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}` }}>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight" style={{ color: INK }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && <p className="mt-1 text-[13px] font-medium" style={{ color: SUBTLE }}>{data.title}</p>}
        {data.contacts.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p key={`${c.label}-${i}`} className="cv-section-item flex items-start gap-1.5 text-[12px]" style={{ color: SUBTLE }}>
                <ContactIcon label={c.label} />
                <span className="break-all">{c.value}</span>
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {data.projects.length > 0 && (
          <div className="col-span-2 rounded-xl p-4" style={{ backgroundColor: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}>
            <SectionShell>
              <TileTitle>Dự án</TileTitle>
              <div className="grid grid-cols-2 gap-2.5">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item rounded-xl border bg-white p-3" style={{ borderColor: BLUE_BORDER }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
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
            </SectionShell>
          </div>
        )}

        {data.summary && (
          <div className="rounded-xl p-4" style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}` }}>
            <SectionShell>
              <TileTitle>Tóm tắt</TileTitle>
              <p className="cv-section-item whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{data.summary}</p>
            </SectionShell>
          </div>
        )}

        {data.experience.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}` }}>
            <SectionShell>
              <TileTitle>Kinh nghiệm</TileTitle>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 font-bold" style={{ color: INK }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: INK }} strokeWidth={2} />
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
            </SectionShell>
          </div>
        )}

        {data.education.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}` }}>
            <SectionShell>
              <TileTitle>Học vấn</TileTitle>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                      <DateText range={edu.range} className="text-[11px]" />
                    </div>
                    {edu.degree && <p className="text-[12px] font-semibold" style={{ color: SUBTLE }}>{edu.degree}</p>}
                    {edu.description && (
                      <p className="mt-1 whitespace-pre-line text-[13px]" style={{ color: SUBTLE }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          </div>
        )}

        {(data.skills.length > 0 || data.certificates.length > 0) && (
          <div className="rounded-xl p-4" style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}` }}>
            <SectionShell>
              {data.skills.length > 0 && (
                <div>
                  <TileTitle>Kỹ năng</TileTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {data.skills.map((s) => (
                      <span
                        key={s.id}
                        className="cv-section-item rounded-xl border bg-white px-2.5 py-1 text-[12px] font-semibold"
                        style={{ color: INK, borderColor: BLUE_BORDER }}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.certificates.length > 0 && (
                <div className={data.skills.length > 0 ? "mt-3" : ""}>
                  <TileTitle>Chứng chỉ</TileTitle>
                  <div className="space-y-2">
                    {data.certificates.map((c) => (
                      <div key={c.id} className="cv-section-item">
                        <p className="flex items-start gap-1.5 text-[13px] font-semibold" style={{ color: INK }}>
                          <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: INK }} strokeWidth={2} />
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
                </div>
              )}
            </SectionShell>
          </div>
        )}

        {data.contacts.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}` }}>
            <SectionShell>
              <TileTitle>Liên hệ</TileTitle>
              <div className="space-y-1">
                {data.contacts.map((c, i) => (
                  <p key={`${c.label}-${i}`} className="cv-section-item text-[12px]" style={{ color: SUBTLE }}>
                    <span className="font-semibold" style={{ color: INK }}>{c.label}: </span>
                    {c.value}
                  </p>
                ))}
              </div>
            </SectionShell>
          </div>
        )}
      </div>
    </div>
  );
}
