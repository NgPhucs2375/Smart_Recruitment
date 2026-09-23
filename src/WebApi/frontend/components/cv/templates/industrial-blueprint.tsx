"use client";

import { Mail, Phone, MapPin, Globe, Award, Briefcase } from "lucide-react";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell } from "./shared";

/**
 * Industrial Blueprint — bản vẽ kỹ thuật trên nền trắng kẻ lưới
 * hairline: experience dạng specs-table (vai trò | đơn vị | thời gian),
 * nhãn stencil uppercase tracking, accent cam an toàn + steel.
 * Khác devops-stack (timeline) và midnight-pro (nền tối).
 */

const ACCENT = "#ea580c";
const STEEL = "#475569";
const STEEL_DARK = "#1e293b";
const MUTED = "#64748b";
const HAIRLINE = "#e8edf3";

function ContactBadge({ label, value, href }: { label: string; value: string; href?: string }) {
  const l = label.toLowerCase();
  const Icon = l.includes("mail") || l.includes("email")
    ? Mail
    : l.includes("điện") || l.includes("phone") || l.includes("sđt")
      ? Phone
      : l.includes("địa") || l.includes("address")
        ? MapPin
        : Globe;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border bg-white px-2 py-1 text-[11px]"
      style={{ borderColor: HAIRLINE, color: STEEL }}
    >
      <Icon className="size-3 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
      {href ? (
        <a href={href} className="underline decoration-neutral-300 underline-offset-2">
          {value}
        </a>
      ) : (
        value
      )}
    </span>
  );
}

function StencilLabel({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className="rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-[0.14em] text-white"
        style={{ backgroundColor: ACCENT }}
      >
        {code}
      </span>
      <h2
        className="text-[12px] font-bold uppercase"
        style={{ color: STEEL_DARK, letterSpacing: "0.24em" }}
      >
        {children}
      </h2>
      <span className="h-px flex-1" style={{ backgroundColor: HAIRLINE }} aria-hidden="true" />
    </div>
  );
}

