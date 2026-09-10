import type { CvTemplate, CvFormData } from "./types";

export const cvTemplates: CvTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Giao diện sạch, tối giản, phù hợp IT",
    color: "#2563eb",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Trang trọng, phù hợp doanh nghiệp lớn",
    color: "#1f2937",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Sáng tạo, phù hợp Designer/Marketing",
    color: "#7c3aed",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Tối thiểu, tập trung vào nội dung",
    color: "#374151",
  },
];

export const defaultCvData: CvFormData = {
  thongTinLienHe: {
    hoTen: "",
    email: "",
    sdt: "",
    diaChi: "",
    github: "",
    linkedIn: "",
    portfolio: "",
    gioiTinh: "",
    ngaySinh: "",
    viTriUngTuyen: "",
    mucLuongMongMuon: "",
    gioiThieuBanThan: "",
  },
  hocVan: [],
  kinhNghiemLamViec: [],
  duAn: [],
  kyNang: [],
  chungChi: [],
  templateId: "modern",
  tenFile: "",
};