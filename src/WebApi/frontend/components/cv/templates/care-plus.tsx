"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const MED = "#0284c7";
const MED_STRIP = "#e0f2fe";
const INK = "#1f2937";
const SUBTLE = "#5b6470";

function MedTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: MED }}>
      {children}
    </h2>
  );
}

function ContactInline({ label, value, href }: { label: string; value: string; href?: string }) {
  const l = label.toLowerCase();
  const Icon = l.includes("mail") || l.includes("email")
    ? Mail
    : l.includes("điện") || l.includes("phone") || l.includes("sđt")
      ? Phone
      : l.includes("địa chỉ") || l.includes("address")
        ? MapPin
        : Globe;
  return (
    <p className="cv-section-item flex items-center gap-1.5 text-[12px]" style={{ color: INK }}>
      <Icon className="size-3.5 shrink-0" style={{ color: MED }} strokeWidth={2} />
      <span className="break-all">{href ? <a href={href} className="underline decoration-sky-300 underline-offset-2">{value}</a> : value}</span>
    </p>
  );
}

export function CarePlusTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      <header>
        <BannerSlot data={data} className="mb-1 px-7 pt-5 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: MED }} />
        <div className="flex items-center gap-4 px-7 pb-4 pt-6">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[32px] font-bold leading-none"
            style={{ backgroundColor: MED, color: "#ffffff" }}
          >
            +
          </div>
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">{data.name || "Họ và tên"}</h1>
            {data.title && (
              <p className="mt-0.5 text-[13px] font-semibold" style={{ color: MED }}>
                {data.title}
              </p>
            )}
          </div>
        </div>
        {data.contacts.length > 0 && (
          <div className="px-7 py-3" style={{ backgroundColor: MED_STRIP }}>
            <SectionShell>
              <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: MED }}>
                Liên hệ
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {data.contacts.map((c, i) => (
                  <ContactInline key={`${c.label}-${i}`} label={c.label} value={c.value} href={c.href} />
                ))}
              </div>
            </SectionShell>
          </div>
        )}
      </header>

      {data.certificates.length > 0 && (
        <div className="px-7 pt-4">
          <SectionShell>
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: MED }}>
              <h2 className="mb-1.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "#ffffff" }}>
                <Award className="size-4 shrink-0" style={{ color: "#ffffff" }} strokeWidth={2} />
                Chứng chỉ
              </h2>
              <div className="space-y-1.5">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item">
                    <p className="text-[12px] font-semibold" style={{ color: "#ffffff" }}>
                      {c.name || "Chứng chỉ"}
                    </p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p className="text-[12px]" style={{ color: "#e0f2fe" }}>
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        </div>
      )}

      <div className="space-y-4 px-7 py-5">
        {data.summary && (
          <SectionShell>
            <MedTitle>Tóm tắt</MedTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
          </SectionShell>
        )}
        {data.experience.length > 0 && (
          <SectionShell>
            <MedTitle>Kinh nghiệm</MedTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item border-l-4 pl-3" style={{ borderColor: MED_STRIP }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-start gap-1.5 font-bold">
                      <Briefcase className="mt-1 size-3.5 shrink-0" style={{ color: MED }} strokeWidth={2} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[12px]" />
                  </div>
                  {job.company && (
                    <p className="text-[12px] font-semibold" style={{ color: MED }}>
                      {job.company}
                    </p>
                  )}
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
        {data.education.length > 0 && (
          <SectionShell>
            <MedTitle>Học vấn</MedTitle>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{edu.school || "Trường"}</h3>
                    <DateText range={edu.range} className="text-[12px]" />
                  </div>
                  {edu.degree && (
                    <p className="text-[12px] font-semibold" style={{ color: MED }}>
                      {edu.degree}
                    </p>
                  )}
                  {edu.description && (
                    <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
        {data.skills.length > 0 && (
          <SectionShell>
            <MedTitle>Kỹ năng</MedTitle>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="cv-section-item rounded-full px-2.5 py-1 text-[12px] font-semibold"
                  style={{ backgroundColor: MED_STRIP, color: MED }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        )}
        {data.projects.length > 0 && (
          <SectionShell>
            <MedTitle>Dự án</MedTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && <DateText range={p.range} className="text-[12px]" />}
                  </div>
                  {p.role && (
                    <p className="text-[12px] font-semibold" style={{ color: MED }}>
                      {p.role}
                    </p>
                  )}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
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
