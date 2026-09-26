"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle } from "./shared";

/**
 * Fashion Editorial — tạp chí thời trang: khoảng trắng cực lớn,
 * tên font-light cỡ lớn tracking rộng, nhãn section chữ dọc
 * (writing-mode: vertical-rl), experience đánh số look 01/02, 1 cột.
 */

const BLACK = "#0a0a0a";
const GRAY = "#525252";
const FAINT = "#a3a3a3";
const PAPER = "#fafafa";
const RED = "#dc2626";

function ContactItem({ label, value, href }: { label: string; value: string; href?: string }) {
  const l = label.toLowerCase();
  const Icon = l.includes("mail") || l.includes("email")
    ? Mail
    : l.includes("điện") || l.includes("phone") || l.includes("sđt")
      ? Phone
      : l.includes("địa") || l.includes("address")
        ? MapPin
        : Globe;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: GRAY }}>
      <Icon className="size-3 shrink-0" style={{ color: BLACK }} strokeWidth={1.5} />
      {href ? (
        <a href={href} className="underline decoration-neutral-300 underline-offset-4">
          {value}
        </a>
      ) : (
        value
      )}
    </span>
  );
}

function EditorialSection({
  index,
  vertical,
  children,
}: {
  index: string;
  vertical: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-8">
      <div className="flex shrink-0 flex-col items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: FAINT }}>
          {index}
        </span>
        <span
          className="text-[10px] font-bold uppercase"
          style={{ writingMode: "vertical-rl", color: BLACK, letterSpacing: "0.35em" }}
        >
          {vertical}
        </span>
        <span className="w-px flex-1" style={{ backgroundColor: "#e5e5e5" }} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function FashionEditorialTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div
      className="cv-paper cv-paper-a4 px-12 py-16 text-[13px] leading-relaxed"
      style={{ color: BLACK, backgroundColor: PAPER }}
    >
      <header>
        <div className="flex items-center gap-3">
          <span className="inline-block size-2.5" style={{ backgroundColor: RED }} aria-hidden="true" />
          <p className="text-[10.5px] font-bold uppercase" style={{ color: BLACK, letterSpacing: "0.4em" }}>
            {resolveBannerTitle(data, "Portfolio — CV")}
          </p>
        </div>
        <h1
          className="mt-8 text-[46px] font-light uppercase leading-[1.05]"
          style={{ color: BLACK, letterSpacing: "0.1em" }}
        >
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-4 text-[14px] font-light" style={{ color: GRAY, letterSpacing: "0.24em" }}>
            {data.title.toUpperCase()}
          </p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-neutral-200 py-4">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`} className="cv-section-item">
                <ContactItem label={c.label} value={c.value} href={c.href} />
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mt-16 space-y-16">
        {data.summary && (
          <SectionShell>
            <EditorialSection index="N°1" vertical="Giới thiệu">
              <SplitBlocks text={data.summary} className="max-w-[520px] whitespace-pre-line break-words [overflow-wrap:anywhere] text-[15px] font-light leading-loose" style={{ color: BLACK }} />
            </EditorialSection>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <EditorialSection index="N°2" vertical="Kinh nghiệm">
              <div className="space-y-12">
                {data.experience.map((job, i) => (
                  <div key={job.id} className="cv-section-item">
                    <p className="text-[26px] font-light" style={{ color: RED, letterSpacing: "0.12em" }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3
                      className="mt-2 text-[17px] font-light uppercase"
                      style={{ color: BLACK, letterSpacing: "0.14em" }}
                    >
                      {job.role || "Chức danh"}
                    </h3>
                    {job.company && (
                      <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: GRAY }}>
                        <Briefcase className="size-3.5 shrink-0" style={{ color: BLACK }} strokeWidth={1.5} />
                        {job.company}
                      </p>
                    )}
                    <DateText range={job.range} className="mt-1 block text-[11.5px] uppercase tracking-[0.2em]" />
                    {job.description && (
                      <SplitBlocks text={job.description} className="mt-3 max-w-[520px] whitespace-pre-line break-words [overflow-wrap:anywhere] font-light leading-loose" style={{ color: GRAY }} />
                    )}
                  </div>
                ))}
              </div>
            </EditorialSection>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <EditorialSection index="N°3" vertical="Dự án">
              <div className="space-y-10">
                {data.projects.map((p) => (
                  <div key={p.id} className="cv-section-item">
                    <h3
                      className="text-[16px] font-light uppercase"
                      style={{ color: BLACK, letterSpacing: "0.14em" }}
                    >
                      {p.name || "Dự án"}
                    </h3>
                    {p.role && (
                      <p className="mt-1 text-[12.5px] italic" style={{ color: GRAY }}>
                        {p.role}
                      </p>
                    )}
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="mt-1 block text-[11.5px] uppercase tracking-[0.2em]" />
                    )}
                    {p.description && (
                      <SplitBlocks text={p.description} className="mt-3 max-w-[520px] whitespace-pre-line break-words [overflow-wrap:anywhere] font-light leading-loose" style={{ color: GRAY }} />
                    )}
                    {p.tech.length > 0 && (
                      <p className="mt-2 text-[11.5px] uppercase" style={{ color: FAINT, letterSpacing: "0.18em" }}>
                        {p.tech.join(" — ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </EditorialSection>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <EditorialSection index="N°4" vertical="Học vấn">
              <div className="space-y-8">
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-section-item">
                    <h3
                      className="text-[15px] font-light uppercase"
                      style={{ color: BLACK, letterSpacing: "0.14em" }}
                    >
                      {edu.school || "Trường"}
                    </h3>
                    {edu.degree && (
                      <p className="mt-1 text-[12.5px] italic" style={{ color: GRAY }}>
                        {edu.degree}
                      </p>
                    )}
                    <DateText range={edu.range} className="mt-1 block text-[11.5px] uppercase tracking-[0.2em]" />
                    {edu.description && (
                      <SplitBlocks text={edu.description} className="mt-2 max-w-[520px] whitespace-pre-line break-words [overflow-wrap:anywhere] font-light leading-loose" style={{ color: GRAY }} />
                    )}
                  </div>
                ))}
              </div>
            </EditorialSection>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <EditorialSection index="N°5" vertical="Kỹ năng">
              <p className="cv-section-item text-[15px] font-light leading-[2.2]" style={{ color: BLACK, letterSpacing: "0.1em" }}>
                {data.skills.map((s) => s.name).join(" · ")}
              </p>
            </EditorialSection>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <EditorialSection index="N°6" vertical="Chứng chỉ">
              <div className="space-y-6">
                {data.certificates.map((c) => (
                  <div key={c.id} className="cv-section-item">
                    <p className="flex items-center gap-2 text-[13.5px] font-light uppercase" style={{ color: BLACK, letterSpacing: "0.12em" }}>
                      <Award className="size-3.5 shrink-0" style={{ color: BLACK }} strokeWidth={1.5} />
                      {c.name || "Chứng chỉ"}
                    </p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p className="mt-1 text-[12px] font-light" style={{ color: GRAY }}>
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </EditorialSection>
          </SectionShell>
        )}
      </div>

      <footer className="mt-8 flex items-center justify-between border-t border-neutral-200 pb-2 pt-6">
        <p className="min-w-0 text-[10px] uppercase" style={{ color: FAINT, letterSpacing: "0.35em" }}>
          {data.name || "Họ và tên"}
        </p>
        <span className="inline-block size-2.5" style={{ backgroundColor: BLACK }} aria-hidden="true" />
      </footer>
    </div>
  );
}
