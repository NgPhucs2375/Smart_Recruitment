"use client";

// Template hiện đại chỉ nhận dữ liệu trình bày đã chuẩn hóa, không đọc form/API.
import { Mail, Phone, MapPin, Globe, Award } from "lucide-react";
import { GithubIcon as Github, LinkedinIcon as Linkedin } from "@/components/icons/brand-icons";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

/**
 * Tech Modern — asymmetric two-column layout (sidebar ~32% / main ~68%)
 * for IT / developer candidates. Restrained navy + soft neutral surfaces,
 * no giant color blocks, no gradients.
 */

const NAVY = "#274b73";
const NAVY_SOFT = "#eaf1f8";
const INK = "#1f2a37";
const SUBTLE = "#5b6470";
const SIDEBAR_BG = "#f2f5f9";

function ContactIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const Icon =
    l.includes("mail") || l.includes("email")
      ? Mail
      : l.includes("điện") || l.includes("phone") || l.includes("sđt")
        ? Phone
        : l.includes("địa chỉ") || l.includes("address")
          ? MapPin
          : l.includes("linkedin")
            ? Linkedin
            : l.includes("github")
              ? Github
              : Globe;
  return <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: NAVY }} strokeWidth={2} />;
}

function SideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2.5 border-b-2 pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em]"
      style={{ color: NAVY, borderColor: NAVY }}
    >
      {children}
    </h2>
  );
}

function SidebarContact({ contact }: { contact: ResumeContact }) {
  return (
    <p className="flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: SUBTLE }}>
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

export function TechModernTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div className="cv-paper cv-paper-a4 text-[13px] leading-relaxed" style={{ color: INK }}>
      {/* Slim navy accent bar + header */}
      <div className="h-1.5" style={{ backgroundColor: NAVY }} />
      <header className="px-7 pb-4 pt-5">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: NAVY }}>
          Curriculum Vitae
        </p>
        <h1 className="mt-1 text-[25px] font-bold leading-tight tracking-tight" style={{ color: INK }}>
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13px] font-medium" style={{ color: NAVY }}>
            {data.title}
          </p>
        )}
      </header>

      <div className="grid grid-cols-[32%_68%]">
        {/* Sidebar */}
        <aside className="px-5 py-5" style={{ backgroundColor: SIDEBAR_BG }}>
          <div className="space-y-4">
            {data.contacts.length > 0 && (
              <div className="cv-section-item">
                <SideTitle>Liên hệ</SideTitle>
                <div className="space-y-1.5">
                  {data.contacts.map((c, i) => (
                    <SidebarContact key={`${c.label}-${i}`} contact={c} />
                  ))}
                </div>
              </div>
            )}

            {data.skills.length > 0 && (
              <div className="cv-section-item">
                <SideTitle>Kỹ năng</SideTitle>
                {/* Names only — years/proficiency stay in data for AI and
                    matching, but are never rendered as numeric suffixes. */}
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-md bg-white px-2 py-1 text-[11.5px] font-semibold"
                      style={{ color: NAVY, border: "1px solid #d7e1ee" }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.certificates.length > 0 && (
              <div className="cv-section-item">
                <SideTitle>Chứng chỉ</SideTitle>
                <div className="space-y-2.5">
                  {data.certificates.map((c) => (
                    <div key={c.id}>
                      <p className="flex items-start gap-1.5 text-[12px] font-semibold leading-snug" style={{ color: INK }}>
                        <Award className="mt-0.5 size-3.5 shrink-0" style={{ color: NAVY }} strokeWidth={2} />
                        {c.name || "Chứng chỉ"}
                      </p>
                      {[c.issuer, c.date].filter(Boolean).length > 0 && (
                        <p className="mt-0.5 pl-5 text-[11.5px]" style={{ color: SUBTLE }}>
                          {[c.issuer, c.date].filter(Boolean).join(" · ")}
                          {c.code ? ` · ${c.code}` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main column */}
        <div className="space-y-4 px-7 py-5">
          {data.summary && (
            <SectionShell>
              <MainTitle>Tóm tắt</MainTitle>
              <p className="whitespace-pre-line" style={{ color: SUBTLE }}>{data.summary}</p>
            </SectionShell>
          )}

          {data.experience.length > 0 && (
            <SectionShell>
              <MainTitle>Kinh nghiệm</MainTitle>
              <div className="space-y-3">
                {data.experience.map((job) => (
                  <div key={job.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{job.role || "Chức danh"}</h3>
                      <DateText range={job.range} className="text-[11.5px]" />
                    </div>
                    <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>{job.company}</p>
                    {job.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: SUBTLE }}>{job.description}</p>
                    )}
                    {job.skills.length > 0 && (
                      <p className="mt-1 text-[11.5px]" style={{ color: SUBTLE }}>
                        <span className="font-semibold" style={{ color: INK }}>Stack: </span>
                        {job.skills.join(", ")}
                      </p>
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
                  <div key={p.id} className="cv-section-item border-l-2 pl-3" style={{ borderColor: NAVY }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{p.name || "Dự án"}</h3>
                      {p.link && (
                        <a
                          href={p.link.startsWith("http") ? p.link : `https://${p.link}`}
                          className="text-[11.5px] underline decoration-neutral-300 underline-offset-2"
                          style={{ color: SUBTLE }}
                        >
                          {p.link}
                        </a>
                      )}
                    </div>
                    {p.role && (
                      <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>{p.role}</p>
                    )}
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11.5px]" />
                    )}
                    {p.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: SUBTLE }}>{p.description}</p>
                    )}
                    {p.tech.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.tech.map((t, i) => (
                          <span
                            key={`${p.id}-${i}`}
                            className="rounded px-1.5 py-0.5 font-mono text-[10.5px] font-medium"
                            style={{ backgroundColor: NAVY_SOFT, color: NAVY }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {data.education.length > 0 && (
            <SectionShell>
              <MainTitle>Học vấn</MainTitle>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold" style={{ color: INK }}>{edu.school || "Trường"}</h3>
                      <DateText range={edu.range} className="text-[11.5px]" />
                    </div>
                    {edu.degree && (
                      <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>{edu.degree}</p>
                    )}
                    {edu.description && (
                      <p className="mt-1 whitespace-pre-line" style={{ color: SUBTLE }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
