"use client";

import { useState } from "react";
import { Briefcase, MapPin, DollarSign, Calendar, ListChecks, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { CreateTinTuyenDungInput, DanhMucNghe, TinTuyenDungDetail } from "../types";

export type TinFormValue = CreateTinTuyenDungInput;

const EMPTY: TinFormValue = {
  danhMucNgheId: 0,
  tieuDe: "",
  moTaCongViec: "",
  kinhNghiemYeuCau: "",
  yeuCauCongViec: "",
  quyenLoi: "",
  diaDiemLamViec: "",
  luongToiThieu: 0,
  luongToiDa: 0,
  ngayHetHan: null,
};

export function tinToFormValue(detail: TinTuyenDungDetail): TinFormValue {
  return {
    danhMucNgheId: detail.danhMucNgheId,
    tieuDe: detail.tieuDe,
    moTaCongViec: (detail as { moTaCongViec?: string }).moTaCongViec ?? "",
    kinhNghiemYeuCau: (detail as { kinhNghiemYeuCau?: string }).kinhNghiemYeuCau ?? "",
    yeuCauCongViec: (detail as { yeuCauCongViec?: string }).yeuCauCongViec ?? "",
    quyenLoi: (detail as { quyenLoi?: string }).quyenLoi ?? "",
    diaDiemLamViec: detail.diaDiemLamViec ?? "",
    luongToiThieu: detail.luongToiThieu ?? 0,
    luongToiDa: detail.luongToiDa ?? 0,
    ngayHetHan: detail.ngayHetHan ? detail.ngayHetHan.substring(0, 10) : null,
  };
}

export function emptyTinForm(): TinFormValue {
  return { ...EMPTY };
}

interface TinFormProps {
  initial?: TinFormValue;
  danhMucs: DanhMucNghe[];
  danhMucBlocked?: boolean;
  saving: boolean;
  submitLabel: string;
  onSubmit: (value: TinFormValue) => void;
  onCancel?: () => void;
}

export function TinForm({
  initial,
  danhMucs,
  danhMucBlocked = false,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: TinFormProps) {
  const [form, setForm] = useState<TinFormValue>(initial ?? emptyTinForm());
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof TinFormValue>(key: K, value: TinFormValue[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tieuDe.trim()) return setError("Vui lòng nhập tiêu đề tin.");
    if (!form.danhMucNgheId || form.danhMucNgheId <= 0)
      return setError("Vui lòng chọn danh mục nghề.");
    if (form.luongToiThieu < 0 || form.luongToiDa < 0)
      return setError("Mức lương phải >= 0.");
    if (form.luongToiDa > 0 && form.luongToiThieu > form.luongToiDa)
      return setError("Lương tối thiểu không được lớn hơn lương tối đa.");
    setError(null);
    onSubmit({
      ...form,
      tieuDe: form.tieuDe.trim(),
      moTaCongViec: form.moTaCongViec.trim(),
      kinhNghiemYeuCau: form.kinhNghiemYeuCau.trim(),
      yeuCauCongViec: form.yeuCauCongViec.trim(),
      quyenLoi: form.quyenLoi.trim(),
      diaDiemLamViec: form.diaDiemLamViec.trim(),
      ngayHetHan: form.ngayHetHan ? new Date(form.ngayHetHan).toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {/* Tiêu đề + Danh mục */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">
            Tiêu đề tin <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={form.tieuDe}
              onChange={(e) => set("tieuDe", e.target.value)}
              placeholder="VD: Senior Backend .NET Developer"
              className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">
            Danh mục nghề <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <ListChecks className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            {danhMucBlocked || danhMucs.length === 0 ? (
              <Input
                type="number"
                min={1}
                value={form.danhMucNgheId || ""}
                onChange={(e) => set("danhMucNgheId", Number(e.target.value) || 0)}
                placeholder="Nhập mã danh mục nghề (VD: 1)"
                className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
              />
            ) : (
              <select
                value={form.danhMucNgheId || ""}
                onChange={(e) => set("danhMucNgheId", Number(e.target.value) || 0)}
                className="flex h-10 w-full rounded-xl border border-[#d8d5ce] bg-white pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#151515]"
              >
                <option value="">-- Chọn danh mục --</option>
                {danhMucs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.tenNghe}
                  </option>
                ))}
              </select>
            )}
          </div>
          {danhMucBlocked && (
            <p className="text-[11px] text-amber-600">
              Tài khoản chưa được cấp quyền xem danh mục — vui lòng nhập mã danh mục thủ công.
            </p>
          )}
        </div>
      </div>

      {/* Địa điểm + Hạn nộp */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Địa điểm làm việc</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={form.diaDiemLamViec}
              onChange={(e) => set("diaDiemLamViec", e.target.value)}
              placeholder="VD: Hà Nội / Remote"
              className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Hạn nộp hồ sơ</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="date"
              value={form.ngayHetHan ?? ""}
              onChange={(e) => set("ngayHetHan", e.target.value || null)}
              className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Lương */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Lương tối thiểu (VNĐ)</label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="number"
              min={0}
              step={500000}
              value={form.luongToiThieu}
              onChange={(e) => set("luongToiThieu", Number(e.target.value) || 0)}
              className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Lương tối đa (VNĐ)</label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="number"
              min={0}
              step={500000}
              value={form.luongToiDa}
              onChange={(e) => set("luongToiDa", Number(e.target.value) || 0)}
              className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Nội dung */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-700">Mô tả công việc</label>
        <Textarea
          rows={4}
          value={form.moTaCongViec}
          onChange={(e) => set("moTaCongViec", e.target.value)}
          placeholder="Mô tả chi tiết công việc, trách nhiệm..."
          className="rounded-xl border-[#d8d5ce] bg-white text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-700">Yêu cầu công việc</label>
        <Textarea
          rows={3}
          value={form.yeuCauCongViec}
          onChange={(e) => set("yeuCauCongViec", e.target.value)}
          placeholder="Kỹ năng, trình độ, yêu cầu bắt buộc..."
          className="rounded-xl border-[#d8d5ce] bg-white text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Kinh nghiệm yêu cầu</label>
          <Input
            value={form.kinhNghiemYeuCau}
            onChange={(e) => set("kinhNghiemYeuCau", e.target.value)}
            placeholder="VD: 2+ năm .NET"
            className="h-10 rounded-xl border-[#d8d5ce] bg-white text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Quyền lợi</label>
          <Input
            value={form.quyenLoi}
            onChange={(e) => set("quyenLoi", e.target.value)}
            placeholder="VD: Bảo hiểm, thưởng, remote..."
            className="h-10 rounded-xl border-[#d8d5ce] bg-white text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[#d8d5ce]/40 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-10 rounded-xl">
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={saving} className="h-10 rounded-xl bg-[#151515] text-white hover:bg-black">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {saving ? "Đang lưu..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
