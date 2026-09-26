"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const BROWN = "#78350f";
const ORANGE = "#ea580c";
const CREAM = "#fff7ed";
const CREAM_BORDER = "#fed7aa";
const SUBTLE = "#92600f";

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function WarmTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-center text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>
      {children}
    </h2>
  );
}

function HeadContact({ label, value, href }: { label: string; value: string; href?: string }) {
  const l = label.toLowerCase();
  const Icon = l.includes("mail") || l.includes("email")
    ? Mail
    : l.includes("điện") || l.includes("phone") || l.includes("sđt")
      ? Phone
      : l.includes("địa chỉ") || l.includes("address")
        ? MapPin
        : Globe;
  return (
    <p className="cv-section-item flex items-center justify-center gap-1.5 text-[12px]" style={{ color: BROWN }}>
      <Icon className="size-3.5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />
      <span className="break-all">{href ? <a href={href} className="underline decoration-orange-200 underline-offset-2">{value}</a> : value}</span>
    </p>
  );
}

export function HostWarmTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[13px] leading-relaxed" style={{ color: BROWN }}>
      <header className="px-7 pb-2 pt-6 text-center">
        <BannerSlot data={data} className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }} />
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[20px] font-extrabold"
          style={{ backgroundColor: ORANGE, color: "#ffffff" }}
        >
          {monogram(data.name)}
        </div>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight">{data.name || "Họ và tên"}</h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-semibold" style={{ color: ORANGE }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <SectionShell>
            <h2 className="mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>
              Liên hệ
            </h2>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              {data.contacts.map((c, i) => (
                <HeadContact key={`${c.label}-${i}`} label={c.label} value={c.value} href={c.href} />
              ))}
            </div>
          </SectionShell>
        )}
      </header>

      <div className="space-y-3 px-7 py-4">
        {data.skills.length > 0 && (
          <SectionShell>
            <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: CREAM, border: `1px solid ${CREAM_BORDER}` }}>
              <WarmTitle>Kỹ năng — Điểm mạnh</WarmTitle>
              <div className="flex flex-wrap justify-center gap-1.5">
                {data.skills.map((s) => (
                  <span
                    key={s.id}
                    className="cv-section-item rounded-full px-3 py-1 text-[12px] font-semibold"
                    style={{ backgroundColor: ORANGE, color: "#ffffff" }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.summary && (
          <SectionShell>
            <div className="rounded-2xl px-5 py-4 text-center" style={{ backgroundColor: CREAM, border: `1px solid ${CREAM_BORDER}` }}>
              <WarmTitle>Tóm tắt</WarmTitle>
              <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: BROWN }} />
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <WarmTitle>Kinh nghiệm</WarmTitle>
            <div className="space-y-2.5">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item rounded-2xl px-5 py-3.5" style={{ backgroundColor: CREAM, border: `1px solid ${CREAM_BORDER}` }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-start gap-1.5 font-bold">
                      <Briefcase className="mt-1 size-3.5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[12px]" />
                  </div>
                  {job.company && (
                    <p className="text-[12px] font-semibold" style={{ color: ORANGE }}>
                      {job.company}
                    </p>
                  )}
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: BROWN }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: CREAM, border: `1px solid ${CREAM_BORDER}` }}>
              <WarmTitle>Học vấn</WarmTitle>
              <div className="space-y-2.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item text-center">
                    <h3 className="text-[12px] font-bold">{edu.school || "Trường"}</h3>
                    {edu.degree && (
                      <p className="text-[12px]" style={{ color: SUBTLE }}>
                        {edu.degree}
                      </p>
                    )}
                    <DateText range={edu.range} className="text-[12px]" />
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: BROWN }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <WarmTitle>Dự án</WarmTitle>
            <div className="space-y-2.5">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item rounded-2xl px-5 py-3.5" style={{ backgroundColor: CREAM, border: `1px solid ${CREAM_BORDER}` }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && <DateText range={p.range} className="text-[12px]" />}
                  </div>
                  {p.role && (
                    <p className="text-[12px] font-semibold" style={{ color: ORANGE }}>
                      {p.role}
                    </p>
                  )}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: BROWN }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: CREAM, border: `1px solid ${CREAM_BORDER}` }}>
              <WarmTitle>Chứng chỉ</WarmTitle>
              <div className="space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item text-center">
                    <p className="flex items-start justify-center gap-1.5 text-[12px] font-semibold">
                      <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />
                      {c.name || "Chứng chỉ"}
                    </p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p className="mt-0.5 text-[12px]" style={{ color: SUBTLE }}>
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
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
