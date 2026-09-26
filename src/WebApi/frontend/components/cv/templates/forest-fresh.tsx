"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const LEAF = "#16a34a";
const LEAF_DARK = "#15803d";
const INK = "#1c2420";
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
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: LEAF }} strokeWidth={2} />;
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2
      className="mb-2.5 flex items-center gap-2 border-b pb-1.5 text-[12px] font-bold uppercase tracking-[0.16em]"
      style={{ color: LEAF_DARK, borderColor: "#bbf7d0" }}
    >
      {icon}
      {children}
    </h2>
  );
}

export function ForestFreshTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 bg-white px-7 py-6 text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="text-center">
        <BannerSlot data={data} className="mb-1 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: LEAF_DARK }} />
        <h1 className="text-[27px] font-bold leading-tight tracking-tight" style={{ color: INK }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: LEAF_DARK }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-2.5 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p key={`${c.label}-${i}`} className="cv-section-item flex min-w-0 items-start gap-1.5 text-[12px]" style={{ color: SUBTLE }}>
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
            <blockquote
              className="cv-section-item border-l-4 pl-4 font-serif text-[14px] italic leading-relaxed"
              style={{ borderColor: LEAF, color: INK }}
            >
              <span className="whitespace-pre-line break-words [overflow-wrap:anywhere]">{data.summary}</span>
            </blockquote>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <SectionTitle icon={<Briefcase className="size-4 shrink-0" style={{ color: LEAF }} strokeWidth={2} />}>
              Kinh nghiệm
            </SectionTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                    <DateText range={job.range} className="text-[11px]" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: LEAF_DARK }}>{job.company}</p>
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <SectionTitle icon={<Award className="size-4 shrink-0" style={{ color: LEAF }} strokeWidth={2} />}>
              Học vấn
            </SectionTitle>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="text-[11px]" />
                  </div>
                  {edu.degree && <p className="text-[12px] font-semibold" style={{ color: LEAF_DARK }}>{edu.degree}</p>}
                  {edu.description && (
                    <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <SectionTitle icon={<Award className="size-4 shrink-0" style={{ color: LEAF }} strokeWidth={2} />}>
              Kỹ năng
            </SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="cv-section-item rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{ color: LEAF_DARK, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <SectionTitle icon={<Briefcase className="size-4 shrink-0" style={{ color: LEAF }} strokeWidth={2} />}>
              Dự án
            </SectionTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11px]" />
                    )}
                  </div>
                  {p.role && <p className="text-[12px] font-semibold" style={{ color: LEAF_DARK }}>{p.role}</p>}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <SectionTitle icon={<Award className="size-4 shrink-0" style={{ color: LEAF }} strokeWidth={2} />}>
              Chứng chỉ
            </SectionTitle>
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <p className="flex items-start gap-1.5 text-[13px] font-semibold" style={{ color: INK }}>
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: LEAF }} strokeWidth={2} />
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

        {data.contacts.length > 0 && (
          <SectionShell>
            <SectionTitle icon={<Mail className="size-4 shrink-0" style={{ color: LEAF }} strokeWidth={2} />}>
              Liên hệ
            </SectionTitle>
            <div className="space-y-1">
              {data.contacts.map((c, i) => (
                <p key={`${c.label}-${i}`} className="cv-section-item text-[12px]" style={{ color: SUBTLE }}>
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
