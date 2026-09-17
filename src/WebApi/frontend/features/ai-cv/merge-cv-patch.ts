import type { CvFormData } from "@/lib/types";
import { newId, normalizeCvPartialDate } from "@/features/tao-cv/cv-data";
import { TEMPLATE_REGISTRY } from "@/features/tao-cv/template-registry";
import {
  SECTION_LABEL,
  isCvContactField,
  isCvSectionKey,
  type CvSectionKey,
} from "./cv-assistant-state";

/**
 * Merge patch từ Adam vào CvFormData. Thuần túy (pure): không mutate input,
 * luôn trả object mới. Quy ước bulk-fill:
 * - Giá trị rỗng từ agent KHÔNG ghi đè giá trị user đã có.
 * - Giá trị khác rỗng ghi đè và được báo cáo (kèm undo ở tầng hook).
 * - Ngày parse lỗi không ghi, gom vào `uncertain` để agent hỏi lại.
 */

const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const clone = (data: CvFormData): CvFormData =>
  JSON.parse(JSON.stringify(data)) as CvFormData;

// ---- Liên hệ ----

export type ContactPatchResult = {
  next: CvFormData;
  applied: boolean;
  /** Câu báo cáo cho agent: đã đổi / bỏ qua vì sao. */
  report: string;
};

export function applyContactPatch(
  data: CvFormData,
  field: string,
  value: string,
): ContactPatchResult {
  if (!isCvContactField(field)) {
    return { next: data, applied: false, report: `Field liên hệ không hợp lệ: ${field}.` };
  }
  const v = value.trim();
  if (v === "") {
    return { next: data, applied: false, report: `Bỏ qua ${field} vì giá trị rỗng.` };
  }
  const next = clone(data);
  const prev = (next.thongTinLienHe[field] ?? "").trim();
  next.thongTinLienHe[field] = v;
  return {
    next,
    applied: true,
    report:
      prev === "" || prev === v
        ? `Đã điền ${field}.`
        : `Đã cập nhật ${field} từ "${prev}" thành "${v}".`,
  };
}

// ---- Mục list ----

type SectionConfig = {
  dateFields: string[];
  arrayFields: string[];
  boolFields: string[];
  /** Khóa định danh: đủ TẤT CẢ mới match item đã có, thiếu thì tạo mới. */
  nameKeys: string[];
  defaults: () => Record<string, unknown>;
};

const SECTION_CONFIG: Record<CvSectionKey, SectionConfig> = {
  hocVan: {
    dateFields: ["tuNgay", "denNgay"],
    arrayFields: [],
    boolFields: ["isHienTai"],
    nameKeys: ["truong", "chuyenNganh"],
    defaults: () => ({ truong: "", chuyenNganh: "", bangCap: "", tuNgay: "", denNgay: "", moTa: "" }),
  },
  kinhNghiemLamViec: {
    dateFields: ["tuNgay", "denNgay"],
    arrayFields: ["kyNangSuDung"],
    boolFields: ["isHienTai"],
    nameKeys: ["congTy", "chucDanh"],
    defaults: () => ({
      congTy: "", chucDanh: "", diaChi: "", tuNgay: "", denNgay: "",
      isHienTai: false, moTa: "", kyNangSuDung: [],
    }),
  },
  duAn: {
    dateFields: ["tuNgay", "denNgay"],
    arrayFields: ["congNghe"],
    boolFields: ["isHienTai"],
    nameKeys: ["tenDuAn"],
    defaults: () => ({
      tenDuAn: "", vaiTro: "", congNghe: [], link: "", moTa: "", tuNgay: "", denNgay: "",
    }),
  },
  kyNang: {
    dateFields: [],
    arrayFields: [],
    boolFields: [],
    nameKeys: ["tenKyNang"],
    defaults: () => ({ tenKyNang: "", mucDoThanhThao: "", soNamKinhNghiem: "" }),
  },
  chungChi: {
    dateFields: ["ngayCap", "ngayHetHan"],
    arrayFields: [],
    boolFields: [],
    nameKeys: ["tenChungChi", "donViCap"],
    defaults: () => ({
      tenChungChi: "", donViCap: "", ngayCap: "", ngayHetHan: "", maXacMinh: "", credentialUrl: "",
    }),
  },
};

const toStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(str).map((s) => s.trim()).filter(Boolean);
  return str(v)
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const toBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  const s = str(v).toLowerCase().replace(/\s+/g, "");
  return ["true", "1", "yes", "co", "hientai", "danglam", "current", "nay"].includes(s);
};

export type SectionPatchResult = {
  next: CvFormData;
  created: string[];
  updated: string[];
  skipped: string[];
  uncertain: string[];
};

