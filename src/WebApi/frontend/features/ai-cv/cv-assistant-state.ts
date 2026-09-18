import type { CvFormData } from "@/lib/types";

/**
 * Khế ước state giữa Adam (CopilotKit agent) và form CV.
 * Form CvFormData trong TaoCvView là source of truth duy nhất —
 * file này chỉ định nghĩa shape patch + snapshot, không giữ bản copy nào.
 */

/** Các mục list trong CvFormData mà agent được phép thêm/sửa/xóa. */
export const CV_SECTION_KEYS = [
  "hocVan",
  "kinhNghiemLamViec",
  "duAn",
  "kyNang",
  "chungChi",
] as const;

export type CvSectionKey = (typeof CV_SECTION_KEYS)[number];

/** Field liên hệ agent được phép ghi (khớp key của LienHe). */
export const CV_CONTACT_FIELDS = [
  "hoTen",
  "email",
  "sdt",
  "diaChi",
  "github",
  "linkedIn",
  "portfolio",
  "gioiTinh",
  "ngaySinh",
  "viTriUngTuyen",
  "mucLuongMongMuon",
  "gioiThieuBanThan",
  "anhDaiDienUrl",
] as const;

export type CvContactField = (typeof CV_CONTACT_FIELDS)[number];

export const isCvSectionKey = (v: unknown): v is CvSectionKey =>
  typeof v === "string" && (CV_SECTION_KEYS as readonly string[]).includes(v);

export const isCvContactField = (v: unknown): v is CvContactField =>
  typeof v === "string" && (CV_CONTACT_FIELDS as readonly string[]).includes(v);

export const SECTION_LABEL: Record<CvSectionKey, string> = {
  hocVan: "học vấn",
  kinhNghiemLamViec: "kinh nghiệm",
  duAn: "dự án",
  kyNang: "kỹ năng",
  chungChi: "chứng chỉ",
};

/** Field bắt buộc còn trống (khớp validateManualCv). */
export function missingRequiredFields(data: CvFormData): string[] {
  const missing: string[] = [];
  const lh = data.thongTinLienHe;
  if (!lh.hoTen.trim()) missing.push("hoTen");
  if (!lh.email.trim()) missing.push("email");
  if (!lh.sdt.trim()) missing.push("sdt");
  if (data.hocVan.length + data.kinhNghiemLamViec.length === 0) {
    missing.push("hocVan|kinhNghiemLamViec");
  }
  return missing;
}

export type AssistantItemRef = { id: string; label: string };

export type AssistantSnapshot = {
  contact: Record<string, string>;
  counts: Record<CvSectionKey, number>;
  /** id + tên gợi nhớ để agent truyền id khi muốn SỬA item đã có. */
  items: Record<CvSectionKey, AssistantItemRef[]>;
  templateId: string;
  tenFile: string;
  missing: string[];
};

/** Snapshot JSON-safe cho useAgentContext: agent đọc, không bao giờ ghi ngược. */
export function buildAssistantSnapshot(data: CvFormData): AssistantSnapshot {
  const lh = data.thongTinLienHe;
  const contact: Record<string, string> = {};
  for (const f of CV_CONTACT_FIELDS) {
    contact[f] = (lh[f] ?? "").trim();
  }
  const counts = {
    hocVan: data.hocVan.length,
    kinhNghiemLamViec: data.kinhNghiemLamViec.length,
    duAn: data.duAn.length,
    kyNang: data.kyNang.length,
    chungChi: data.chungChi.length,
  } satisfies Record<CvSectionKey, number>;
  const items = {
    hocVan: data.hocVan.map((it) => ({ id: it.id, label: [it.truong, it.chuyenNganh].filter(Boolean).join(" — ") })),
    kinhNghiemLamViec: data.kinhNghiemLamViec.map((it) => ({ id: it.id, label: [it.chucDanh, it.congTy].filter(Boolean).join(" @ ") })),
    duAn: data.duAn.map((it) => ({ id: it.id, label: it.tenDuAn })),
    kyNang: data.kyNang.map((it) => ({ id: it.id, label: it.tenKyNang })),
    chungChi: data.chungChi.map((it) => ({ id: it.id, label: it.tenChungChi })),
  } satisfies Record<CvSectionKey, AssistantItemRef[]>;
  return {
    contact,
    counts,
    items,
    templateId: data.templateId,
    tenFile: data.tenFile,
    missing: missingRequiredFields(data),
  };
}

/** Deep clone JSON-safe (loại undefined) để đưa vào agent context. */
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

// ---- Pending patch: chat ở trang khác -> nhảy về /tao-cv rồi đổ vào form ----

export type PendingSectionPatch = {
  section: CvSectionKey;
  items: Array<Record<string, string>>;
};

export type PendingCvPatch = {
  contact?: Record<string, string>;
  sections?: PendingSectionPatch[];
  templateId?: string;
  /** Tên file CV (tenFile, top-level, khác hoTen trong contact). */
  tenFile?: string;
  savedAt: number;
};

const PENDING_KEY = "hireai.cv-pending-patch";

/** Event nội bộ cùng-tab: báo cho form /tao-cv đang mở đổ patch ngay, khỏi chờ reload. */
export const CV_PENDING_PATCH_EVENT = "hireai:cv-pending-patch";

export function savePendingCvPatch(patch: Omit<PendingCvPatch, "savedAt">): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...patch, savedAt: Date.now() }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CV_PENDING_PATCH_EVENT));
    }
  } catch {
    // Bộ nhớ đầy hoặc SSR: bỏ qua, chat vẫn hoạt động.
  }
}

export function loadPendingCvPatch(): PendingCvPatch | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCvPatch>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      contact: parsed.contact && typeof parsed.contact === "object" ? (parsed.contact as Record<string, string>) : undefined,
      sections: Array.isArray(parsed.sections) ? (parsed.sections as PendingSectionPatch[]) : undefined,
      templateId: typeof parsed.templateId === "string" ? parsed.templateId : undefined,
      tenFile: typeof parsed.tenFile === "string" ? parsed.tenFile : undefined,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function clearPendingCvPatch(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Bỏ qua.
  }
}
