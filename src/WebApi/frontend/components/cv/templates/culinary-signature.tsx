"use client";

import { Mail, Phone, MapPin, Globe, Award } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

/**
 * Culinary Signature — thực đơn nhà hàng: entries nối bằng
 * dotted leaders giữa tên món (vai trò / dự án) và niên hiệu,
 * "Món đặc trưng" là project đầu tiên kèm dấu ★ (từ data thật).
 */

const CREAM = "#fffbeb";
const WINE = "#881337";
const WINE_SOFT = "#fbe9e7";
const GOLD = "#a16207";
const INK = "#40260f";
const MUTED = "#7a5c3e";

function ContactLine({ label, value, href }: { label: string; value: string; href?: string }) {
  const l = label.toLowerCase();
  const Icon = l.includes("mail") || l.includes("email")
    ? Mail
    : l.includes("điện") || l.includes("phone") || l.includes("sđt")
      ? Phone
      : l.includes("địa") || l.includes("address")
        ? MapPin
        : Globe;
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: MUTED }}>
      <Icon className="size-3 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
      {href ? (
        <a href={href} className="underline decoration-amber-200 underline-offset-2">
          {value}
        </a>
      ) : (
        value
      )}
    </span>
  );
}

function MenuHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
        {sub}
      </p>
      <h2
        className="mt-0.5 text-[15px] font-bold uppercase tracking-[0.18em]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: WINE }}
      >
        {children}
      </h2>
      <div className="mx-auto mt-2 flex max-w-[220px] items-center gap-2" aria-hidden="true">
        <span className="h-px flex-1" style={{ backgroundColor: GOLD }} />
        <span className="text-[10px]" style={{ color: GOLD }}>
          ❖
        </span>
        <span className="h-px flex-1" style={{ backgroundColor: GOLD }} />
      </div>
    </div>
  );
}

