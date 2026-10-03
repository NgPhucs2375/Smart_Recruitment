"use client";

// Kiểu props dùng chung cho mọi template, bảo đảm template chỉ nhận ResumeData.
import type { CSSProperties, ReactNode } from "react";
import { Children, isValidElement } from "react";
import type { ResumeData, ResumeDateRange, ResumeSkill } from "@/features/tao-cv/resume-data";

export type ResumeTemplateProps = { data: ResumeData };

/**
 * B4-title — tiêu đề động 3 tầng fallback (không vỡ template cũ):
 *   1. data.customTitle (người dùng gõ trong form "Tiêu đề hiển thị")
 *   2. (section) map ngành mặc định / (banner) literal gốc của template
 *   3. fallback truyền vào.
 * Template décor giữ literal gốc làm fallback để không mất bản sắc khi
 * user để trống; user CNTT gõ "Hồ sơ ứng viên" là banner đổi ngay.
 */
export function resolveBannerTitle(data: ResumeData, fallback: string): string {
  const custom = data.customTitle?.trim();
  return custom || fallback;
}

/**
 * BATCH-blank-task: banner 3 tầng — customTitle (user gõ) → mid (thường là
 * data.title = vị trí ứng tuyển) → fallback (default trung tính của mẫu).
 */
export function resolveBannerTitle3(
  data: ResumeData,
  mid: string | undefined,
  fallback: string,
): string {
  const custom = data.customTitle?.trim();
  if (custom) return custom;
  const m = mid?.trim();
  if (m) return m;
  return fallback;
}

/**
 * BATCH-noblank-task: khe banner dùng cho template chưa có (30 mẫu).
 * Chỉ render khi user có customTitle hoặc data.title — trống thì trả null
 * để template nhìn y hệt cũ. Style truyền từ template cho đồng bộ design.
 */
export function BannerSlot({
  data,
  className = "",
  style,
}: {
  data: ResumeData;
  className?: string;
  style?: CSSProperties;
}) {
  const t = data.customTitle?.trim() || data.title?.trim() || "";
  if (!t) return null;
  return (
    <p className={className} style={style}>
      {t}
    </p>
  );
}

/**
 * BATCH-splitblocks: chẻ mô tả dài thành các sub-item phân trang.
 * Tách theo dòng trống (khối ý); mỗi khối là một div.cv-section-item riêng
 * để pack ngắt trang GIỮA các ý thay vì cắt ngang thân chữ. Text không có
 * dòng trống render 1 khối duy nhất (y hệt <p> cũ — 0 hồi quy).
 * className/style áp cho từng khối (kế thừa whitespace-pre-line từ caller
 * nếu cần giữ xuống dòng đơn bên trong khối).
 */
export function SplitBlocks({
  text,
  className = "",
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length <= 1) {
    return (
      <div className={`cv-section-item ${className}`} style={style}>
        {text}
      </div>
    );
  }
  return (
    <>
      {blocks.map((b, i) => (
        <div key={i} className={`cv-section-item ${className}`} style={style}>
          {b}
        </div>
      ))}
    </>
  );
}

export type ResumeSectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certificates"
  | "contact";

/** Bộ nhãn section chuẩn, mặc định theo ngành CNTT (mở rộng theo ngành sau). */
export const IT_SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Tóm tắt",
  experience: "Kinh nghiệm làm việc",
  education: "Học vấn",
  skills: "Kỹ năng",
  projects: "Dự án tiêu biểu",
  certificates: "Chứng chỉ",
  contact: "Liên hệ",
};

export function resolveSectionTitle(key: ResumeSectionKey, fallback: string): string {
  // Hiện tại: map ngành CNTT, thiếu key thì giữ literal gốc của template.
  // Override từng mục theo ý user là bước tiếp theo (thêm field + ô nhập).
  return IT_SECTION_LABELS[key] ?? fallback;
}

/**
 * Shared template primitives — only what genuinely repeats across
 * templates (date formatting, empty state, skill chips). Layout and
 * section styling stay inside each template file so layouts remain
 * visibly different.
 */

export function formatRange(range: ResumeDateRange): string {
  const { start, end, current } = range;
  if (current) return start ? `${start} – Hiện tại` : "Hiện tại";
  // Legacy payload "Nay" (pre-Upzi) -> chuẩn hiển thị "Hiện tại".
  const normEnd = end === "Nay" ? "Hiện tại" : end;
  if (!start && !normEnd) return "";
  return `${start || "?"} – ${normEnd || "?"}`;
}

