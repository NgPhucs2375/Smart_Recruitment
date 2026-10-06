import type { CvFormData } from "@/lib/types";
import {
  buildAssistantSnapshot,
  missingRequiredFields,
  type CvSectionKey,
} from "./cv-assistant-state";

export type CurrentCvReview = {
  source: "current_cv_editor";
  saved: false;
  cvId: null;
  templateId: string;
  tenFile: string;
  missing: string[];
  counts: Record<CvSectionKey, number>;
  emptySections: CvSectionKey[];
  supportedSections: CvSectionKey[];
  unsupportedSections: string[];
  suggestions: string[];
  answer: string;
};

const FIELD_LABELS: Record<string, string> = {
  hoTen: "họ tên",
  email: "email",
  sdt: "số điện thoại",
  "hocVan|kinhNghiemLamViec": "học vấn hoặc kinh nghiệm làm việc",
};

const SECTION_LABELS: Record<CvSectionKey, string> = {
  hocVan: "học vấn",
  kinhNghiemLamViec: "kinh nghiệm làm việc",
  duAn: "dự án",
  kyNang: "kỹ năng",
  chungChi: "chứng chỉ",
};

const SUPPORTED_SECTIONS = Object.keys(SECTION_LABELS) as CvSectionKey[];
const UNSUPPORTED_SECTIONS = ["ngoại ngữ", "hoạt động", "sở thích"];

export function reviewCurrentCv(data: CvFormData): CurrentCvReview {
  const snapshot = buildAssistantSnapshot(data);
  const missing = missingRequiredFields(data);
  const emptySections = SUPPORTED_SECTIONS.filter((section) => snapshot.counts[section] === 0);
  const suggestions: string[] = [];

  for (const field of missing) {
    suggestions.push(`Bổ sung ${FIELD_LABELS[field] ?? field}.`);
  }

  if (snapshot.counts.kyNang === 0) {
    suggestions.push("Bổ sung kỹ năng nếu bạn muốn CV thể hiện rõ năng lực Frontend.");
  }

  if (snapshot.counts.duAn === 0) {
    suggestions.push("Bổ sung dự án nếu bạn muốn làm nổi bật kinh nghiệm thực hành.");
  }

  if (!snapshot.contact.gioiThieuBanThan) {
    suggestions.push("Bổ sung giới thiệu bản thân nếu muốn có phần tóm tắt nghề nghiệp.");
  }

  const countSummary = SUPPORTED_SECTIONS
    .map((section) => `${SECTION_LABELS[section]}: ${snapshot.counts[section]}`)
    .join(", ");
  const requiredSummary = missing.length > 0
    ? missing.map((field) => FIELD_LABELS[field] ?? field).join(", ")
    : "không có";
  const emptySummary = emptySections.length > 0
    ? emptySections.map((section) => SECTION_LABELS[section]).join(", ")
    : "không có";
  const suggestionSummary = suggestions.length > 0
    ? suggestions.map((suggestion) => `- ${suggestion}`).join("\n")
    : "- Chưa phát hiện thiếu sót bắt buộc trong các section đang được hỗ trợ.";
  const answer = [
    "Đây là kết quả kiểm tra CV nháp đang mở, chưa lưu vào database.",
    `Số lượng hiện tại: ${countSummary}.`,
    `Thông tin bắt buộc còn thiếu: ${requiredSummary}.`,
    `Section đang trống: ${emptySummary}.`,
    "Không kết luận rằng nội dung đang có bị thiếu mô tả nếu dữ liệu hiện tại đã tồn tại.",
    "Ngoại ngữ, hoạt động và sở thích chưa phải section được hỗ trợ trong form CV hiện tại.",
    "Gợi ý ưu tiên:",
    suggestionSummary,
  ].join("\n");

  return {
    source: "current_cv_editor",
    saved: false,
    cvId: null,
    templateId: snapshot.templateId,
    tenFile: snapshot.tenFile,
    missing,
    counts: snapshot.counts,
    emptySections,
    supportedSections: SUPPORTED_SECTIONS,
    unsupportedSections: UNSUPPORTED_SECTIONS,
    suggestions,
    answer,
  };
}
