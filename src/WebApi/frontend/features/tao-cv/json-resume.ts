import type { CvFormData, JsonResume } from "@/lib/types";
import { isoToVnDate, newId, normalizeCvPartialDate, partialDateToIso } from "./cv-data";

export const JSON_RESUME_SCHEMA =
  "https://raw.githubusercontent.com/jsonresume/resume-schema/master/schema.json";

const compact = <T>(values: (T | null | undefined | false)[]): T[] => values.filter(Boolean) as T[];

const toJsonDate = (value: string): string | undefined => partialDateToIso(value)?.slice(0, 7);

const fromJsonDate = (value: string | undefined): string => normalizeCvPartialDate(value);

const fromCertificateDate = (value: string | undefined): string => {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? isoToVnDate(value) : normalizeCvPartialDate(value);
};

export function cvDataToJsonResume(data: CvFormData): JsonResume {
  const contact = data.thongTinLienHe;
  return {
    $schema: JSON_RESUME_SCHEMA,
    basics: {
      name: contact.hoTen || undefined,
      label: contact.viTriUngTuyen || undefined,
      image: contact.anhDaiDienUrl || undefined,
      email: contact.email || undefined,
      phone: contact.sdt || undefined,
      url: contact.portfolio || undefined,
      summary: contact.gioiThieuBanThan || undefined,
      location: contact.diaChi ? { address: contact.diaChi } : undefined,
      profiles: compact([
        contact.github ? { network: "GitHub", url: contact.github } : null,
        contact.linkedIn ? { network: "LinkedIn", url: contact.linkedIn } : null,
      ]),
    },
    work: data.kinhNghiemLamViec.map((item) => ({
      name: item.congTy || undefined,
      position: item.chucDanh || undefined,
      location: item.diaChi || undefined,
      startDate: toJsonDate(item.tuNgay),
      endDate: item.isHienTai ? "" : toJsonDate(item.denNgay),
      summary: item.moTa || undefined,
    })),
    education: data.hocVan.map((item) => ({
      institution: item.truong || undefined,
      area: item.chuyenNganh || undefined,
      studyType: item.bangCap || undefined,
      startDate: toJsonDate(item.tuNgay),
      endDate: item.isHienTai ? "" : toJsonDate(item.denNgay),
      courses: item.moTa ? item.moTa.split("\n").filter(Boolean) : undefined,
    })),
    projects: data.duAn.map((item) => ({
      name: item.tenDuAn || undefined,
      description: item.moTa || undefined,
      keywords: item.congNghe.length > 0 ? item.congNghe : undefined,
      startDate: toJsonDate(item.tuNgay),
      endDate: item.isHienTai ? "" : toJsonDate(item.denNgay),
      url: item.link || undefined,
      roles: item.vaiTro ? [item.vaiTro] : undefined,
    })),
    skills: data.kyNang.map((item) => ({
      name: item.tenKyNang || undefined,
      level: item.mucDoThanhThao || undefined,
      keywords: item.soNamKinhNghiem ? [`${item.soNamKinhNghiem} years`] : undefined,
    })),
    certificates: data.chungChi.map((item) => ({
      name: item.tenChungChi || undefined,
      issuer: item.donViCap || undefined,
      date: item.ngayCap ? partialDateToIso(item.ngayCap) ?? undefined : undefined,
      url: item.credentialUrl || undefined,
    })),
    meta: {
      version: "1.0.0",
      lastModified: new Date().toISOString(),
    },
  };
}

export function jsonResumeToCvData(resume: JsonResume, fallback: CvFormData): CvFormData {
  const basics = resume.basics ?? {};
  const profiles = basics.profiles ?? [];
  const profileUrl = (network: string) =>
    profiles.find((profile) => profile.network?.toLowerCase() === network.toLowerCase())?.url ?? "";

  return {
    ...fallback,
    thongTinLienHe: {
      ...fallback.thongTinLienHe,
      hoTen: basics.name ?? "",
      email: basics.email ?? "",
      sdt: basics.phone ?? "",
      diaChi: basics.location?.address ?? "",
      github: profileUrl("GitHub"),
      linkedIn: profileUrl("LinkedIn"),
      portfolio: basics.url ?? "",
      viTriUngTuyen: basics.label ?? "",
      gioiThieuBanThan: basics.summary ?? "",
      anhDaiDienUrl: basics.image ?? "",
    },
    kinhNghiemLamViec: (resume.work ?? []).map((item) => ({
      id: newId(),
      congTy: item.name ?? "",
      chucDanh: item.position ?? "",
      diaChi: item.location ?? "",
      tuNgay: fromJsonDate(item.startDate),
      denNgay: fromJsonDate(item.endDate),
      isHienTai: Boolean(item.startDate && !item.endDate),
      moTa: [item.summary, ...(item.highlights ?? [])].filter(Boolean).join("\n"),
      kyNangSuDung: [],
    })),
    hocVan: (resume.education ?? []).map((item) => ({
      id: newId(),
      truong: item.institution ?? "",
      chuyenNganh: item.area ?? "",
      bangCap: item.studyType ?? "",
      tuNgay: fromJsonDate(item.startDate),
      denNgay: fromJsonDate(item.endDate),
      isHienTai: Boolean(item.startDate && !item.endDate),
      moTa: (item.courses ?? []).join("\n"),
    })),
    duAn: (resume.projects ?? []).map((item) => ({
      id: newId(),
      tenDuAn: item.name ?? "",
      vaiTro: item.roles?.join(", ") ?? "",
      congNghe: item.keywords ?? [],
      link: item.url ?? "",
      moTa: [item.description, ...(item.highlights ?? [])].filter(Boolean).join("\n"),
      tuNgay: fromJsonDate(item.startDate),
      denNgay: fromJsonDate(item.endDate),
      isHienTai: Boolean(item.startDate && !item.endDate),
    })),
    kyNang: (resume.skills ?? []).map((item) => ({
      id: newId(),
      tenKyNang: item.name ?? "",
      mucDoThanhThao: item.level ?? "",
      soNamKinhNghiem: "",
    })),
    chungChi: (resume.certificates ?? []).map((item) => ({
      id: newId(),
      tenChungChi: item.name ?? "",
      donViCap: item.issuer ?? "",
      ngayCap: fromCertificateDate(item.date),
      maXacMinh: "",
      credentialUrl: item.url ?? "",
    })),
  };
}