/**
 * Upzi-style: chuẩn hóa hiển thị thời gian linh hoạt cho cột THỜI GIAN.
 * - isCurrent=true -> "start – Hiện tại" (hoặc "Hiện tại" khi thiếu start)
 * - Ngược lại nối start/end, bỏ trống 2 đầu, "" khi cả 3 đều trống.
 */
export function formatDateRange(startDate?: string, endDate?: string, isCurrent?: boolean): string {
  const start = startDate ? startDate.trim() : "";
  if (isCurrent) return start ? `${start} – Hiện tại` : "Hiện tại";
  const end = endDate ? endDate.trim() : "";
  if (!start && !end) return "";
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

export function DateText({ range, className = "" }: { range: ResumeDateRange; className?: string }) {
  const text = formatRange(range);
  if (!text) return null;
  // BATCH1-wrap: bỏ whitespace-nowrap (tràn sidebar hẹp) — cho phép bẻ
  // range dài, chặn chuỗi không dấu cách văng khỏi khung.
  return <span className={`max-w-full break-words [overflow-wrap:anywhere] ${className}`}>{text}</span>;
}

export function EmptyPaper({ hint }: { hint: string }) {
  return (
    <div className="px-8 py-12 text-center text-sm text-neutral-500">
      <p>{hint}</p>
    </div>
  );
}

/**
 * SectionShell bọc CẢ section (kể cả heading) nên KHÔNG dùng
 * cv-section-item (break-inside: avoid) — section dài phải được
 * phép tách qua trang khi in, tránh khoảng trống lớn + trang trắng.
 * cv-section-shell chỉ phục vụ orphan protection cho heading.
 */
type CvSection = "contact" | "experience" | "education" | "skills" | "projects" | "certificates";

function textFromNode(node: ReactNode): string {
  return Children.toArray(node).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    if (isValidElement(child)) {
      return textFromNode((child.props as { children?: ReactNode }).children);
    }
    return "";
  }).join(" ");
}

function inferSection(children: ReactNode): CvSection | undefined {
  const heading = textFromNode(Children.toArray(children)[0]).toLocaleLowerCase("vi");
  if (heading.includes("liên hệ") || heading.includes("contact") || heading.includes("profile")) return "contact";
  if (heading.includes("kinh nghiệm") || heading.includes("experience")) return "experience";
  if (heading.includes("học vấn") || heading.includes("đào tạo") || heading.includes("education")) return "education";
  if (heading.includes("kỹ năng") || heading.includes("skill") || heading.includes("competenc")) return "skills";
  if (heading.includes("dự án") || heading.includes("project")) return "projects";
  if (heading.includes("chứng chỉ") || heading.includes("certificate")) return "certificates";
  return undefined;
}

export function SectionShell({ children, section }: { children: ReactNode; section?: CvSection }) {
  // BATCH1-wrap: min-w-0 để con flex/grid không đẩy phình section,
  // overflow-wrap để chuỗi dài bẻ dòng trong khung.
  return <section className="cv-section-shell min-w-0 break-words [overflow-wrap:anywhere]" data-cv-section={section ?? inferSection(children)}>{children}</section>;
}

/**
 * Skill chips — names only. Years of experience and proficiency stay in
 * ResumeData for AI/matching but are never rendered as numeric suffixes.
 * Variants tune the chip surface; layout stays with the caller.
 */
export function SkillChips({
  skills,
  variant = "outline",
  className = "",
}: {
  skills: ResumeSkill[];
  variant?: "outline" | "soft" | "plain";
  className?: string;
}) {
  if (skills.length === 0) return null;
  if (variant === "plain") {
    return (
      <p className={`cv-section-item min-w-0 break-words leading-loose [overflow-wrap:anywhere] ${className}`}>
        {skills.map((s, i) => (
          <span key={s.id}>
            {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
            <span className="font-medium break-words text-neutral-800 [overflow-wrap:anywhere]">{s.name}</span>
          </span>
        ))}
      </p>
    );
  }
  const chip =
    variant === "soft"
      ? "rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      : "rounded-md px-2 py-1 text-[11.5px] font-semibold";
  return (
    <div className={`cv-section-item flex min-w-0 flex-wrap gap-1.5 ${className}`}>
      {skills.map((s) => (
        <span
          key={s.id}
          className={`max-w-full break-words [overflow-wrap:anywhere] ${chip}`}
          style={
            variant === "soft"
              ? {
                  color: "var(--hire-navy)",
                  border: "1px solid var(--hire-chip-border)",
                  backgroundColor: "var(--hire-navy-soft)",
                }
              : {
                  color: "var(--hire-navy)",
                  border: "1px solid var(--hire-chip-border)",
                  backgroundColor: "#fff",
                }
          }
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}