export function CulinarySignatureTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  const [featured, ...restProjects] = data.projects;

  return (
    <div
      className="cv-paper cv-paper-a4 px-8 py-7 text-[13px] leading-relaxed"
      style={{ color: INK, backgroundColor: CREAM }}
    >
      <header className="text-center">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.34em]" style={{ color: GOLD }}>
          Thực đơn nghề nghiệp
        </p>
        <h1
          className="mx-auto mt-2 max-w-[480px] text-[32px] font-bold leading-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: WINE }}
        >
          {data.name || "Họ và tên"}
        </h1>
        {data.title && (
          <p className="mt-1 text-[13.5px] font-medium italic" style={{ color: INK }}>
            {data.title}
          </p>
        )}
        {data.contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`} className="cv-section-item">
                <ContactLine label={c.label} value={c.value} href={c.href} />
              </span>
            ))}
          </div>
        )}
        <div
          className="mt-4 border-y-4 border-double py-1 text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          Khai vị · Món chính · Tráng miệng
        </div>
      </header>

      <div className="mt-5 space-y-7">
        {data.summary && (
          <SectionShell>
            <MenuHeading sub="Lời mở đầu">Giới thiệu</MenuHeading>
            <p
              className="cv-section-item mx-auto max-w-[560px] text-center text-[12.5px] italic leading-relaxed"
              style={{ color: MUTED }}
            >
              “{data.summary}”
            </p>
          </SectionShell>
        )}

        {featured && (
          <SectionShell>
            <MenuHeading sub="Đầu bếp gợi ý">Món đặc trưng ★</MenuHeading>
            <div
              className="cv-section-item rounded-md border-2 px-5 py-4"
              style={{ borderColor: WINE, backgroundColor: WINE_SOFT }}
            >
              <div className="flex items-baseline gap-2">
                <span style={{ color: GOLD }} aria-hidden="true">
                  ★
                </span>
                <h3 className="font-bold" style={{ color: WINE }}>
                  {featured.name || "Dự án"}
                </h3>
                <span
                  className="mx-1 flex-1 border-b border-dotted"
                  style={{ borderColor: GOLD }}
                  aria-hidden="true"
                />
                {featured.range && (featured.range.start || featured.range.end) && (
                  <DateText range={featured.range} className="text-[11.5px]" />
                )}
              </div>
              {featured.role && (
                <p className="mt-0.5 pl-5 text-[12px] font-semibold" style={{ color: INK }}>
                  {featured.role}
                </p>
              )}
              {featured.description && (
                <p className="mt-1 whitespace-pre-line pl-5 text-[12.5px]" style={{ color: MUTED }}>
                  {featured.description}
                </p>
              )}
              {featured.tech.length > 0 && (
                <p className="mt-1 pl-5 text-[11.5px]" style={{ color: MUTED }}>
                  <span className="font-semibold" style={{ color: WINE }}>
                    Nguyên liệu:{" "}
                  </span>
                  {featured.tech.join(" · ")}
                </p>
              )}
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <MenuHeading sub="Món chính">Kinh nghiệm</MenuHeading>
            <div className="space-y-3.5">
              {data.experience.map((job) => (
                <div key={job.id} className="cv-section-item">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold" style={{ color: INK }}>
                      {job.role || "Chức danh"}
                    </h3>
                    <span
                      className="mx-1 flex-1 border-b border-dotted"
                      style={{ borderColor: GOLD }}
                      aria-hidden="true"
                    />
                    <DateText range={job.range} className="text-[11.5px]" />
                  </div>
                  {job.company && (
                    <p className="mt-0.5 text-[12px] font-semibold italic" style={{ color: WINE }}>
                      {job.company}
                    </p>
                  )}
                  {job.description && (
                    <p className="mt-1 whitespace-pre-line text-[12.5px]" style={{ color: MUTED }}>
                      {job.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {restProjects.length > 0 && (
          <SectionShell>
            <MenuHeading sub="Thực đơn thêm">Dự án khác</MenuHeading>
            <div className="space-y-3.5">
              {restProjects.map((p) => (
                <div key={p.id} className="cv-section-item">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold" style={{ color: INK }}>
                      {p.name || "Dự án"}
                    </h3>
                    <span
                      className="mx-1 flex-1 border-b border-dotted"
                      style={{ borderColor: GOLD }}
                      aria-hidden="true"
                    />
                    {p.range && (p.range.start || p.range.end) && (
                      <DateText range={p.range} className="text-[11.5px]" />
                    )}
                  </div>
                  {p.role && (
                    <p className="mt-0.5 text-[12px] font-semibold italic" style={{ color: WINE }}>
                      {p.role}
                    </p>
                  )}
                  {p.description && (
                    <p className="mt-1 whitespace-pre-line text-[12.5px]" style={{ color: MUTED }}>
                      {p.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <MenuHeading sub="Công thức gốc">Học vấn</MenuHeading>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-section-item">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold" style={{ color: INK }}>
                      {edu.school || "Trường"}
                    </h3>
                    <span
                      className="mx-1 flex-1 border-b border-dotted"
                      style={{ borderColor: GOLD }}
                      aria-hidden="true"
                    />
                    <DateText range={edu.range} className="text-[11.5px]" />
                  </div>
                  {edu.degree && (
                    <p className="mt-0.5 text-[12px] font-semibold italic" style={{ color: WINE }}>
                      {edu.degree}
                    </p>
                  )}
                  {edu.description && (
                    <p className="mt-1 whitespace-pre-line text-[12.5px]" style={{ color: MUTED }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <MenuHeading sub="Gia vị">Kỹ năng</MenuHeading>
            <p className="cv-section-item text-center text-[12.5px] leading-loose" style={{ color: INK }}>
              {data.skills.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && (
                    <span className="mx-2" style={{ color: GOLD }}>
                      ·
                    </span>
                  )}
                  <span className="font-medium">{s.name}</span>
                </span>
              ))}
            </p>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <MenuHeading sub="Tráng miệng">Chứng chỉ</MenuHeading>
            <div className="space-y-2.5">
              {data.certificates.map((c) => (
                <div key={c.id} className="cv-section-item text-center">
                  <p
                    className="flex items-center justify-center gap-1.5 text-[12.5px] font-semibold"
                    style={{ color: INK }}
                  >
                    <Award className="size-3.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
                    {c.name || "Chứng chỉ"}
                  </p>
                  {[c.issuer, c.date].filter(Boolean).length > 0 && (
                    <p className="mt-0.5 text-[11.5px] italic" style={{ color: MUTED }}>
                      {[c.issuer, c.date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}
      </div>

      <footer className="mt-7 text-center">
        <div className="mx-auto flex max-w-[220px] items-center gap-2" aria-hidden="true">
          <span className="h-px flex-1" style={{ backgroundColor: GOLD }} />
          <span className="text-[10px]" style={{ color: GOLD }}>
            ❖
          </span>
          <span className="h-px flex-1" style={{ backgroundColor: GOLD }} />
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
          Hân hạnh phục vụ
        </p>
      </footer>
    </div>
  );
}
