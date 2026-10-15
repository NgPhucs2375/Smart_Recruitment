import type { CvFormData } from "@/lib/types";
import { detectCvDatePrecision, isValidCvPartialDate, isValidVnDate } from "../cv-data";
import { parseVndInput } from "@/lib/format-vnd";
import {
  MSG_EMAIL,
  MSG_PHONE,
  MSG_URL,
  hasControlChars,
  isFutureVnDate,
  isValidEmail,
  isValidHttpUrl,
  isValidVnPhone,
} from "../validation";

const MSG_CONTROL_CHARS = "Nội dung chứa ký tự điều khiển không hợp lệ.";
const MSG_TOO_LONG = "Nội dung vượt quá độ dài cho phép.";

/** Tên riêng/địa chỉ/công ty: cấm control chars + giới hạn độ dài mềm. */
function checkText(value: string, label: string, max: number): string | null {
  const v = value.trim();
  if (!v) return null;
  if (hasControlChars(value)) return `${label}: ${MSG_CONTROL_CHARS}`;
  if (v.length > max) return `${label}: ${MSG_TOO_LONG} (tối đa ${max} ký tự).`;
  return null;
}

export function validateManualCv(data: CvFormData): string | null {
  const contact = data.thongTinLienHe;
  if (!contact.hoTen.trim() || !contact.email.trim() || !contact.sdt.trim()) {
    return "Vui lòng nhập họ tên, email và số điện thoại.";
  }
  const badName = checkText(contact.hoTen, "Họ tên", 100);
  if (badName) return badName;
  if (!isValidEmail(contact.email)) {
    return MSG_EMAIL;
  }
  if (!isValidVnPhone(contact.sdt)) {
    return MSG_PHONE;
  }
  if (!isValidVnDate(contact.ngaySinh)) {
    return "Ngày sinh phải đúng định dạng dd/mm/yyyy.";
  }
  if (contact.ngaySinh.trim() && isFutureVnDate(contact.ngaySinh)) {
    return "Ngày sinh không thể ở tương lai.";
  }
  const badAddr = checkText(contact.diaChi, "Địa chỉ", 220);
  if (badAddr) return badAddr;
  const urlFields: [string, string][] = [
    [contact.github, "GitHub"],
    [contact.linkedIn, "LinkedIn"],
    [contact.portfolio, "Portfolio"],
  ];
  for (const [value, label] of urlFields) {
    if (value.trim() && !isValidHttpUrl(value)) {
      return `${label}: ${MSG_URL}`;
    }
  }
  const badTitle = checkText(contact.viTriUngTuyen, "Vị trí ứng tuyển", 80);
  if (badTitle) return badTitle;
  if (contact.mucLuongMongMuon.trim()) {
    const salary = parseVndInput(contact.mucLuongMongMuon);
    if (!Number.isFinite(salary) || salary < 0) return "Mức lương mong muốn phải là số không âm.";
  }
  if (data.hocVan.length + data.kinhNghiemLamViec.length === 0) {
    return "CV cần ít nhất một mục kinh nghiệm hoặc học vấn.";
  }

  const periods = [
    ...data.hocVan.map((item) => ({ label: "học vấn", from: item.tuNgay, to: item.denNgay })),
    ...data.kinhNghiemLamViec.map((item) => ({ label: "kinh nghiệm", from: item.tuNgay, to: item.denNgay })),
    ...data.duAn.map((item) => ({ label: "dự án", from: item.tuNgay, to: item.denNgay })),
  ];
  for (const period of periods) {
    for (const value of [period.from, period.to]) {
      if (value && !isValidCvPartialDate(value, detectCvDatePrecision(value))) {
        return `Thời gian ${period.label} không hợp lệ.`;
      }
    }
  }

  for (const skill of data.kyNang) {
    if (!skill.tenKyNang.trim()) return "Tên kỹ năng không được để trống.";
    if (hasControlChars(skill.tenKyNang)) return `Kỹ năng: ${MSG_CONTROL_CHARS}`;
    if (skill.soNamKinhNghiem.trim()) {
      const years = Number(skill.soNamKinhNghiem);
      if (!Number.isFinite(years) || years < 0 || years > 100) {
        return `Số năm kinh nghiệm của kỹ năng "${skill.tenKyNang}" phải từ 0 đến 100.`;
      }
    }
  }

  for (const exp of data.kinhNghiemLamViec) {
    for (const [value, label] of [
      [exp.congTy, "Tên công ty"],
      [exp.chucDanh, "Chức danh"],
    ] as [string, string][]) {
      const bad = checkText(value, label, 100);
      if (bad) return bad;
    }
  }
  for (const edu of data.hocVan) {
    for (const [value, label] of [
      [edu.truong, "Tên trường"],
      [edu.chuyenNganh, "Chuyên ngành"],
    ] as [string, string][]) {
      const bad = checkText(value, label, 120);
      if (bad) return bad;
    }
  }
  for (const proj of data.duAn) {
    const badProj = checkText(proj.tenDuAn, "Tên dự án", 100);
    if (badProj) return badProj;
    if (proj.link?.trim() && !isValidHttpUrl(proj.link)) {
      return `Link dự án "${proj.tenDuAn || "chưa đặt tên"}": ${MSG_URL}`;
    }
  }
  for (const cert of data.chungChi) {
    const filled = [cert.tenChungChi, cert.donViCap, cert.ngayCap, cert.maXacMinh].some(
      (v) => v?.trim(),
    );
    if (!filled) continue;
    if (!cert.tenChungChi.trim()) return "Tên chứng chỉ không được để trống.";
    const badCert = checkText(cert.tenChungChi, "Tên chứng chỉ", 120);
    if (badCert) return badCert;
    if (cert.ngayCap?.trim() && !isValidCvPartialDate(cert.ngayCap, detectCvDatePrecision(cert.ngayCap))) {
      return `Ngày cấp chứng chỉ "${cert.tenChungChi}" không hợp lệ.`;
    }
    if (cert.credentialUrl?.trim() && !isValidHttpUrl(cert.credentialUrl)) {
      return `Link xác minh chứng chỉ: ${MSG_URL}`;
    }
  }
  // Tên file / tiêu đề hiển thị: cấm control chars (render ở dropdown + banner).
  if (hasControlChars(data.tenFile)) return `Tên file: ${MSG_CONTROL_CHARS}`;
  if (data.tieuDeHienThi && hasControlChars(data.tieuDeHienThi)) {
    return `Tiêu đề hiển thị: ${MSG_CONTROL_CHARS}`;
  }
  return null;
}
