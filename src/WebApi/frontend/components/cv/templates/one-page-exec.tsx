"use client";

import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const INK = "#1f2937";
const SUBTLE = "#5b6470";
const ACCENT = "#334155";

function MiniIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes("mail") || l.includes("email")) return <Mail className="size-3 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />;
  if (l.includes("điện") || l.includes("phone") || l.includes("sđt")) return <Phone className="size-3 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />;
  if (l.includes("địa chỉ") || l.includes("address")) return <MapPin className="size-3 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />;
  return <Globe className="size-3 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />;
}

function HeadContact({ contact }: { contact: ResumeContact }) {
  return (
    <p className="cv-section-item flex items-start gap-1.5 text-[11px] leading-snug" style={{ color: SUBTLE }}>
      <MiniIcon label={contact.label} />
      <span className="break-all">{contact.value}</span>
    </p>
  );
}

function DenseTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1.5 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: INK, borderColor: "#cbd5e1" }}>
      {children}
    </h2>
  );
}

export function OnePageExecTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  const address = data.contacts.find((c) => c.label.toLowerCase().includes("địa chỉ") || c.label.toLowerCase().includes("address"));
  const others = data.contacts.filter((c) => c !== address);

  return (
    <div className="cv-paper cv-paper-a4 text-[12px] leading-snug" style={{ color: INK }}>
      <header className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b-2 px-6 pb-3 pt-4" style={{ borderColor: ACCENT }}>
        <SectionShell>
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
            Liên hệ
          </h2>
          <div className="space-y-1">
            {others.map((c, i) => (
              <HeadContact key={`${c.label}-${i}`} contact={c} />
            ))}
            {others.length === 0 && <p className="text-[11px]" style={{ color: SUBTLE }}>—</p>}
          </div>
        </SectionShell>
        <div className="min-w-0 max-w-[260px] text-center">
          <h1 className="text-[20px] font-bold leading-tight tracking-tight">{data.name || "Họ và tên"}</h1>
          {data.title && (
            <p className="mt-0.5 text-[12px] font-semibold" style={{ color: ACCENT }}>
              {data.title}
            </p>
          )}
          {data.summary && <p className="mx-auto mt-1 line-clamp-2 max-w-[240px] text-[11px]" style={{ color: SUBTLE }}>{data.summary}</p>}
        </div>
        <div className="text-right">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
            Địa chỉ
          </h2>
          {address ? (
            <p className="cv-section-item flex items-start justify-end gap-1.5 text-[11px] leading-snug" style={{ color: SUBTLE }}>
              <span className="break-all">{address.value}</span>
              <MapPin className="size-3 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
            </p>
          ) : (
            <p className="text-[11px]" style={{ color: SUBTLE }}>—</p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-[60%_40%] gap-5 px-6 py-3">
        <div className="min-w-0 space-y-3">
          {data.experience.length > 0 && (
            <SectionShell>
              <DenseTitle>Kinh nghiệm</DenseTitle>
              <div className="space-y-1.5">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[12px]">
                        <span className="font-bold">{job.role || "Chức danh"}</span>
                        {job.company && <span style={{ color: SUBTLE }}> · {job.company}</span>}
                      </p>
                      <DateText range={job.range} className="text-[11px]" />
                    </div>
                    {job.description && (
                      <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-[11px]" style={{ color: SUBTLE }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.projects.length > 0 && (
            <SectionShell>
              <DenseTitle>Dự án</DenseTitle>
              <div className="space-y-1.5">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[12px]">
                        <span className="font-bold">{p.name || "Dự án"}</span>
                        {p.role && <span style={{ color: SUBTLE }}> · {p.role}</span>}
                      </p>
                      {p.range && (p.range.start || p.range.end) && <DateText range={p.range} className="text-[11px]" />}
                    </div>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-[11px]" style={{ color: SUBTLE }}>
                        {p.description}
                      </p>
                    )}
                    {p.tech.length > 0 && (
                      <p className="truncate text-[11px]" style={{ color: SUBTLE }}>{p.tech.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          {data.skills.length > 0 && (
            <SectionShell>
              <DenseTitle>Kỹ năng</DenseTitle>
              <p className="cv-section-item text-[11px] leading-relaxed" style={{ color: SUBTLE }}>
                {data.skills.map((s) => s.name).join(", ")}
              </p>
            </SectionShell>
          )}
          {data.education.length > 0 && (
            <SectionShell>
              <DenseTitle>Học vấn</DenseTitle>
              <div className="space-y-1.5">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <p className="text-[12px]">
                      <span className="font-bold">{edu.school || "Trường"}</span>
                      {edu.degree && <span style={{ color: SUBTLE }}> · {edu.degree}</span>}
                    </p>
                    <DateText range={edu.range} className="text-[11px]" />
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell>
              <DenseTitle>Chứng chỉ</DenseTitle>
              <div className="space-y-1">
                {data.certificates.map((c) => (
                  <p key={c.id} className="cv-section-item truncate text-[11px]" style={{ color: SUBTLE }}>
                    <span className="font-semibold" style={{ color: INK }}>{c.name || "Chứng chỉ"}</span>
                    {[c.issuer, c.date].filter(Boolean).length > 0 ? ` · ${[c.issuer, c.date].filter(Boolean).join(" · ")}` : ""}
                  </p>
                ))}
              </div>
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
