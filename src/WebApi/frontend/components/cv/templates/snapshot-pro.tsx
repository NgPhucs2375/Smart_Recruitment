"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const CLAY = "#c2410c";
const CLAY_SOFT = "#faf7f2";
const INK = "#1f2937";
const SUBTLE = "#6b7280";

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ContactIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes("mail") || l.includes("email")) return <Mail className="size-3.5 shrink-0" style={{ color: CLAY }} strokeWidth={2} />;
  if (l.includes("điện") || l.includes("phone") || l.includes("sđt")) return <Phone className="size-3.5 shrink-0" style={{ color: CLAY }} strokeWidth={2} />;
  if (l.includes("địa chỉ") || l.includes("address")) return <MapPin className="size-3.5 shrink-0" style={{ color: CLAY }} strokeWidth={2} />;
  return <Globe className="size-3.5 shrink-0" style={{ color: CLAY }} strokeWidth={2} />;
}

function ContactCell({ contact }: { contact: ResumeContact }) {
  return (
    <p className="cv-section-item flex items-start gap-1.5 text-[12px] leading-relaxed" style={{ color: SUBTLE }}>
      <ContactIcon label={contact.label} />
      <span className="break-all">
        {contact.href ? (
          <a href={contact.href} className="underline decoration-neutral-300 underline-offset-2">
            {contact.value}
          </a>
        ) : (
          contact.value
        )}
      </span>
    </p>
  );
}

function RailTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: CLAY }}>
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b-2 pb-1 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: INK, borderColor: CLAY }}>
      {children}
    </h2>
  );
}

export function SnapshotProTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-4 pt-6">
        <div className="flex items-center gap-5">
          <div
            className="flex shrink-0 items-center justify-center rounded-full text-[28px] font-extrabold"
            style={{ width: 88, height: 88, backgroundColor: CLAY, color: "#ffffff" }}
          >
            {monogram(data.name)}
          </div>
          <div className="min-w-0">
            <BannerSlot data={data} className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: CLAY }} />
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">{data.name || "Họ và tên"}</h1>
            {data.title && (
              <p className="mt-1 text-[13px] font-semibold" style={{ color: CLAY }}>
                {data.title}
              </p>
            )}
          </div>
        </div>
        {data.contacts.length > 0 && (
          <SectionShell>
            <h2 className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: CLAY }}>
              Liên hệ
            </h2>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              {data.contacts.map((c, i) => (
                <ContactCell key={`${c.label}-${i}`} contact={c} />
              ))}
            </div>
          </SectionShell>
        )}
      </header>

      {data.summary && (
        <div className="px-7 pb-4">
          <SectionShell>
            <MainTitle>Tóm tắt</MainTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
          </SectionShell>
        </div>
      )}

      <div className="grid grid-cols-[65%_35%]">
        <div className="min-w-0 space-y-4 px-7 py-5">
          {data.experience.length > 0 && (
            <SectionShell>
              <MainTitle>Kinh nghiệm</MainTitle>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="flex items-start gap-1.5 font-bold">
                        <Briefcase className="mt-1 size-3.5 shrink-0" style={{ color: CLAY }} strokeWidth={2} />
                        {job.role || "Chức danh"}
                      </h3>
                      <DateText range={job.range} className="text-[12px]" />
                    </div>
                    {job.company && (
                      <p className="mt-0.5 text-[12px] font-semibold" style={{ color: CLAY }}>
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
          {data.projects.length > 0 && (
            <SectionShell>
              <MainTitle>Dự án</MainTitle>
              <div className="space-y-3">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold">{p.name || "Dự án"}</h3>
                      {p.range && (p.range.start || p.range.end) && <DateText range={p.range} className="text-[12px]" />}
                    </div>
                    {p.role && (
                      <p className="text-[12px] font-semibold" style={{ color: CLAY }}>
                        {p.role}
                      </p>
                    )}
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
                    )}
                    {p.tech.length > 0 && (
                      <p className="mt-1 text-[12px]" style={{ color: SUBTLE }}>
                        {p.tech.join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>

        <aside className="min-w-0 space-y-4 px-5 py-5" style={{ backgroundColor: CLAY_SOFT }}>
          {data.skills.length > 0 && (
            <SectionShell>
              <RailTitle>Kỹ năng</RailTitle>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s) => (
                  <span
                    key={s.id}
                    className="cv-section-item rounded-md bg-white px-2 py-1 text-[12px] font-semibold"
                    style={{ color: INK, border: "1px solid #e7e0d5" }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </SectionShell>
          )}
          {data.education.length > 0 && (
            <SectionShell>
              <RailTitle>Học vấn</RailTitle>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <h3 className="text-[12px] font-bold">{edu.school || "Trường"}</h3>
                    {edu.degree && (
                      <p className="text-[12px]" style={{ color: SUBTLE }}>
                        {edu.degree}
                      </p>
                    )}
                    <DateText range={edu.range} className="text-[12px]" />
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell>
              <RailTitle>Chứng chỉ</RailTitle>
              <div className="space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item">
                    <p className="flex items-start gap-1.5 text-[12px] font-semibold leading-snug">
                      <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: CLAY }} strokeWidth={2} />
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
        </aside>
      </div>
    </div>
  );
}
