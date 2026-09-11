export type CvTemplate = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type LienHe = {
  hoTen: string;
  email: string;
  sdt: string;
  diaChi: string;
  github: string;
  linkedIn: string;
  portfolio: string;
  gioiTinh: string;
  ngaySinh: string;
  viTriUngTuyen: string;
  mucLuongMongMuon: string;
  gioiThieuBanThan: string;
};

export type HocVanItem = {
  id: string;
  truong: string;
  chuyenNganh: string;
  tuNgay: string;
  denNgay: string;
  moTa: string;
};

export type KinhNghiemItem = {
  id: string;
  congTy: string;
  chucDanh: string;
  tuNgay: string;
  denNgay: string;
  isHienTai: boolean;
  moTa: string;
  kyNangSuDung: string[];
};

export type KyNangItem = {
  id: string;
  tenKyNang: string;
  mucDoThanhThao: string;
  soNamKinhNghiem: string;
};

export type DuAnItem = {
  id: string;
  tenDuAn: string;
  vaiTro: string;
  congNghe: string[];
  link: string;
  moTa: string;
};

export type ChungChiItem = {
  id: string;
  tenChungChi: string;
  donViCap: string;
  ngayCap: string;
  maXacMinh: string;
};

/** Form CV thủ công — map 1-1 với NoiDungCVDto bên backend (camelCase). */
export type CvFormData = {
  thongTinLienHe: LienHe;
  hocVan: HocVanItem[];
  kinhNghiemLamViec: KinhNghiemItem[];
  duAn: DuAnItem[];
  kyNang: KyNangItem[];
  chungChi: ChungChiItem[];
  templateId: string;
  tenFile: string;
};

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const withIds = <T extends { id?: string }>(arr: unknown): (T & { id: string })[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return { ...o, id: typeof o.id === "string" && o.id ? o.id : newId() } as T & { id: string };
  });
};

/** Parse NoiDungJson (backend lưu ISO) về CvFormData hiển thị dd/mm/yyyy. */
export function cvDataFromJson(json: string | null | undefined, fallback: CvFormData): CvFormData {
  const clone: CvFormData = JSON.parse(JSON.stringify(fallback));
  if (!json) return clone;
  try {
    const p = JSON.parse(json) as Partial<CvFormData>;
    const vn = (v: unknown) => isoToVnDate(typeof v === "string" ? v : null);
    return {
      ...clone,
      ...p,
      thongTinLienHe: {
        ...clone.thongTinLienHe,
        ...(p.thongTinLienHe ?? {}),
        ngaySinh: vn((p.thongTinLienHe as { ngaySinh?: unknown } | undefined)?.ngaySinh),
      },
      hocVan: withIds<HocVanItem>(p.hocVan).map((h) => ({ ...h, tuNgay: vn(h.tuNgay), denNgay: vn(h.denNgay) })),
      kinhNghiemLamViec: withIds<KinhNghiemItem>(p.kinhNghiemLamViec).map((k) => ({ ...k, tuNgay: vn(k.tuNgay), denNgay: vn(k.denNgay) })),
      duAn: withIds<DuAnItem>(p.duAn),
      kyNang: withIds<KyNangItem>(p.kyNang),
      chungChi: withIds<ChungChiItem>(p.chungChi).map((c) => ({ ...c, ngayCap: vn(c.ngayCap) })),
      templateId: p.templateId || clone.templateId,
      tenFile: clone.tenFile,
    };
  } catch {
    return clone;
  }
}

/** Build body POST / PUT cvungviens từ form (ngày dd/mm/yyyy -> ISO). */
export function toCvPayload(hoSoUngVienId: number, data: CvFormData, isDefault: boolean) {
  const vnDateOrNull = (v: string) => {
    const iso = vnToIsoDate(v);
    return iso === "" ? null : iso;
  };
  return {
    hoSoUngVienId,
    tenFile: data.tenFile?.trim() || `CV-${new Date().toISOString().slice(0, 10)}`,
    templateId: data.templateId,
    isDefault,
    phuongThucTao: 1, // ThuCongTemplate
    noiDung: {
      thongTinLienHe: {
        ...data.thongTinLienHe,
        ngaySinh: vnDateOrNull(data.thongTinLienHe.ngaySinh),
      },
      hocVan: data.hocVan.map(({ id: _id, ...h }) => ({
        ...h,
        tuNgay: vnDateOrNull(h.tuNgay),
        denNgay: vnDateOrNull(h.denNgay),
      })),
      kinhNghiemLamViec: data.kinhNghiemLamViec.map(({ id: _id, ...k }) => ({
        ...k,
        tuNgay: vnDateOrNull(k.tuNgay),
        denNgay: k.isHienTai ? null : vnDateOrNull(k.denNgay),
      })),
      duAn: data.duAn.map(({ id: _id, ...d }) => d),
      kyNang: data.kyNang.map(({ id: _id, ...k }) => k),
      chungChi: data.chungChi.map(({ id: _id, ...c }) => ({
        ...c,
        ngayCap: vnDateOrNull(c.ngayCap),
      })),
    },
  };
}

/** ISO datetime backend -> yyyy-MM-dd cho input[type=date]. */
export const toDateInput = (v: string | null | undefined) =>
  typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : "";

/** Mask khi gõ ngày: chỉ giữ số, tự chèn "/" thành dd/mm/yyyy (tối đa 8 số). */
export const maskDateVn = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return [d, m, y].filter((p, i) => p !== "" || i === 0).join("/");
};

/** "31/12/2024" -> "2024-12-31", sai định dạng hoặc rỗng -> "". */
export const vnToIsoDate = (v: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((v || "").trim());
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return "";
  return `${yyyy}-${mm}-${dd}`;
};

/** ISO "2024-12-31..." -> "31/12/2024", rỗng -> "". */
export const isoToVnDate = (v: string | null | undefined) => {
  const iso = toDateInput(v);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/** true khi rỗng hoặc đúng dd/mm/yyyy hợp lệ. */
export const isValidVnDate = (v: string) => v.trim() === "" || vnToIsoDate(v) !== "";