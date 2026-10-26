import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { cvApi } from '@/features/cv/api/cv-api';
import { camelize } from '@/features/cv/manual/cv-import';
import { sampleCvFormData } from '@/features/cv/sample-cv-data';
import type { ParseCvTextInput } from '@/features/cv/types';
import { apiRequest } from '@/services/api/client';
import { asBoolean, asNumber, asRecord, asText, unwrapList } from '@/services/api/parse';

export type ParsedCvCanhBao = { field: string; message: string };

export type ParsedCv = {
  tenFile: string;
  loaiFile: string;
  kichThuocFile: number;
  noiDung: {
    thongTinLienHe: {
      hoTen: string;
      email: string;
      sdt: string;
      diaChi: string;
      viTriUngTuyen: string;
      gioiThieuBanThan: string;
    };
    hocVan: {
      truong: string;
      chuyenNganh: string;
      bangCap: string;
      tuNgay: string;
      denNgay: string;
      isHienTai: boolean;
      moTa: string;
    }[];
    kinhNghiemLamViec: {
      congTy: string;
      chucDanh: string;
      tuNgay: string;
      denNgay: string;
      isHienTai: boolean;
      moTa: string;
      kyNangSuDung: string[];
    }[];
    duAn: {
      tenDuAn: string;
      vaiTro: string;
      congNghe: string[];
      link: string;
      moTa: string;
      tuNgay: string;
      denNgay: string;
      isHienTai: boolean;
    }[];
    kyNang: { tenKyNang: string; mucDoThanhThao: string; soNamKinhNghiem: string }[];
    chungChi: { tenChungChi: string; donViCap: string; ngayCap: string }[];
  };
  canhBao: ParsedCvCanhBao[];
  canXacNhanThuCong: boolean;
};

export type SuggestedTheme = {
  slug: string;
  ten: string;
  moTaNgan: string;
  diem: number;
  lyDo: string;
  canhBao: string[];
  nganh: string;
  viTri: string;
  capBac: string;
  thanThienATS: boolean;
};

export type SuggestThemesPayload = {
  CvUngVienId?: number | null;
  UseSavedCv: boolean;
  ViTri: string;
  Nganh: string;
  CapBac: string;
  PhongCach: string;
  SoCot: number;
  UuTienATS: boolean;
  BatBuocATS: boolean;
  NhanManh: string[];
  KyNang: string[];
  TopN: number;
};

function recordList(value: unknown): Record<string, unknown>[] {
  return (Array.isArray(value) ? value : [])
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null);
}

function skillToStrings(value: unknown): string[] {
  return (Array.isArray(value) ? value : [])
    .map((item) => {
      if (typeof item === 'string') return item;
      const record = asRecord(item);
      return record ? asText(record.tenKyNang ?? record.name ?? record.ten) : '';
    })
    .flatMap((name) => name.split(','))
    .map((name) => name.trim())
    .filter(Boolean);
}

