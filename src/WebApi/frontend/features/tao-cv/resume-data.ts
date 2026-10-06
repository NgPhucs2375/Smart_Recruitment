import type { CvFormData } from "@/lib/types";
import { normalizeCvPartialDate, renderCvDateRange } from "./cv-data";

/**
 * View-only resume model for visual templates.
 * Derived from CvFormData via toResumeData(). Templates must only read
 * this shape — never CvFormData, never form state, never APIs.
 */

export type ResumeContact = {
  label: string;
  value: string;
  href?: string;
};

/** Modular layout: thứ tự + ẩn/hiện section, kéo thả ở form, render ở template. */
export type CvSectionId = "summary" | "experience" | "projects" | "education" | "skills" | "certificates";

export interface SectionConfig {
  id: CvSectionId;
  /** Tiêu đề hiển thị (cho phép đổi tên). */
  title: string;
  isVisible: boolean;
}

export interface ResumeLayoutConfig {
  sectionOrder: CvSectionId[];
  sections: Record<CvSectionId, SectionConfig>;
  /** Section nào vào sidebar khi theme dùng layout 2 cột (config từng theme). */
  sidebarSections?: CvSectionId[];
}

/** Mặc định sidebar: liên hệ không có id riêng nên chỉ gồm skills + certificates. */
export const DEFAULT_SIDEBAR_SECTIONS: CvSectionId[] = ["skills", "certificates"];

export const DEFAULT_SECTION_ORDER: CvSectionId[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "certificates",
];

const SECTION_TITLES: Record<CvSectionId, string> = {
  summary: "Tóm tắt",
  experience: "Kinh nghiệm làm việc",
  projects: "Dự án tiêu biểu",
  education: "Học vấn",
  skills: "Kỹ năng",
  certificates: "Chứng chỉ",
};

export function createDefaultLayoutConfig(): ResumeLayoutConfig {
  const sections = {} as Record<CvSectionId, SectionConfig>;
  for (const id of DEFAULT_SECTION_ORDER) {
    sections[id] = { id, title: SECTION_TITLES[id], isVisible: true };
  }
  return { sectionOrder: [...DEFAULT_SECTION_ORDER], sections, sidebarSections: [...DEFAULT_SIDEBAR_SECTIONS] };
}

/** Chuẩn hóa config từ JSON/draft cũ: thiếu → default, id lạ → bỏ. */
export function normalizeLayoutConfig(raw: unknown): ResumeLayoutConfig {
  const fallback = createDefaultLayoutConfig();
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as { sectionOrder?: unknown; sections?: unknown; sidebarSections?: unknown };
  const order = Array.isArray(r.sectionOrder)
    ? (r.sectionOrder as unknown[]).filter(
        (id): id is CvSectionId => typeof id === "string" && (DEFAULT_SECTION_ORDER as string[]).includes(id),
      )
    : [];
  const merged: CvSectionId[] = [...order];
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!merged.includes(id)) merged.push(id);
  }
  const rawSections = (r.sections ?? {}) as Record<string, { title?: unknown; isVisible?: unknown }>;
  const sections = { ...fallback.sections };
  for (const id of DEFAULT_SECTION_ORDER) {
    const s = rawSections[id];
    if (s && typeof s === "object") {
      sections[id] = {
        id,
        title: typeof s.title === "string" && s.title.trim() ? s.title : SECTION_TITLES[id],
        isVisible: s.isVisible !== false,
      };
    }
  }
  const sidebar = validSidebar(r.sidebarSections) ? [...r.sidebarSections] : [...DEFAULT_SIDEBAR_SECTIONS];
  return { sectionOrder: merged, sections, sidebarSections: sidebar };
}

const validSidebar = (v: unknown): v is CvSectionId[] =>
  Array.isArray(v) &&
  v.every((id) => typeof id === "string" && (DEFAULT_SECTION_ORDER as string[]).includes(id));

export type ResumeDateRange = {
  start: string;
  end: string;
  current?: boolean;
};

export type ResumeExperience = {
  id: string;
  role: string;
  company: string;
  range: ResumeDateRange;
  /** Upzi: cờ "hiện vẫn đang làm ở đây" — mirror của range.current. */
  isCurrent?: boolean;
  description?: string;
  skills: string[];
};

export type ResumeEducation = {
  id: string;
  school: string;
  degree?: string;
  range: ResumeDateRange;
  /** Upzi: cờ "hiện vẫn đang học ở đây" — mirror của range.current. */
  isCurrent?: boolean;
  description?: string;
};

export type ResumeSkill = {
  id: string;
  name: string;
  detail?: string;
};

export type ResumeProject = {
  id: string;
  name: string;
  role?: string;
  link?: string;
  description?: string;
  tech: string[];
  range?: ResumeDateRange;
};

export type ResumeCertificate = {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  code?: string;
};

