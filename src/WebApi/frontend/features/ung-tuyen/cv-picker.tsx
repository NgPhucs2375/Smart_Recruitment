"use client";

import { useState } from "react";
import { Briefcase, Eye, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cvApi } from "@/lib/api/cv-api";
import type { CvDetailVm, CvVm } from "@/lib/types";

export type CvPickerProps = {
  cvs: CvVm[];
  loading: boolean;
  error: string;
  selectedCvId: number | null;
  onSelect: (cvId: number) => void;
  onRetry?: () => void;
  onCreateCv?: () => void;
};

/** Danh sách CV + chọn + preview, dùng chung cho trang tin và modal xác nhận. */
export function CvPicker({
  cvs,
  loading,
  error,
  selectedCvId,
  onSelect,
  onRetry,
  onCreateCv,
}: CvPickerProps) {
  const [previewCvId, setPreviewCvId] = useState<number | null>(null);
  const [previewDetail, setPreviewDetail] = useState<CvDetailVm | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const togglePreview = async (cv: CvVm) => {
    if (previewCvId === cv.id) {
      setPreviewCvId(null);
      return;
    }
    setPreviewCvId(cv.id);
    setPreviewDetail(null);
    try {
      setLoadingPreview(true);
      setPreviewDetail(await cvApi.getById(cv.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được preview CV.");
      setPreviewCvId(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải danh sách CV...
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-5 text-center">
        <p className="text-sm font-medium text-foreground">Không tải được danh sách CV</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={onRetry}>
            <RefreshCw className="mr-1.5 size-3.5" /> Thử lại
          </Button>
        )}
      </div>
    );
  }

  if (cvs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
        <Briefcase className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Bạn chưa có CV nào</p>
        <p className="mt-1 text-xs text-muted-foreground">Tạo CV trước rồi quay lại nộp đơn.</p>
        {onCreateCv && (
          <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={onCreateCv}>
            Tạo CV ngay
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cvs.map((cv) => (
        <div
          key={cv.id}
          className={`rounded-2xl border transition ${
            selectedCvId === cv.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex w-full items-center gap-3 p-3">
            <button
              type="button"
              onClick={() => onSelect(cv.id)}
              aria-pressed={selectedCvId === cv.id}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <FileText className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {cv.tenFile || `CV #${cv.id}`}
                </span>
                {cv.viTriUngTuyen && (
                  <span className="block truncate text-xs text-muted-foreground">{cv.viTriUngTuyen}</span>
                )}
              </span>
              {cv.isDefault && (
                <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold text-white">
                  Mặc định
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => void togglePreview(cv)}
              aria-expanded={previewCvId === cv.id}
              aria-label={previewCvId === cv.id ? "Ẩn preview" : "Xem trước CV"}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              {loadingPreview && previewCvId === cv.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {previewCvId === cv.id && (
            <div className="border-t border-border px-4 py-3">
              {loadingPreview && !previewDetail ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Đang tải preview...
                </p>
              ) : previewDetail ? (
                <div className="space-y-2 text-xs leading-5">
                  <p className="font-semibold text-foreground">
                    {previewDetail.noiDung.thongTinLienHe.hoTen || cv.hoTen || cv.tenFile}
                    {previewDetail.noiDung.thongTinLienHe.viTriUngTuyen && (
                      <span className="ml-2 font-normal text-muted-foreground">
                        • {previewDetail.noiDung.thongTinLienHe.viTriUngTuyen}
                      </span>
                    )}
                  </p>
                  {previewDetail.noiDung.thongTinLienHe.gioiThieuBanThan && (
                    <p className="text-muted-foreground line-clamp-2">
                      {previewDetail.noiDung.thongTinLienHe.gioiThieuBanThan}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span>Kinh nghiệm: {previewDetail.noiDung.kinhNghiemLamViec.length}</span>
                    <span>Kỹ năng: {previewDetail.noiDung.kyNang.length}</span>
                    <span>Dự án: {previewDetail.noiDung.duAn.length}</span>
                  </div>
                  {previewDetail.noiDung.kyNang.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {previewDetail.noiDung.kyNang.slice(0, 6).map((k) => (
                        <span
                          key={k.tenKyNang}
                          className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground"
                        >
                          {k.tenKyNang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Không tải được preview.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
