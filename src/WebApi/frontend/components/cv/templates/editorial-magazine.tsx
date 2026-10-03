"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const INK = "#111827";
const RED = "#b91c1c";
const PAPER = "#fafaf9";
const MUTED = "#57534e";

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
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: RED }} strokeWidth={2} />;
}

function ContactRow({ contact }: { contact: ResumeContact }) {
  return (
    <p className="cv-section-item flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: MUTED }}>
      <ContactIcon label={contact.label} />
      <span className="break-all">
        <span className="font-semibold" style={{ color: INK }}>
          {contact.label}:{" "}
        </span>
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

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase" style={{ color: RED, letterSpacing: "0.28em" }}>
      {children}
    </p>
  );
}

function Rule() {
  return <div className="my-3 border-t" style={{ borderColor: "#e7e5e4" }} />;
}

export function EditorialMagazineTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) return (<div className="cv-paper cv-paper-a4"><EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" /></div>);

  const first = data.summary ? data.summary.charAt(0) : "";
  const rest = data.summary ? data.summary.slice(1) : "";

  return (
    <div className="cv-paper cv-paper-a4 text-[13px] leading-relaxed" style={{ color: INK, backgroundColor: PAPER }}>
      {/* Masthead */}
      <header className="px-8 pb-3 pt-6">
        <div className="flex items-center justify-between gap-4">
          <Kicker>{resolveBannerTitle3(data, data.title, "Hồ sơ ứng viên · CV")}</Kicker>
          <p className="min-w-0 text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.28em" }}>
            {data.contacts.length > 0 ? data.contacts[0].value : ""}
          </p>
        </div>
        <h1
          className="mt-2 text-[30px] font-black leading-[1.05] tracking-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <blockquote className="mt-3 border-l-4 pl-3 text-[15px] font-medium italic leading-snug" style={{ borderColor: RED, color: INK }}>
            {data.title}
          </blockquote>
        )}
        <div className="mt-3 border-t-2" style={{ borderColor: INK }} />
        <div className="mt-px border-t" style={{ borderColor: INK }} />
      </header>

      <div className="grid grid-cols-[65%_35%] gap-0 px-8 pb-8">
        {/* Main column */}
        <div className="min-w-0 space-y-5 pr-6">
          {data.summary && (
            <SectionShell>
              <div className="cv-section-item">
                <Kicker>Tóm tắt</Kicker>
                <p className="mt-2 whitespace-pre-line break-words [overflow-wrap:anywhere] text-justify" style={{ color: INK }}>
                  <span
                    aria-hidden="true"
                    style={{
                      float: "left",
                      fontSize: "44px",
                      lineHeight: "0.85",
                      paddingRight: "8px",
                      paddingTop: "4px",
                      fontWeight: 900,
                      color: RED,
                      fontFamily: "var(--font-serif)",
                    }}
                  >
                    {first}
                  </span>
                  {rest}
                </p>
                <Rule />
              </div>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <div>
                <Kicker>Kinh nghiệm</Kicker>
                <div className="mt-2 space-y-4">
                  {data.experience.map((job, i) => (
                    <div key={job.id} className="cv-section-item">
                      <p className="text-[10px] font-bold" style={{ color: RED, letterSpacing: "0.24em" }}>
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[14px] font-bold leading-snug" style={{ color: INK }}>
                          {job.role || "Chức danh"}
                        </h3>
                        <DateText range={job.range} className="text-[11.5px]" />
                      </div>
                      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: RED }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: RED }} strokeWidth={2} />
                        {job.company}
                      </p>
                      {job.description && (
                        <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
                      )}
                      {i < data.experience.length - 1 && <Rule />}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}

          {data.projects.length > 0 && (
            <SectionShell>
              <div>
                <Kicker>Dự án</Kicker>
                <div className="mt-2 space-y-3">
                  {data.projects.map((p) => (
                    <div key={p.id} className="cv-section-item">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-bold" style={{ color: INK }}>
                          {p.name || "Dự án"}
                        </h3>
                        {p.range && (p.range.start || p.range.end) && (
                          <DateText range={p.range} className="text-[11.5px]" />
                        )}
                      </div>
                      {p.role && (
                        <p className="text-[12.5px] italic" style={{ color: MUTED }}>
                          {p.role}
                          {p.link ? ` · ${p.link}` : ""}
                        </p>
                      )}
                      {p.description && (
                        <SplitBlocks text={p.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: MUTED }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
        </div>

        {/* Rail column */}
        <div className="min-w-0 space-y-5 border-l pl-6" style={{ borderColor: "#e7e5e4" }}>
          {data.contacts.length > 0 && (
            <SectionShell>
              <div>
                <Kicker>Liên hệ</Kicker>
                <div className="mt-2 space-y-1.5">
                  {data.contacts.map((c, i) => (
                    <ContactRow key={`${c.label}-${i}`} contact={c} />
                  ))}
                </div>
                <Rule />
              </div>
            </SectionShell>
          )}

          {data.skills.length > 0 && (
            <SectionShell>
              <div className="cv-section-item">
                <Kicker>Kỹ năng</Kicker>
                <ol className="mt-2 space-y-1.5">
                  {data.skills.map((s, i) => (
                    <li key={s.id} className="cv-section-item flex gap-2 text-[12.5px]" style={{ color: INK }}>
                      <span className="font-bold" style={{ color: RED }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium">{s.name}</span>
                    </li>
                  ))}
                </ol>
                <Rule />
              </div>
            </SectionShell>
          )}

          {data.education.length > 0 && (
            <SectionShell>
              <div>
                <Kicker>Học vấn</Kicker>
                <div className="mt-2 space-y-3">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="cv-section-item">
                      <h3 className="text-[12.5px] font-bold leading-snug" style={{ color: INK }}>
                        {edu.school || "Trường"}
                      </h3>
                      {edu.degree && (
                        <p className="text-[12px] italic" style={{ color: MUTED }}>
                          {edu.degree}
                        </p>
                      )}
                      <DateText range={edu.range} className="text-[11.5px]" />
                      {edu.description && (
                        <SplitBlocks text={edu.description} className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[12px]" style={{ color: MUTED }} />
                      )}
                    </div>
                  ))}
                </div>
                <Rule />
              </div>
            </SectionShell>
          )}

          {data.certificates.length > 0 && (
            <SectionShell>
              <div>
                <Kicker>Chứng chỉ</Kicker>
                <div className="mt-2 space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="cv-section-item">
                      <p className="flex items-start gap-1.5 text-[12px] font-semibold leading-snug" style={{ color: INK }}>
                        <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: RED }} strokeWidth={2} />
                        {c.name || "Chứng chỉ"}
                      </p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p className="mt-0.5 pl-5 text-[11.5px]" style={{ color: MUTED }}>
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
    </div>
  );
}