export type ResumeData = {
  name: string;
  title?: string;
  /** B4-title: override banner trang trí (VD "Thực đơn nghề nghiệp").
      Trống = template dùng literal mặc định của nó. Additive, không vỡ cũ. */
  customTitle?: string;
  summary?: string;
  contacts: ResumeContact[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  projects: ResumeProject[];
  certificates: ResumeCertificate[];
  hasContent: boolean;
  /** Bố cục kéo thả/ẩn hiện — template sóng 1 render theo sectionOrder. */
  layout: ResumeLayoutConfig;
};

const hasText = (v: string | null | undefined): boolean => (v ?? "").trim() !== "";

/**
 * Card test trống (chưa gõ chữ nào) không lên preview: tránh hàng
 * "Chức danh"/"Trường" giả chiếm chỗ, đẩy section sau và để lại
 * khoảng trắng chết cuối trang. Dữ liệu form giữ nguyên.
 */
const fmtPartial = (v: string | null | undefined): string => normalizeCvPartialDate(v);

const toRange = (
  tu: string | null | undefined,
  den: string | null | undefined,
  hienTai?: boolean
): ResumeDateRange => {
  const r = renderCvDateRange(tu, den, hienTai);
  return { start: r.start, end: r.end, current: hienTai };
};

const asLink = (value: string): string | undefined => {
  const v = value.trim();
  if (!v) return undefined;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  if (v.includes("@") && !v.includes(" ")) return `mailto:${v}`;
  if (/^[+\d][\d\s().-]*$/.test(v)) return `tel:${v.replace(/[\s().-]/g, "")}`;
  return `https://${v}`;
};

/**
 * Pure adapter: CvFormData -> ResumeData.
 * No React state, no API, no mutation of the input.
 */
export function toResumeData(data: CvFormData): ResumeData {
  const lh = data.thongTinLienHe;
  const layout = normalizeLayoutConfig(data.layoutConfig);
  const visible = (id: CvSectionId): boolean => layout.sections[id]?.isVisible !== false;

  const contacts: ResumeContact[] = [];
  if (lh.email) contacts.push({ label: "Email", value: lh.email, href: asLink(lh.email) });
  if (lh.sdt) contacts.push({ label: "Điện thoại", value: lh.sdt, href: asLink(lh.sdt) });
  if (lh.diaChi) contacts.push({ label: "Địa chỉ", value: lh.diaChi });
  if (lh.linkedIn) contacts.push({ label: "LinkedIn", value: lh.linkedIn, href: asLink(lh.linkedIn) });
  if (lh.github) contacts.push({ label: "GitHub", value: lh.github, href: asLink(lh.github) });
  if (lh.portfolio) contacts.push({ label: "Portfolio", value: lh.portfolio, href: asLink(lh.portfolio) });

  const experience: ResumeExperience[] = !visible("experience")
    ? []
    : data.kinhNghiemLamViec
    .filter((k) => hasText(k.congTy) || hasText(k.chucDanh) || hasText(k.moTa) || k.kyNangSuDung.length > 0)
    .map((k) => ({
    id: k.id,
    role: k.chucDanh,
    company: k.congTy,
    range: toRange(k.tuNgay, k.denNgay, k.isHienTai),
    isCurrent: k.isHienTai || undefined,
    description: k.moTa || undefined,
    skills: k.kyNangSuDung,
  }));

  const education: ResumeEducation[] = !visible("education")
    ? []
    : data.hocVan
    .filter((h) => hasText(h.truong) || hasText(h.chuyenNganh) || hasText(h.moTa))
    .map((h) => ({
    id: h.id,
    school: h.truong,
    degree: h.chuyenNganh || undefined,
    range: toRange(h.tuNgay, h.denNgay, h.isHienTai),
    isCurrent: h.isHienTai || undefined,
    description: h.moTa || undefined,
  }));

  const skills: ResumeSkill[] = !visible("skills")
    ? []
    : data.kyNang
    .filter((k) => hasText(k.tenKyNang))
    .map((k) => ({
    id: k.id,
    name: k.tenKyNang,
    detail: [k.soNamKinhNghiem, k.mucDoThanhThao].filter(Boolean).join(" · ") || undefined,
  }));

  const projects: ResumeProject[] = !visible("projects")
    ? []
    : data.duAn
    .filter((d) => hasText(d.tenDuAn) || hasText(d.vaiTro) || hasText(d.moTa) || d.congNghe.length > 0)
    .map((d) => {
    const r = renderCvDateRange(d.tuNgay, d.denNgay, d.isHienTai);
    return {
      id: d.id,
      name: d.tenDuAn,
      role: d.vaiTro || undefined,
      link: d.link || undefined,
      description: d.moTa || undefined,
      tech: d.congNghe,
      range: r.start || r.end ? { start: r.start, end: r.end, current: d.isHienTai } : undefined,
    };
  });

  const certificates: ResumeCertificate[] = !visible("certificates")
    ? []
    : data.chungChi
    .filter((c) => hasText(c.tenChungChi) || hasText(c.donViCap))
    .map((c) => ({
    id: c.id,
    name: c.tenChungChi,
    issuer: c.donViCap || undefined,
    date: fmtPartial(c.ngayCap) || undefined,
    code: c.maXacMinh || undefined,
  }));

  const hasContent =
    lh.hoTen !== "" ||
    experience.length > 0 ||
    education.length > 0 ||
    skills.length > 0 ||
    projects.length > 0 ||
    certificates.length > 0;

  return {
    name: lh.hoTen,
    title: lh.viTriUngTuyen || undefined,
    customTitle: data.tieuDeHienThi?.trim() || undefined,
    summary: visible("summary") ? lh.gioiThieuBanThan || undefined : undefined,
    contacts,
    experience,
    education,
    skills,
    projects,
    certificates,
    hasContent,
    layout,
  };
}
