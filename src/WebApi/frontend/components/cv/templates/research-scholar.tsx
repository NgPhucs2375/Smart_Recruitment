"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle } from "./shared";

/**
 * Research Scholar — học giả: cột chính 68% trên nền ivory + rail
 * 32% xanh đậm cho chỉ số đếm thật từ data. Khác academic-cv
 * (education-first + numbered): mẫu này experience-first, rail metrics,
 * publications dạng citation-block [n], keywords dòng cuối.
 */

const DEEP = "#14532d";
const DEEP_SOFT = "#e3ecdf";
const IVORY = "#f7f5ef";
const INK = "#1f2a22";
const MUTED = "#5c6e60";

function ContactIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const Icon = l.includes("mail") || l.includes("email")
    ? Mail
    : l.includes("điện") || l.includes("phone") || l.includes("sđt")
      ? Phone
      : l.includes("địa") || l.includes("address")
        ? MapPin
        : Globe;
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: DEEP }} strokeWidth={2} />;
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-white">
      {children}
    </h2>
  );
}

function MainLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2.5 border-b-2 pb-1.5 text-[11.5px] font-bold uppercase tracking-[0.18em]"
      style={{ color: DEEP, borderColor: DEEP }}
    >
      {children}
    </h2>
  );
}

export function ResearchScholarTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  const expCount = data.experience.length;
  const projectCount = data.projects.length;
  const certCount = data.certificates.length;
  const metrics = [
    { value: expCount, label: "Vị trí kinh nghiệm" },
    { value: projectCount, label: "Đề tài / dự án" },
    { value: certCount, label: "Chứng chỉ" },
  ];

  return (
    <div
      className="cv-paper cv-paper-a4 text-[13px] leading-relaxed"
      style={{ color: INK, backgroundColor: IVORY }}
    >
      <header className="border-b-4 px-7 pb-4 pt-6" style={{ borderColor: DEEP }}>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.24em]" style={{ color: DEEP }}>
          {resolveBannerTitle(data, "Hồ sơ học thuật")}
        </p>
        <h1
          className="mt-1 text-[26px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-serif)", color: INK }}
        >
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-medium" style={{ color: DEEP }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <p
                key={`${c.label}-${i}`}
                className="cv-section-item flex items-start gap-1.5 text-[12px]"
                style={{ color: MUTED }}
              >
                <ContactIcon label={c.label} />
                <span className="break-all">
                  {c.href ? (
                    <a href={c.href} className="underline decoration-neutral-300 underline-offset-2">
                      {c.value}
                    </a>
                  ) : (
                    c.value
                  )}
                </span>
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-[68%_32%]">
        <div className="min-w-0 space-y-5 px-7 py-5">
          {data.summary && (
            <SectionShell>
              <MainLabel>Tóm tắt học thuật</MainLabel>
              <div
                className="cv-section-item rounded-md border-l-4 bg-white px-4 py-3"
                style={{ borderColor: DEEP, borderTop: "1px solid #e5e0d2", borderRight: "1px solid #e5e0d2", borderBottom: "1px solid #e5e0d2" }}
              >
                <SplitBlocks text={data.summary} className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12.5px]" style={{ color: INK }} />
              </div>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <MainLabel>Kinh nghiệm nghiên cứu</MainLabel>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="flex items-start gap-1.5 font-bold" style={{ color: INK }}>
                        <Briefcase className="mt-1 size-3.5 shrink-0" style={{ color: DEEP }} strokeWidth={2} />
                        {job.role || "Chức danh"}
                      </h3>
                      <DateText range={job.range} className="text-[11.5px]" />
                    </div>
                    {job.company && (
                      <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: DEEP }}>
                        {job.company}
                      </p>
                    )}
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12.5px]" style={{ color: MUTED }} />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.projects.length > 0 && (
            <SectionShell>
              <MainLabel>Công bố khoa học</MainLabel>
              <div className="space-y-2.5">
                {data.projects.map((p, idx) => (
                  <div
                    key={p.id}
                    className="cv-section-item rounded-sm px-3 py-2"
                    style={{ backgroundColor: "#fff", border: "1px solid #e5e0d2" }}
                  >
                    <p className="text-[12.5px] leading-relaxed" style={{ color: INK }}>
                      <span className="mr-1.5 font-bold" style={{ color: DEEP }}>
                        [{idx + 1}]
                      </span>
                      <span className="font-semibold">{p.name || "Công trình"}</span>
                      {p.role && <span style={{ color: MUTED }}>{` — ${p.role}`}</span>}
                      {(p.range?.start || p.range?.end) && p.range && (
                        <span style={{ color: MUTED }}>
                          {" ("}
                          <DateText range={p.range} />
                          {")"}
                        </span>
                      )}
                      {p.description && (
                        <span className="italic" style={{ color: MUTED }}>
                          {` — ${p.description}`}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.education.length > 0 && (
            <SectionShell>
              <MainLabel>Học vấn</MainLabel>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>
                        {edu.school || "Trường"}
                      </h3>
                      <DateText range={edu.range} className="text-[11.5px]" />
                    </div>
                    {edu.degree && (
                      <p className="text-[12.5px] font-semibold" style={{ color: DEEP }}>
                        {edu.degree}
                      </p>
                    )}
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12.5px]" style={{ color: MUTED }} />
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>

        <aside className="min-w-0 px-5 py-5 text-white" style={{ backgroundColor: DEEP }}>
          <div className="space-y-5">
            <SectionShell>
              <RailLabel>Chỉ số hồ sơ</RailLabel>
              <div className="space-y-2">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="cv-section-item rounded-md px-3 py-2.5 text-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    <p className="text-[24px] font-bold leading-none text-white">{m.value}</p>
                    <p className="mt-1 text-[11px] leading-snug text-white/85">{m.label}</p>
                  </div>
                ))}
              </div>
            </SectionShell>

            {data.skills.length > 0 && (
              <SectionShell>
                <RailLabel>Chuyên môn</RailLabel>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => (
                    <span
                      key={s.id}
                      className="cv-section-item rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold"
                      style={{ color: DEEP }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </SectionShell>
            )}

            {data.certificates.length > 0 && (
              <SectionShell>
                <RailLabel>Chứng nhận</RailLabel>
                <div className="space-y-2.5">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item">
                      <p className="flex items-start gap-1.5 text-[12px] font-semibold leading-snug text-white">
                        <Award className="mt-0.5 size-3.5 shrink-0 text-white" strokeWidth={2} />
                        {c.name || "Chứng chỉ"}
                      </p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p className="mt-0.5 pl-5 text-[11.5px] text-white/80">
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}
          </div>
        </aside>
      </div>

      {data.skills.length > 0 && (
        <footer className="border-t px-7 pb-6 pt-3" style={{ borderColor: DEEP_SOFT, backgroundColor: "#fff" }}>
          <p className="text-[11.5px] leading-relaxed" style={{ color: MUTED }}>
            <span className="font-bold uppercase tracking-[0.14em]" style={{ color: DEEP }}>
              Từ khóa:{" "}
            </span>
            {data.skills.map((s) => s.name).join(" · ")}
          </p>
        </footer>
      )}
    </div>
  );
}
