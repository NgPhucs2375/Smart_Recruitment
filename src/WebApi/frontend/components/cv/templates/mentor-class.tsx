"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const WARM = "#ea580c";
const CREAM = "#fff7ed";
const INK = "#1f2937";
const SUBTLE = "#6b7280";

function WarmTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b-2 pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: WARM, borderColor: WARM }}>
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
    <p className="cv-section-item flex items-center gap-1.5 text-[12px]" style={{ color: SUBTLE }}>
      <Icon className="size-3.5 shrink-0" style={{ color: WARM }} strokeWidth={2} />
      <span className="break-all">{href ? <a href={href} className="underline decoration-orange-200 underline-offset-2">{value}</a> : value}</span>
    </p>
  );
}

export function MentorClassTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[13px] leading-relaxed" style={{ color: INK }}>
      <header className="border-b-4 px-7 pb-5 pt-6" style={{ backgroundColor: CREAM, borderColor: WARM }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: WARM }}>
          {resolveBannerTitle3(data, data.title, "Hồ sơ năng lực")}
        </p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight">{data.name || "Họ và tên"}</h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-semibold" style={{ color: WARM }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <SectionShell>
            <h2 className="mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: WARM }}>
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
        {data.education.length > 0 && (
          <SectionShell>
            <WarmTitle>Học vấn</WarmTitle>
            <div>
              <div className="grid grid-cols-[38%_32%_30%] gap-2 border-b-2 pb-1 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ borderColor: WARM, color: SUBTLE }}>
                <span>Trường</span>
                <span>Chuyên ngành</span>
                <span className="text-right">Thời gian</span>
              </div>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item grid grid-cols-[38%_32%_30%] gap-2 border-b py-2" style={{ borderColor: "#f3e3d3" }}>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold">{edu.school || "Trường"}</p>
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
                    )}
                  </div>
                  <p className="min-w-0 text-[12px]" style={{ color: SUBTLE }}>{edu.degree || "—"}</p>
                  <div className="min-w-0 text-right">
                    <DateText range={edu.range} className="text-[12px]" />
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.summary && (
          <SectionShell>
            <WarmTitle>Tóm tắt</WarmTitle>
            <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: SUBTLE }} />
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <WarmTitle>Kinh nghiệm</WarmTitle>
            <div className="space-y-3">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-start gap-1.5 font-bold">
                      <Briefcase className="mt-1 size-3.5 shrink-0" style={{ color: WARM }} strokeWidth={2} />
                      {job.role || "Chức danh"}
                    </h3>
                    <DateText range={job.range} className="text-[12px]" />
                  </div>
                  {job.company && (
                    <p className="text-[12px] font-semibold" style={{ color: WARM }}>
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

        {data.skills.length > 0 && (
          <SectionShell>
            <WarmTitle>Kỹ năng</WarmTitle>
            <ul className="list-disc space-y-1 pl-5">
              {data.skills.map((s) => (
                <li key={s.id} className="cv-section-item text-[12px] font-medium">
                  {s.name}
                </li>
              ))}
            </ul>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <WarmTitle>Dự án</WarmTitle>
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{p.name || "Dự án"}</h3>
                    {p.range && (p.range.start || p.range.end) && <DateText range={p.range} className="text-[12px]" />}
                  </div>
                  {p.role && (
                    <p className="text-[12px] font-semibold" style={{ color: WARM }}>
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

        {data.certificates.length > 0 && (
          <SectionShell>
            <WarmTitle>Chứng chỉ</WarmTitle>
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item">
                  <p className="flex items-start gap-1.5 text-[12px] font-semibold">
                    <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: WARM }} strokeWidth={2} />
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
    </div>
  );
}
