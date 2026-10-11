"use client";

// Nhiếp Ảnh Cam — portfolio nhiếp ảnh gia: header đen + tên script vàng,
// sóng cam SVG, cards trắng trên nền cam, bars tím.
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ResumeContact } from "@/features/tao-cv/resume-data";
import { safeHref } from "@/features/tao-cv/resume-data";
import type { ResumeTemplateProps } from "./shared";
import { DateText, EmptyPaper, SectionShell, SplitBlocks, resolveBannerTitle3 } from "./shared";

const BLACK = "#161616";
const ORANGE = "#f59e0b";
const ORANGE_DEEP = "#d97706";
const PURPLE = "#7c3aed";
const GOLD = "#fbbf24";
const INK = "#292524";

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
  return <Icon className="size-3.5 shrink-0" style={{ color: PURPLE }} strokeWidth={2.2} />;
}

/** Dải sóng festoon: fill màu mặt dưới, nền trong suốt để lộ mặt trên. */
function Wave({ fill, flip }: { fill: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 210 8"
      preserveAspectRatio="none"
      className="block h-[10px] w-full"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
      aria-hidden="true"
    >
      <path
        d="M0,8 Q8.75,0 17.5,8 T35,8 T52.5,8 T70,8 T87.5,8 T105,8 T122.5,8 T140,8 T157.5,8 T175,8 T192.5,8 T210,8 L210,8 L0,8 Z"
        fill={fill}
      />
    </svg>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[12px] font-bold" style={{ color: PURPLE }}>
      {children}
    </h2>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NhiepAnhTemplate({ data }: ResumeTemplateProps) {
  if (!data.hasContent) {
    return (
      <div className="cv-paper cv-paper-a4">
        <EmptyPaper hint="Bắt đầu điền thông tin bên trái để xem trước CV" />
      </div>
    );
  }
  const avatar = data.avatarUrl?.trim() || undefined;

  return (
    <div className="cv-paper cv-paper-a4 text-[12.5px] leading-relaxed" style={{ backgroundColor: ORANGE, color: INK }}>
      {/* Header đen */}
      <div style={{ backgroundColor: BLACK }}>
        <div className="flex items-center gap-5 px-7 pb-5 pt-6">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={data.name || "Ảnh đại diện"}
              className="h-28 w-24 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div
              className="flex h-28 w-24 shrink-0 items-center justify-center rounded-xl bg-white/10"
              aria-hidden="true"
            >
              <span className="font-script text-[30px]" style={{ color: GOLD }}>
                {initials(data.name)}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
              {resolveBannerTitle3(data, data.title, "Portfolio")}
            </p>
            <p className="font-script mt-0.5 text-[34px] font-bold leading-tight" style={{ color: GOLD }}>
              {data.name || "Họ và tên"}
            </p>
            {data.title && (
              <p className="mt-0.5 text-[12px] font-medium text-white/85">
                {data.title}
              </p>
            )}
            {data.summary && (
              <SplitBlocks
                text={data.summary}
                className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-[11.5px] [overflow-wrap:anywhere]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              />
            )}
          </div>
        </div>
      </div>
      <Wave fill={ORANGE} />

      {/* Thân cam + cards trắng */}
      <div className="grid grid-cols-[35%_65%] gap-4 px-6 py-5">
        <div className="min-w-0 space-y-3">
          {data.contacts.length > 0 && (
            <div className="cv-section-item rounded-2xl bg-white p-3.5">
              <CardTitle>Liên hệ</CardTitle>
              <div className="space-y-1.5">
                {data.contacts.map((c, i) => (
                  <p key={`${c.label}-${i}`} className="flex items-start gap-1.5 text-[11.5px] leading-snug">
                    <ContactIcon label={c.label} />
                    <span className="break-all">
                      {c.href ? (
                        <a href={c.href} className="underline underline-offset-2">
                          {c.value}
                        </a>
                      ) : (
                        c.value
                      )}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}
          {data.skills.length > 0 && (
            <SectionShell section="skills">
              <div className="rounded-2xl bg-white p-3.5">
                <CardTitle>Kỹ năng</CardTitle>
                <div className="space-y-2">
                  {data.skills.map((s) => (
                    <div key={s.id} className="cv-section-item">
                      <p className="text-[11.5px] font-semibold">{s.name}</p>
                      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
                        <span className="block h-full w-4/5 rounded-full" style={{ backgroundColor: PURPLE }} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
          {data.education.length > 0 && (
            <SectionShell section="education">
              <div className="rounded-2xl bg-white p-3.5">
                <CardTitle>Học vấn</CardTitle>
                <div className="space-y-2">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="cv-section-item text-[11.5px]">
                      <p className="font-bold">{edu.school || "Trường"}</p>
                      {edu.degree && <p>{edu.degree}</p>}
                      <DateText range={edu.range} className="text-[11px]" />
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          {data.experience.length > 0 && (
            <SectionShell section="experience">
              <div className="rounded-2xl bg-white p-4">
                <CardTitle>Kinh nghiệm</CardTitle>
                <div className="space-y-3">
                  {data.experience.map((job) => (
                    <div key={job.id} className="cv-section-item">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-mono text-[11px] font-bold" style={{ color: ORANGE_DEEP }}>
                          <DateText range={job.range} />
                        </p>
                      </div>
                      <h3 className="font-bold" style={{ color: PURPLE }}>{job.role || "Chức danh"}</h3>
                      {job.company && (
                        <p className="text-[11.5px] font-semibold">{job.company}</p>
                      )}
                      {job.description && (
                        <SplitBlocks text={job.description} className="mt-1 whitespace-pre-line break-words text-[11.5px] [overflow-wrap:anywhere]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
          {data.projects.length > 0 && (
            <SectionShell section="projects">
              <div className="rounded-2xl bg-white p-4">
                <CardTitle>Dự án</CardTitle>
                <div className="space-y-2.5">
                  {data.projects.map((p) => (
                    <div key={p.id} className="cv-section-item">
                      <h3 className="font-bold" style={{ color: PURPLE }}>{p.name || "Dự án"}</h3>
                      {p.description && (
                        <SplitBlocks text={p.description} className="mt-0.5 whitespace-pre-line break-words text-[11.5px] [overflow-wrap:anywhere]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionShell>
          )}
          {data.certificates.length > 0 && (
            <SectionShell section="certificates">
              <div className="rounded-2xl bg-white p-4">
                <CardTitle>Chứng chỉ</CardTitle>
                <ul className="list-inside list-disc space-y-1 text-[11.5px]">
                  {data.certificates.map((c) => (
                    <li key={c.id} className="cv-section-item">
                      <span className="font-semibold">{c.name || "Chứng chỉ"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionShell>
          )}
        </div>
      </div>

      {/* Footer đen */}
      <Wave fill={BLACK} flip />
      <div className="px-7 pb-5 pt-1 text-center" style={{ backgroundColor: BLACK }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
          {data.name || "Portfolio"} · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
