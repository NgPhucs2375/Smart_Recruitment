import type { CvFormData } from "@/lib/types";
import { detectCvDatePrecision, isValidCvPartialDate, isValidVnDate } from "../cv-data";
import { parseVndInput } from "@/lib/format-vnd";

export function validateManualCv(data: CvFormData): string | null {
  const contact = data.thongTinLienHe;
  if (!contact.hoTen.trim() || !contact.email.trim() || !contact.sdt.trim()) {
    return "Vui lòng nhập họ tên, email và số điện thoại.";
  }
  if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) {
    return "Email không hợp lệ.";
  }
  if (!/^\+?[0-9\s.-]{8,20}$/.test(contact.sdt.trim())) {
    return "Số điện thoại không hợp lệ.";
  }
  if (!isValidVnDate(contact.ngaySinh)) {
    return "Ngày sinh phải đúng định dạng dd/mm/yyyy.";
  }
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
    if (skill.soNamKinhNghiem.trim()) {
      const years = Number(skill.soNamKinhNghiem);
      if (!Number.isFinite(years) || years < 0 || years > 100) {
        return `Số năm kinh nghiệm của kỹ năng "${skill.tenKyNang}" phải từ 0 đến 100.`;
      }
    }
  }
  return null;
}