function normalizeParsedCv(raw: unknown): ParsedCv {
  const wrapped = camelize(raw);
  const root: Record<string, unknown> = asRecord(wrapped) ?? {};
  const outer: Record<string, unknown> = asRecord(root.noiDung) ?? {};
  const nested = asRecord(outer.noiDung);
  const noiDung: Record<string, unknown> = nested ?? outer;
  const lh: Record<string, unknown> = asRecord(noiDung.thongTinLienHe) ?? {};

  return {
    tenFile: asText(root.tenFile),
    loaiFile: asText(root.loaiFile),
    kichThuocFile: asNumber(root.kichThuocFile),
    noiDung: {
      thongTinLienHe: {
        hoTen: asText(lh.hoTen),
        email: asText(lh.email),
        sdt: asText(lh.sdt),
        diaChi: asText(lh.diaChi),
        viTriUngTuyen: asText(lh.viTriUngTuyen),
        gioiThieuBanThan: asText(lh.gioiThieuBanThan),
      },
      hocVan: recordList(noiDung.hocVan).map((h) => ({
        truong: asText(h.truong),
        chuyenNganh: asText(h.chuyenNganh),
        bangCap: asText(h.bangCap),
        tuNgay: asText(h.tuNgay),
        denNgay: asText(h.denNgay),
        isHienTai: asBoolean(h.isHienTai),
        moTa: asText(h.moTa),
      })),
      kinhNghiemLamViec: recordList(noiDung.kinhNghiemLamViec).map((k) => ({
        congTy: asText(k.congTy ?? k.tenCongTy),
        chucDanh: asText(k.chucDanh),
        tuNgay: asText(k.tuNgay),
        denNgay: asText(k.denNgay),
        isHienTai: asBoolean(k.isHienTai),
        moTa: asText(k.moTa),
        kyNangSuDung: skillToStrings(k.kyNangSuDung),
      })),
      duAn: recordList(noiDung.duAn).map((d) => ({
        tenDuAn: asText(d.tenDuAn),
        vaiTro: asText(d.vaiTro),
        congNghe: skillToStrings(d.congNghe),
        link: asText(d.link),
        moTa: asText(d.moTa),
        tuNgay: asText(d.tuNgay),
        denNgay: asText(d.denNgay),
        isHienTai: asBoolean(d.isHienTai),
      })),
      kyNang: recordList(noiDung.kyNang).map((k) => ({
        tenKyNang: asText(k.tenKyNang),
        mucDoThanhThao: asText(k.mucDoThanhThao),
        soNamKinhNghiem: asText(k.soNamKinhNghiem),
      })),
      chungChi: recordList(noiDung.chungChi).map((c) => ({
        tenChungChi: asText(c.tenChungChi),
        donViCap: asText(c.donViCap),
        ngayCap: asText(c.ngayCap),
      })),
    },
    canhBao: recordList(root.canhBao).map((w) => ({
      field: asText(w.field),
      message: asText(w.message),
    })),
    canXacNhanThuCong: asBoolean(root.canXacNhanThuCong, true),
  };
}

function mockParsedCv(input: ParseCvTextInput): ParsedCv {
  const sample = sampleCvFormData;
  return {
    tenFile: input.fileName,
    loaiFile: input.fileType,
    kichThuocFile: input.fileSize,
    noiDung: {
      thongTinLienHe: {
        hoTen: sample.thongTinLienHe.hoTen,
        email: sample.thongTinLienHe.email,
        sdt: sample.thongTinLienHe.sdt,
        diaChi: sample.thongTinLienHe.diaChi,
        viTriUngTuyen: sample.thongTinLienHe.viTriUngTuyen,
        gioiThieuBanThan: sample.thongTinLienHe.gioiThieuBanThan,
      },
      hocVan: sample.hocVan.map((h) => ({
        truong: h.truong,
        chuyenNganh: h.chuyenNganh,
        bangCap: h.bangCap ?? '',
        tuNgay: h.tuNgay,
        denNgay: h.denNgay,
        isHienTai: h.isHienTai === true,
        moTa: h.moTa,
      })),
      kinhNghiemLamViec: sample.kinhNghiemLamViec.map((k) => ({
        congTy: k.congTy,
        chucDanh: k.chucDanh,
        tuNgay: k.tuNgay,
        denNgay: k.denNgay,
        isHienTai: k.isHienTai,
        moTa: k.moTa,
        kyNangSuDung: k.kyNangSuDung,
      })),
      duAn: sample.duAn.map((d) => ({
        tenDuAn: d.tenDuAn,
        vaiTro: d.vaiTro,
        congNghe: d.congNghe,
        link: d.link,
        moTa: d.moTa,
        tuNgay: d.tuNgay,
        denNgay: d.denNgay,
        isHienTai: d.isHienTai === true,
      })),
      kyNang: sample.kyNang.map((k) => ({
        tenKyNang: k.tenKyNang,
        mucDoThanhThao: k.mucDoThanhThao,
        soNamKinhNghiem: k.soNamKinhNghiem,
      })),
      chungChi: sample.chungChi.map((c) => ({
        tenChungChi: c.tenChungChi,
        donViCap: c.donViCap,
        ngayCap: c.ngayCap,
      })),
    },
    canhBao: [
      {
        field: 'demo',
        message: 'Bản demo trả dữ liệu mẫu — AI thật chỉ chạy khi tắt mock data.',
      },
    ],
    canXacNhanThuCong: true,
  };
}

