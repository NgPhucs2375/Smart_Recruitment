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
  description?: string;
  skills: string[];
};

export type ResumeEducation = {
  id: string;
  school: string;
  degree?: string;
  range: ResumeDateRange;
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
};

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

  const contacts: ResumeContact[] = [];
  if (lh.email) contacts.push({ label: "Email", value: lh.email, href: asLink(lh.email) });
  if (lh.sdt) contacts.push({ label: "Điện thoại", value: lh.sdt, href: asLink(lh.sdt) });
  if (lh.diaChi) contacts.push({ label: "Địa chỉ", value: lh.diaChi });
  if (lh.linkedIn) contacts.push({ label: "LinkedIn", value: lh.linkedIn, href: asLink(lh.linkedIn) });
  if (lh.github) contacts.push({ label: "GitHub", value: lh.github, href: asLink(lh.github) });
  if (lh.portfolio) contacts.push({ label: "Portfolio", value: lh.portfolio, href: asLink(lh.portfolio) });

  const experience: ResumeExperience[] = data.kinhNghiemLamViec.map((k) => ({
    id: k.id,
    role: k.chucDanh,
    company: k.congTy,
    range: toRange(k.tuNgay, k.denNgay, k.isHienTai),
    description: k.moTa || undefined,
    skills: k.kyNangSuDung,
  }));

  const education: ResumeEducation[] = data.hocVan.map((h) => ({
    id: h.id,
    school: h.truong,
    degree: h.chuyenNganh || undefined,
    range: toRange(h.tuNgay, h.denNgay, h.isHienTai),
    description: h.moTa || undefined,
  }));

  const skills: ResumeSkill[] = data.kyNang.map((k) => ({
    id: k.id,
    name: k.tenKyNang,
    detail: [k.soNamKinhNghiem, k.mucDoThanhThao].filter(Boolean).join(" · ") || undefined,
  }));

  const projects: ResumeProject[] = data.duAn.map((d) => {
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

  const certificates: ResumeCertificate[] = data.chungChi.map((c) => ({
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
    summary: lh.gioiThieuBanThan || undefined,
    contacts,
    experience,
    education,
    skills,
    projects,
    certificates,
    hasContent,
  };
}
