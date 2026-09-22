import type { CvDetailVm, CvFormData, DuAnItem, HocVanItem, KinhNghiemItem, KyNangItem, ChungChiItem } from "@/lib/types";
import { isoToVnDate, newId, normalizeCvPartialDate } from "../cv-data";
import { formatVndInput, parseVndInput } from "@/lib/format-vnd";
import type {
  CreateManualCvPayload,
  ManualCvContentPayload,
  UpdateManualCvPayload,
} from "./manual-cv-contract";

const SKILL_LEVELS: Record<string, number> = {
  CoBan: 0,
  TrungBinh: 1,
  ThanhThao: 2,
  ChuyenGia: 3,
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function withoutId<T extends { id: string }>(item: T): Omit<T, "id"> {
  const next = { ...item };
  delete (next as { id?: string }).id;
  return next;
}

const fullDateForForm = (value: string | null | undefined): string => {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  return isoToVnDate(value);
};

const withIds = <T extends { id: string }>(items: Omit<T, "id">[]): T[] =>
  items.map((item) => ({ ...item, id: newId() }) as T);

export function manualCvDetailToForm(detail: CvDetailVm, fallback: CvFormData): CvFormData {
  const content = detail.noiDung;
  return {
    ...clone(fallback),
    templateId: detail.templateId || fallback.templateId,
    tenFile: detail.tenFile || "",
    thongTinLienHe: {
      ...clone(fallback.thongTinLienHe),
      ...content.thongTinLienHe,
      ngaySinh: fullDateForForm(content.thongTinLienHe.ngaySinh),
      mucLuongMongMuon:
        content.thongTinLienHe.mucLuongMongMuon == null
          ? ""
          : formatVndInput(String(content.thongTinLienHe.mucLuongMongMuon)),
    },
    hocVan: withIds<HocVanItem>(content.hocVan.map((raw) => {
      const item = withoutId(raw);
      return {
        ...item,
        tuNgay: normalizeCvPartialDate(item.tuNgay),
        denNgay: normalizeCvPartialDate(item.denNgay),
      };
    })),
    kinhNghiemLamViec: withIds<KinhNghiemItem>(
      content.kinhNghiemLamViec.map((raw) => {
        const item = withoutId(raw);
        return {
          ...item,
          tuNgay: normalizeCvPartialDate(item.tuNgay),
          denNgay: normalizeCvPartialDate(item.denNgay),
        };
      }),
    ),
    duAn: withIds<DuAnItem>(content.duAn.map((raw) => {
      const item = withoutId(raw);
      return {
        ...item,
        tuNgay: normalizeCvPartialDate(item.tuNgay),
        denNgay: normalizeCvPartialDate(item.denNgay),
      };
    })),
    kyNang: withIds<KyNangItem>(content.kyNang.map((raw) => {
      const item = withoutId(raw);
      return {
        ...item,
        mucDoThanhThao: String(skillLevel(item.mucDoThanhThao) ?? 0),
      };
    })),
    chungChi: withIds<ChungChiItem>(content.chungChi.map((raw) => {
      const item = withoutId(raw);
      return {
        ...item,
        ngayCap: fullDateForForm(item.ngayCap),
        ngayHetHan: fullDateForForm(item.ngayHetHan),
      };
    })),
  };
}

function skillLevel(value: string): number | null {
  if (value in SKILL_LEVELS) return SKILL_LEVELS[value];
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 3 ? parsed : null;
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function contentPayload(data: CvFormData): ManualCvContentPayload {
  return {
    thongTinLienHe: {
      hoTen: data.thongTinLienHe.hoTen.trim(),
      email: data.thongTinLienHe.email.trim(),
      sdt: data.thongTinLienHe.sdt.replace(/[\s.-]/g, ""),
      diaChi: data.thongTinLienHe.diaChi.trim(),
      github: data.thongTinLienHe.github.trim(),
      linkedIn: data.thongTinLienHe.linkedIn.trim(),
      portfolio: data.thongTinLienHe.portfolio.trim(),
      gioiTinh: data.thongTinLienHe.gioiTinh.trim(),
      ngaySinh: data.thongTinLienHe.ngaySinh || null,
      viTriUngTuyen: data.thongTinLienHe.viTriUngTuyen.trim(),
      mucLuongMongMuon: data.thongTinLienHe.mucLuongMongMuon.trim()
        ? parseVndInput(data.thongTinLienHe.mucLuongMongMuon)
        : null,
      gioiThieuBanThan: data.thongTinLienHe.gioiThieuBanThan.trim(),
      anhDaiDienUrl: data.thongTinLienHe.anhDaiDienUrl?.trim() || null,
    },
    hocVan: data.hocVan.map((item, thuTu) => ({
      truong: item.truong.trim(),
      chuyenNganh: item.chuyenNganh.trim(),
      bangCap: item.bangCap?.trim() || "",
      tuNgay: item.tuNgay || null,
      denNgay: item.isHienTai ? null : item.denNgay || null,
      isHienTai: item.isHienTai === true,
      moTa: item.moTa.trim(),
      thuTu,
    })),
    kinhNghiemLamViec: data.kinhNghiemLamViec.map((item, thuTu) => ({
      tenCongTy: item.congTy.trim(),
      chucDanh: item.chucDanh.trim(),
      diaChi: item.diaChi?.trim() || "",
      tuNgay: item.tuNgay || null,
      denNgay: item.isHienTai ? null : item.denNgay || null,
      isHienTai: item.isHienTai,
      moTa: item.moTa.trim(),
      kyNangSuDung: item.kyNangSuDung.map((tenKyNang) => ({
        kyNangId: null,
        tenKyNang: tenKyNang.trim(),
      })).filter((item) => item.tenKyNang),
      thuTu,
    })),
    duAn: data.duAn.map((item, thuTu) => ({
      tenDuAn: item.tenDuAn.trim(),
      vaiTro: item.vaiTro.trim(),
      tuNgay: item.tuNgay || null,
      denNgay: item.isHienTai ? null : item.denNgay || null,
      isHienTai: item.isHienTai === true,
      link: item.link.trim(),
      moTa: item.moTa.trim(),
      congNghe: item.congNghe.map((tenKyNang) => ({
        kyNangId: null,
        tenKyNang: tenKyNang.trim(),
      })).filter((item) => item.tenKyNang),
      thuTu,
    })),
    kyNang: data.kyNang.map((item, thuTu) => ({
      kyNangId: null,
      tenKyNang: item.tenKyNang.trim(),
      mucDoThanhThao: skillLevel(item.mucDoThanhThao),
      soNamKinhNghiem: optionalNumber(item.soNamKinhNghiem),
      thuTu,
    })),
    chungChi: data.chungChi.map((item, thuTu) => ({
      tenChungChi: item.tenChungChi.trim(),
      donViCap: item.donViCap.trim(),
      ngayCap: item.ngayCap || null,
      ngayHetHan: item.ngayHetHan || null,
      maXacMinh: item.maXacMinh.trim(),
      credentialUrl: item.credentialUrl?.trim() || "",
      thuTu,
    })),
  };
}

export function createManualCvPayload(
  hoSoUngVienId: number,
  data: CvFormData,
  isDefault: boolean,
): CreateManualCvPayload {
  return {
    hoSoUngVienId,
    tenFile: data.tenFile.trim() || `CV-${new Date().toISOString().slice(0, 10)}`,
    fileUrl: null,
    templateId: data.templateId,
    isDefault,
    phuongThucTao: 1,
    noiDung: contentPayload(data),
  };
}

export function updateManualCvPayload(
  id: number,
  data: CvFormData,
  isDefault: boolean,
): UpdateManualCvPayload {
  const createPayload = createManualCvPayload(0, data, isDefault);
  return {
    id,
    tenFile: createPayload.tenFile,
    templateId: createPayload.templateId,
    isDefault,
    noiDung: createPayload.noiDung,
  };
}
