import type { CvTemplate, CvFormData } from "./types";

export const cvTemplates: CvTemplate[] = [
  { id: "modern", name: "Signal", description: "Đen trắng, accent mint", color: "#111111" },
  { id: "professional", name: "Executive", description: "Trang trọng, rõ nét", color: "#263238" },
  { id: "creative", name: "Studio", description: "Sáng tạo, có điểm nhấn", color: "#376c5e" },
  { id: "minimal", name: "Essential", description: "Tối giản, tập trung nội dung", color: "#4d5b58" },
];

export const defaultCvData: CvFormData = {
  fullName: "",
  roleTitle: "",
  email: "",
  phone: "",
  address: "",
  linkedin: "",
  summary: "",
  experiences: [],
  education: [],
  skills: [],
  templateId: "modern",
};