export function applySectionItems(
  data: CvFormData,
  section: string,
  rawItems: unknown,
): SectionPatchResult {
  const empty: SectionPatchResult = { next: data, created: [], updated: [], skipped: [], uncertain: [] };
  if (!isCvSectionKey(section)) {
    return { ...empty, skipped: [`Mục không hợp lệ: ${str(section)}.`] };
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ...empty, skipped: ["Danh sách items rỗng."] };
  }
  const cfg = SECTION_CONFIG[section];
  const next = clone(data);
  const list = next[section] as Array<Record<string, unknown> & { id: string }>;
  const result: SectionPatchResult = { next, created: [], updated: [], skipped: [], uncertain: [] };
  const labelOf = (it: Record<string, unknown>) =>
    cfg.nameKeys.map((k) => str(it[k]).trim()).filter(Boolean).join(" — ") || "(chưa đặt tên)";

  for (const raw of rawItems.slice(0, 20)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      result.skipped.push("Item không phải object.");
      continue;
    }
    const patch = raw as Record<string, unknown>;
    const coerced: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (k === "id") continue;
      if (cfg.dateFields.includes(k)) {
        const rawDate = str(v).trim();
        if (rawDate === "") continue;
        const norm = normalizeCvPartialDate(rawDate);
        if (!norm) {
          result.uncertain.push(`Ngày không parse được: "${rawDate}".`);
          continue;
        }
        coerced[k] = norm;
      } else if (cfg.arrayFields.includes(k)) {
        const arr = toStringArray(v);
        if (arr.length > 0) coerced[k] = arr;
      } else if (cfg.boolFields.includes(k)) {
        coerced[k] = toBool(v);
      } else if (k in cfg.defaults()) {
        const s = str(v).trim();
        if (s !== "") coerced[k] = s;
      }
      // Field lạ: bỏ qua im lặng để agent cũ/mới không làm vỡ form.
    }
    if (Object.keys(coerced).length === 0) {
      result.skipped.push("Item rỗng.");
      continue;
    }

    // Match: id trước, rồi đủ bộ nameKeys. Thiếu thì TẠO MỚI, không đoán mò.
    const wantedId = str(patch.id).trim();
    let target = wantedId ? list.find((it) => it.id === wantedId) : undefined;
    if (!target && cfg.nameKeys.every((k) => str(coerced[k]).trim() !== "")) {
      const keyOf = (it: Record<string, unknown>) =>
        cfg.nameKeys.map((k) => str(it[k]).trim().toLowerCase()).join("|");
      const want = keyOf(coerced);
      target = list.find((it) => keyOf(it) === want);
    }
    if (target) {
      Object.assign(target, coerced);
      result.updated.push(labelOf(target));
    } else {
      const fresh = { ...cfg.defaults(), ...coerced, id: newId() } as Record<string, unknown> & { id: string };
      list.push(fresh);
      result.created.push(labelOf(fresh));
    }
  }
  return result;
}

export function sectionReport(section: CvSectionKey, r: SectionPatchResult): string {
  const parts: string[] = [];
  const label = SECTION_LABEL[section];
  if (r.created.length > 0) parts.push(`thêm ${label}: ${r.created.join("; ")}`);
  if (r.updated.length > 0) parts.push(`sửa ${label}: ${r.updated.join("; ")}`);
  if (r.skipped.length > 0) parts.push(`bỏ qua: ${r.skipped.join("; ")}`);
  if (r.uncertain.length > 0) parts.push(`chưa chắc: ${r.uncertain.join("; ")}`);
  return parts.length > 0 ? `Đã ${parts.join(". ")}.` : "Không có gì để ghi.";
}

// ---- Xóa item ----

export function removeSectionItem(
  data: CvFormData,
  section: string,
  id: string,
): { next: CvFormData; removed: boolean; report: string } {
  if (!isCvSectionKey(section)) {
    return { next: data, removed: false, report: `Mục không hợp lệ: ${str(section)}.` };
  }
  const next = clone(data);
  const list = next[section] as Array<Record<string, unknown> & { id: string }>;
  const idx = list.findIndex((it) => it.id === id);
  if (idx < 0) {
    return { next: data, removed: false, report: `Không tìm thấy item trong ${SECTION_LABEL[section]}.` };
  }
  const [gone] = list.splice(idx, 1);
  const label =
    SECTION_CONFIG[section].nameKeys.map((k) => str(gone[k])).filter(Boolean).join(" — ") ||
    SECTION_LABEL[section];
  return { next, removed: true, report: `Đã xóa ${SECTION_LABEL[section]}: ${label}.` };
}

// ---- Template ----

export function applyTemplatePatch(
  data: CvFormData,
  templateId: string,
): { next: CvFormData; applied: boolean; report: string } {
  const raw = templateId.trim();
  if (!TEMPLATE_REGISTRY[raw]) {
    return {
      next: data,
      applied: false,
      report: `Mẫu không hợp lệ: ${raw || "(rỗng)"}. Mẫu có sẵn: ${Object.keys(TEMPLATE_REGISTRY).join(", ")}.`,
    };
  }
  if (data.templateId === raw) {
    return { next: data, applied: false, report: `Đang dùng mẫu ${TEMPLATE_REGISTRY[raw].name} rồi.` };
  }
  const next = clone(data);
  next.templateId = raw;
  return { next, applied: true, report: `Đã chuyển sang mẫu ${TEMPLATE_REGISTRY[raw].name}.` };
}
