import { newId, type CvFormData } from "../tao-cv/types";

/** AI draft — structured, maps 1-1 onto CvFormData (no second source of truth). */
export type AiDraftCv = {
  fullName: string;
  summary: string;
  experience: string;
  skills: string[];
};

export const emptyAiDraft: AiDraftCv = {
  fullName: "",
  summary: "",
  experience: "",
  skills: [],
};

export function draftHasContent(d: AiDraftCv): boolean {
  return (
    d.fullName.trim() !== "" ||
    d.summary.trim() !== "" ||
    d.experience.trim() !== "" ||
    d.skills.length > 0
  );
}

/** Sections present in the draft, for the review card. */
export function draftSections(d: AiDraftCv): string[] {
  const out: string[] = [];
  if (d.fullName.trim() !== "") out.push("Thông tin cá nhân");
  if (d.summary.trim() !== "") out.push("Tóm tắt nghề nghiệp");
  if (d.experience.trim() !== "") out.push("Kinh nghiệm");
  if (d.skills.length > 0) out.push("Kỹ năng");
  return out;
}

/**
 * AI-to-CvFormData mapper. Non-empty draft fields overwrite the matching
 * live sections; empty ones keep existing live content. Template pickers,
 * file names and saved-CV selection are never touched here.
 */
export function aiDraftToCvFormData(draft: AiDraftCv, fallback: CvFormData): CvFormData {
  const fullName = draft.fullName.trim();
  const summary = draft.summary.trim();
  const experience = draft.experience.trim();
  return {
    ...fallback,
    thongTinLienHe: {
      ...fallback.thongTinLienHe,
      hoTen: fullName !== "" ? fullName : fallback.thongTinLienHe.hoTen,
      gioiThieuBanThan: summary !== "" ? summary : fallback.thongTinLienHe.gioiThieuBanThan,
    },
    kinhNghiemLamViec:
      experience !== ""
        ? [
            {
              id: newId(),
              congTy: "",
              chucDanh: "",
              tuNgay: "",
              denNgay: "",
              isHienTai: false,
              moTa: experience,
              kyNangSuDung: [],
            },
          ]
        : fallback.kinhNghiemLamViec,
    kyNang:
      draft.skills.length > 0
        ? draft.skills.map((s) => ({
            id: newId(),
            tenKyNang: s,
            mucDoThanhThao: "",
            soNamKinhNghiem: "",
          }))
        : fallback.kyNang,
  };
}