export function IndustrialBlueprintTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }

  return (
    <div
      className="cv-paper cv-paper-a4 px-7 py-6 text-[13px] leading-relaxed"
      style={{
        color: STEEL_DARK,
        backgroundColor: "#ffffff",
        backgroundImage: `repeating-linear-gradient(0deg, ${HAIRLINE} 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, ${HAIRLINE} 0 1px, transparent 1px 28px)`,
      }}
    >
      <header
        className="rounded-sm border-2 bg-white px-5 py-4"
        style={{ borderColor: STEEL_DARK }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase"
              style={{ color: ACCENT, letterSpacing: "0.3em" }}
            >
              Bản vẽ nhân sự — Rev 01
            </p>
            <h1
              className="mt-1 text-[26px] font-bold uppercase leading-tight"
              style={{ color: STEEL_DARK, letterSpacing: "0.06em" }}
            >
              {data.name || "Họ và tên"}
            </h1>
            {data.title && (
              <p className="mt-1 text-[13px] font-semibold" style={{ color: STEEL }}>
                {data.title}
              </p>
            )}
          </div>
          <span
            className="rounded-sm border px-2 py-1 text-[10px] font-bold uppercase"
            style={{ borderColor: ACCENT, color: ACCENT, letterSpacing: "0.2em" }}
          >
            A4
          </span>
        </div>
        {data.contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`} className="cv-section-item">
                <ContactBadge label={c.label} value={c.value} href={c.href} />
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mt-5 space-y-6">
        {data.summary && (
          <SectionShell>
            <StencilLabel code="SEC.00">Thông số tổng quan</StencilLabel>
            <div
              className="cv-section-item rounded-sm border border-dashed bg-white px-4 py-3"
              style={{ borderColor: STEEL }}
            >
              <p className="whitespace-pre-line text-[12.5px]" style={{ color: STEEL }}>
                {data.summary}
              </p>
            </div>
          </SectionShell>
        )}

        {data.experience.length > 0 && (
          <SectionShell>
            <StencilLabel code="SEC.01">Kinh nghiệm thi công</StencilLabel>
            <div className="overflow-hidden rounded-sm border bg-white" style={{ borderColor: STEEL_DARK }}>
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr style={{ backgroundColor: STEEL_DARK }}>
                    <th className="border-r px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white last:border-r-0" style={{ borderColor: STEEL }}>
                      Vai trò
                    </th>
                    <th className="border-r px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white last:border-r-0" style={{ borderColor: STEEL }}>
                      Đơn vị
                    </th>
                    <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white">
                      Thời gian
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.experience.map((job) => (
                    <tr key={job.id} className="cv-section-item border-t" style={{ borderColor: HAIRLINE }}>
                      <td className="border-r px-3 py-2.5 align-top" style={{ borderColor: HAIRLINE }}>
                        <p className="flex items-start gap-1.5 font-bold" style={{ color: STEEL_DARK }}>
                          <Briefcase className="mt-0.5 size-3.5 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
                          {job.role || "Chức danh"}
                        </p>
                        {job.description && (
                          <p className="mt-1 whitespace-pre-line text-[12px]" style={{ color: MUTED }}>
                            {job.description}
                          </p>
                        )}
                      </td>
                      <td className="border-r px-3 py-2.5 align-top font-semibold" style={{ borderColor: HAIRLINE, color: STEEL }}>
                        {job.company || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <DateText range={job.range} className="text-[11.5px]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionShell>
        )}

        {data.projects.length > 0 && (
          <SectionShell>
            <StencilLabel code="SEC.02">Hạng mục dự án</StencilLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {data.projects.map((p, idx) => (
                <div
                  key={p.id}
                  className="cv-section-item rounded-sm border bg-white px-3.5 py-3"
                  style={{ borderColor: STEEL }}
                >
                  <p className="text-[10px] font-bold tracking-[0.18em]" style={{ color: ACCENT }}>
                    {`HẠNG MỤC ${String(idx + 1).padStart(2, "0")}`}
                  </p>
                  <h3 className="mt-1 font-bold" style={{ color: STEEL_DARK }}>
                    {p.name || "Dự án"}
                  </h3>
                  {p.role && (
                    <p className="text-[12px] font-semibold" style={{ color: STEEL }}>
                      {p.role}
                    </p>
                  )}
                  {p.range && (p.range.start || p.range.end) && (
                    <DateText range={p.range} className="mt-0.5 block text-[11.5px]" />
                  )}
                  {p.description && (
                    <p className="mt-1 whitespace-pre-line text-[12px]" style={{ color: MUTED }}>
                      {p.description}
                    </p>
                  )}
                  {p.tech.length > 0 && (
                    <p className="mt-1.5 border-t pt-1.5 text-[11px]" style={{ borderColor: HAIRLINE, color: MUTED }}>
                      <span className="font-bold" style={{ color: STEEL_DARK }}>
                        VẬT LIỆU:{" "}
                      </span>
                      {p.tech.join(" / ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.education.length > 0 && (
          <SectionShell>
            <StencilLabel code="SEC.03">Đào tạo</StencilLabel>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div
                  key={edu.id}
                  className="cv-section-item flex items-baseline justify-between gap-3 rounded-sm border bg-white px-3.5 py-2.5"
                  style={{ borderColor: HAIRLINE }}
                >
                  <div>
                    <h3 className="font-bold" style={{ color: STEEL_DARK }}>
                      {edu.school || "Trường"}
                    </h3>
                    {edu.degree && (
                      <p className="text-[12px] font-semibold" style={{ color: STEEL }}>
                        {edu.degree}
                      </p>
                    )}
                    {edu.description && (
                      <p className="mt-0.5 whitespace-pre-line text-[12px]" style={{ color: MUTED }}>
                        {edu.description}
                      </p>
                    )}
                  </div>
                  <DateText range={edu.range} className="shrink-0 text-[11.5px]" />
                </div>
              ))}
            </div>
          </SectionShell>
        )}

        {data.skills.length > 0 && (
          <SectionShell>
            <StencilLabel code="SEC.04">Vật liệu / kỹ năng</StencilLabel>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="cv-section-item rounded-sm border bg-white px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ borderColor: STEEL, color: STEEL_DARK }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </SectionShell>
        )}

        {data.certificates.length > 0 && (
          <SectionShell>
            <StencilLabel code="SEC.05">Tem kiểm định</StencilLabel>
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div
                  key={c.id}
                  className="cv-section-item flex items-start gap-2 rounded-sm border bg-white px-3.5 py-2.5"
                  style={{ borderColor: HAIRLINE }}
                >
                  <Award className="mt-0.5 size-4 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
                  <div>
                    <p className="text-[12.5px] font-bold" style={{ color: STEEL_DARK }}>
                      {c.name || "Chứng chỉ"}
                    </p>
                    {[c.issuer, c.date].filter(Boolean).length > 0 && (
                      <p className="text-[11.5px]" style={{ color: MUTED }}>
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>
        )}
      </div>

      <footer className="mt-6 flex items-center justify-between border-t-2 pt-3" style={{ borderColor: STEEL_DARK }}>
        <p className="text-[10px] font-bold uppercase" style={{ color: STEEL, letterSpacing: "0.24em" }}>
          Khung tên — Tỷ lệ 1:1
        </p>
        <p className="text-[10px] font-bold uppercase" style={{ color: ACCENT, letterSpacing: "0.24em" }}>
          Duyệt ✓
        </p>
      </footer>
    </div>
  );
}
