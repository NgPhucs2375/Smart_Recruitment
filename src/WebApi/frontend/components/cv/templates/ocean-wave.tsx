"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const SEA = "#0284c7";
const SEA_DARK = "#075985";
const INK = "#1f2937";
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
  return <Icon className="mt-0.5 size-3.5 shrink-0 text-white" strokeWidth={2} />;
}

function SideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2.5 border-b-4 border-double pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em]"
      style={{ color: SEA_DARK, borderColor: SEA, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}
    >
      {children}
    </h2>
  );
}

export function OceanWaveTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      <div className="grid grid-cols-[34%_66%]">
        <aside className="min-w-0 px-5 py-6 text-white" style={{ backgroundColor: SEA }}>
          <div className="space-y-5">
            <div>
              <BannerSlot data={data} className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.7)" }} />
              <p className="text-[22px] font-bold leading-tight text-white">{data.name || "Họ và tên"}</p>
              {data.title && <p className="mt-1 text-[12px] font-medium text-white/90">{data.title}</p>}
            </div>

            {data.contacts.length > 0 && (
              <div className="cv-section-item">
                <SideTitle>Liên hệ</SideTitle>
                <div className="space-y-1.5">
                  {data.contacts.map((c, i) => (
                    <p key={`${c.label}-${i}`} className="flex items-start gap-2 text-[12px] leading-relaxed text-white">
                      <ContactIcon label={c.label} />
                      <span className="break-all">{c.value}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {data.skills.length > 0 && (
              <div className="cv-section-item">
                <SideTitle>Kỹ năng</SideTitle>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full border border-white/70 bg-white/10 px-2.5 py-0.5 text-[12px] font-semibold text-white"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.certificates.length > 0 && (
              <div className="cv-section-item">
                <SideTitle>Chứng chỉ</SideTitle>
                <div className="space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.id}>
                      <p className="flex items-start gap-1.5 text-[12px] font-semibold leading-snug text-white">
                        <Award className="mt-0.5 size-3.5 shrink-0 text-white" strokeWidth={2} />
                        {c.name || "Chứng chỉ"}
                      </p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p className="mt-0.5 pl-5 text-[11px] text-white/85">
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-4 bg-white px-6 py-6">
          {data.summary && (
            <SectionShell>
              <MainTitle>Tóm tắt</MainTitle>
              <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <MainTitle>Kinh nghiệm</MainTitle>
              <div className="space-y-3 border-l-2 pl-4" style={{ borderColor: "#bae6fd" }}>
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item relative">
                    <span
                      className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: SEA }}
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 font-bold" style={{ color: INK }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: SEA }} strokeWidth={2} />
                        {job.role || "Chức danh"}
                      </h3>
                      <DateText range={job.range} className="text-[11px]" />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: SEA_DARK }}>{job.company}</p>
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
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
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                      {p.range && (p.range.start || p.range.end) && (
                        <DateText range={p.range} className="text-[11px]" />
                      )}
                    </div>
                    {p.role && <p className="text-[12px] font-semibold" style={{ color: SEA_DARK }}>{p.role}</p>}
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
              <MainTitle>Học vấn</MainTitle>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                      <DateText range={edu.range} className="text-[11px]" />
                    </div>
                    {edu.degree && <p className="text-[12px] font-semibold" style={{ color: SEA_DARK }}>{edu.degree}</p>}
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
