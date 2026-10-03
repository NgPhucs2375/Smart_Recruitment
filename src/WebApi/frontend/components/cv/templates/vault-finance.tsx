"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { BannerSlot, DateText, EmptyPaper, SectionShell, SplitBlocks } from "./shared";

const NAVY = "#0f2a44";
const GOLD = "#c9a227";
const INK = "#1f2937";
const SUBTLE = "#5b6470";

function VaultTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b-2 pb-1 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: NAVY, borderColor: GOLD }}>
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
    <p className="cv-section-item flex items-center gap-1.5 text-[12px]" style={{ color: "#d7e0ec" }}>
      <Icon className="size-3.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
      <span className="break-all">{href ? <a href={href} className="underline decoration-slate-500 underline-offset-2">{value}</a> : value}</span>
    </p>
  );
}

export function VaultFinanceTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="px-7 pb-5 pt-6" style={{ backgroundColor: NAVY }}>
        <BannerSlot data={data} className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }} />
        <h1 className="text-[26px] font-bold leading-tight tracking-tight" style={{ color: "#ffffff" }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-semibold" style={{ color: GOLD }}>
            {data.title}
          </p>
        )}
        <div className="mt-3 h-0.5 w-full" style={{ backgroundColor: GOLD }} />
        {data.contacts.length > 0 && (
          <SectionShell>
            <h2 className="mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
              Liên hệ
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {data.contacts.map((c, i) => (
                <HeadContact key={`${c.label}-${i}`} label={c.label} value={c.value} href={c.href} />
              ))}
            </div>
          </SectionShell>
        )}
      </header>

      <div className="space-y-4 px-7 py-5">
        {data.summary && (
          <SectionShell>
            <VaultTitle>Tóm tắt</VaultTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] border-l-2 pl-3 text-[12px]" style={{ color: SUBTLE, borderColor: GOLD }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <VaultTitle>Kinh nghiệm</VaultTitle>
            <div>
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item border-b py-2.5" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-start gap-1.5 font-bold" style={{ color: NAVY }}>
                      <Briefcase className="mt-1 size-3.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[12px]" />
                  </div>
                  {job.company && (
                    <p className="mt-0.5 pl-5 text-[12px] font-semibold" style={{ color: SUBTLE }}>
                      {job.company}
                    </p>
                  )}
                  {job.description && (
                    <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] pl-5 text-[12px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <VaultTitle>Học vấn</VaultTitle>
            <div>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item flex items-baseline justify-between gap-3 border-b py-2" style={{ borderColor: "#e5e7eb" }}>
                  <p className="min-w-0 text-[12px]">
                    <span className="font-bold" style={{ color: NAVY }}>{edu.school || "Trường"}</span>
                    {edu.degree && <span style={{ color: SUBTLE }}> · {edu.degree}</span>}
                  </p>
                  <DateText range={edu.range} className="text-[12px]" />
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <VaultTitle>Kỹ năng</VaultTitle>
            <p className="cv-section-item text-[12px] leading-relaxed" style={{ color: SUBTLE, fontFamily: "var(--font-serif)" }}>
              {data.skills.map((s) => s.name).join(", ")}
            </p>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <VaultTitle>Dự án</VaultTitle>
            <div>
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item border-b py-2" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold" style={{ color: NAVY }}>{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && <DateText range={p.range} className="text-[12px]" />}
                  </div>
                  {p.role && (
                    <p className="text-[12px]" style={{ color: SUBTLE }}>{p.role}</p>
                  )}
                  {p.description && (
                    <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <VaultTitle>Chứng chỉ</VaultTitle>
            <div className="space-y-1.5">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <p className="flex items-start gap-1.5 text-[12px] font-semibold">
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
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
      </div>

      {data.contacts.length > 0 && (
        <footer className="border-t px-7 pb-6 pt-3 text-center text-[12px] italic" style={{ color: SUBTLE, borderColor: GOLD }}>
          Tham chiếu theo yêu cầu
        </footer>
      )}
    </div>
  );
}
