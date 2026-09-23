"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

const NAVY = "#1e3a5f";
const GOLD = "#8a6d2f";
const INK = "#1f2a37";
const MUTED = "#5b6470";
const SERIF = "Georgia, 'Times New Roman', serif";

function toRoman(num: number): string {
  const table: Array<[number, string]> = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [value, symbol] of table) {
    while (n >= value) {
      out += symbol;
      n -= value;
    }
  }
  return out || String(num);
}

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
  return <Icon className="size-3.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />;
}

function CenterTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ backgroundColor: GOLD }} />
      <h2 className="text-[11px] font-bold uppercase" style={{ color: NAVY, letterSpacing: "0.3em" }}>
        {children}
      </h2>
      <div className="h-px flex-1" style={{ backgroundColor: GOLD }} />
    </div>
  );
}

export function LegalPrestigeTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  return (
    <div className="cv-paper cv-paper-a4 bg-white text-center text-[13px] leading-relaxed" style={{ color: INK }}>
      {/* Double-rule header */}
      <header className="px-8 pb-5 pt-7">
        <div className="border-b-4 border-t-4 border-double px-4 py-5" style={{ borderColor: GOLD }}>
          <p className="text-[10.5px] font-semibold uppercase" style={{ color: GOLD, letterSpacing: "0.34em" }}>
            Sơ yếu lý lịch
          </p>
          <h1 className="mt-2 text-[30px] font-bold leading-tight" style={{ color: NAVY, fontFamily: SERIF }}>
            {data.name || "Họ và tên"}
          </h1>
          {data.title && (
            <p className="mt-1 text-[13.5px] font-medium uppercase" style={{ color: NAVY, letterSpacing: "0.12em" }}>
              {data.title}
            </p>
          )}
        </div>
        {data.contacts.length > 0 && (
          <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {data.contacts.map((c: ResumeContact, i: number) => (
              <p key={`${c.label}-${i}`} className="cv-section-item flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
                <ContactIcon label={c.label} />
                {c.href ? (
                  <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">
                    {c.value}
                  </a>
                ) : (
                  c.value
                )}
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-6 px-8 pb-8 text-center">
        {data.summary && (
          <SectionShell>
            <div className="cv-section-item mx-auto max-w-xl">
              <CenterTitle>Tóm tắt</CenterTitle>
              <p className="mt-2.5 whitespace-pre-line italic" style={{ color: MUTED, fontFamily: SERIF }}>
                {data.summary}
              </p>
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <div>
              <CenterTitle>Kinh nghiệm</CenterTitle>
              <div className="mt-3 space-y-4 text-left">
                {data.experience.map((job, i) => (
                  <div key={job.id} className="cv-section-item mx-auto max-w-xl">
                    <p className="text-[12px] font-bold" style={{ color: GOLD }}>
                      {toRoman(i + 1)}. <span className="sr-only">Điều khoản</span>
                    </p>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 font-bold" style={{ color: NAVY }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
                        {job.role || "Chức danh"}
                      </h3>
                      <DateText range={job.range} className="text-[11.5px]" />
                    </div>
                    <p className="text-[12.5px] font-semibold" style={{ color: INK }}>
                      {job.company}
                    </p>
                    {job.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: MUTED }}>
                        {job.description}
                      </p>
                    )}
                    {i < data.experience.length - 1 && (
                      <div className="mx-auto mt-3 w-16 border-t" style={{ borderColor: GOLD }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <div>
              <CenterTitle>Dự án</CenterTitle>
              <div className="mt-3 space-y-3">
                {data.projects.map((p, i) => (
                  <div key={p.id} className="cv-section-item mx-auto max-w-xl">
                    <h3 className="font-bold" style={{ color: NAVY }}>
                      {toRoman(i + 1)}. {p.name || "Dự án"}
                    </h3>
                    {p.role && (
                      <p className="text-[12.5px]" style={{ color: MUTED }}>
                        {p.role}
                        {p.link ? ` · ${p.link}` : ""}
                      </p>
                    )}
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11.5px]" />
                    )}
                    {p.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: MUTED }}>
                        {p.description}
                      </p>
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
              <CenterTitle>Học vấn</CenterTitle>
              <div className="mx-auto mt-3 max-w-xl space-y-2">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <h3 className="font-bold" style={{ color: NAVY }}>
                      {edu.school || "Trường"}
                      {edu.degree ? ` — ${edu.degree}` : ""}
                    </h3>
                    <DateText range={edu.range} className="text-[11.5px]" />
                    {edu.description && (
                      <p className="mt-0.5 whitespace-pre-line" style={{ color: MUTED }}>
                        {edu.description}
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
            <div className="cv-section-item mx-auto max-w-xl">
              <CenterTitle>Kỹ năng</CenterTitle>
              <p className="mt-2.5 leading-loose">
                {data.skills.map((s, i) => (
                  <span key={s.id} className="cv-section-item">
                    {i > 0 && <span className="mx-1.5" style={{ color: GOLD }}>·</span>}
                    <span className="font-medium" style={{ color: INK }}>
                      {s.name}
                    </span>
                  </span>
                ))}
              </p>
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <div>
              <CenterTitle>Chứng chỉ</CenterTitle>
              <div className="mx-auto mt-3 max-w-xl space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item">
                    <p className="flex items-center justify-center gap-1.5 text-[12.5px] font-semibold" style={{ color: NAVY }}>
                      <Award className="size-3.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
                      {c.name || "Chứng chỉ"}
                    </p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p className="text-[11.5px]" style={{ color: MUTED }}>
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