export async function parseCvText(input: ParseCvTextInput): Promise<ParsedCv> {
  if (USE_MOCK_JOBS) {
    await new Promise((resolve) => setTimeout(resolve, 1600));
    return mockParsedCv(input);
  }
  const raw = await cvApi.parseCv(input);
  return normalizeParsedCv(raw);
}

export function buildSuggestThemesPayload(input: {
  viTri: string;
  nganh: string;
  capBac: string;
  kyNang: string[];
}): SuggestThemesPayload {
  return {
    UseSavedCv: false,
    ViTri: input.viTri.trim(),
    Nganh: input.nganh.trim(),
    CapBac: input.capBac.trim(),
    PhongCach: '',
    SoCot: 1,
    UuTienATS: true,
    BatBuocATS: false,
    NhanManh: [],
    KyNang: input.kyNang,
    TopN: 3,
  };
}

function normalizeSuggestedTheme(value: unknown): SuggestedTheme | null {
  const raw = asRecord(camelize(value));
  if (!raw) return null;
  const slug = asText(raw.slug);
  if (!slug) return null;
  const canhBao = (Array.isArray(raw.canhBao) ? raw.canhBao : []).filter(
    (item): item is string => typeof item === 'string',
  );
  return {
    slug,
    ten: asText(raw.ten, slug),
    moTaNgan: asText(raw.moTaNgan),
    diem: asNumber(raw.diem),
    lyDo: asText(raw.lyDo),
    canhBao,
    nganh: asText(raw.nganh),
    viTri: asText(raw.viTri),
    capBac: asText(raw.capBac),
    thanThienATS: asBoolean(raw.thanThienATS),
  };
}

function mockSuggestedThemes(payload: SuggestThemesPayload): SuggestedTheme[] {
  const viTri = payload.ViTri || 'ứng viên';
  const nganh = payload.Nganh ? ` ngành ${payload.Nganh}` : '';
  return [
    {
      slug: 'minimal-ats',
      ten: 'Minimal ATS',
      moTaNgan: 'Một cột, tương thích hệ thống lọc hồ sơ',
      diem: 0.92,
      lyDo: `Bố cục 1 cột dễ quét nhất cho vị trí ${viTri}${nganh}.`,
      canhBao: [],
      nganh: payload.Nganh,
      viTri: payload.ViTri,
      capBac: payload.CapBac,
      thanThienATS: true,
    },
    {
      slug: 'tech-modern',
      ten: 'Tech Modern',
      moTaNgan: 'Hai cột, dành cho IT / Developer',
      diem: 0.85,
      lyDo: `Nổi bật kỹ năng và dự án, phù hợp hồ sơ kỹ thuật cho ${viTri}.`,
      canhBao: ['Mẫu 2 cột có thể khó quét bởi một số hệ ATS.'],
      nganh: payload.Nganh,
      viTri: payload.ViTri,
      capBac: payload.CapBac,
      thanThienATS: false,
    },
    {
      slug: 'clean-corporate',
      ten: 'Clean Corporate',
      moTaNgan: 'Phong cách công sở chuẩn mực cho BA / PM / QA / HR',
      diem: 0.74,
      lyDo: `Tông công sở lịch sự, phù hợp vai trò phi kỹ thuật như ${viTri}.`,
      canhBao: [],
      nganh: payload.Nganh,
      viTri: payload.ViTri,
      capBac: payload.CapBac,
      thanThienATS: true,
    },
  ];
}

export async function suggestThemes(
  payload: SuggestThemesPayload,
): Promise<SuggestedTheme[]> {
  if (USE_MOCK_JOBS) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mockSuggestedThemes(payload);
  }
  const raw = await apiRequest<unknown>('cvthemes/suggest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return unwrapList(raw)
    .map((row) => normalizeSuggestedTheme(row))
    .filter((item): item is SuggestedTheme => item !== null)
    .slice(0, Math.max(1, payload.TopN || 3));
}

export function themeScorePercent(item: SuggestedTheme): number {
  const value = item.diem <= 1 ? item.diem * 100 : item.diem;
  return Math.max(0, Math.min(100, Math.round(value)));
}
