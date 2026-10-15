"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

export type JobSkill = { kyNangId: number; tenKyNang?: string; mucDoYeuCau: number };
export const SKILL_LEVELS = ["Không bắt buộc", "Ưu tiên", "Bắt buộc"];

export function deadlineDate(value: string): string {
  if (!value) return "";
  return new Date(new Date(value).getTime() - 1).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export type JobPreviewData = {
  tieuDe: string; moTaCongViec: string; yeuCauCongViec: string; kinhNghiemYeuCau: string;
  quyenLoi: string; diaDiemLamViec: string; luongToiThieu: number; luongToiDa: number;
  kyNangs?: JobSkill[]; ghiChuKiemDuyet?: string;
  ketQuaSangLoc?: string; nguoiDaiDienDaDuyet?: boolean; vaiTroNguoiDang?: string;
};

export function JobPreview({ data, onClose, actions }: { data: JobPreviewData | null; onClose: () => void; actions?: ReactNode }) {
  return <Dialog.Root open={data !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <Dialog.Close aria-label="Đóng xem trước" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-md hover:bg-muted"><X className="size-5" /></Dialog.Close>
        <Dialog.Title className="pr-12 text-xl font-semibold">{data?.tieuDe || "Tin chưa có tiêu đề"}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-muted-foreground">{actions ? data?.vaiTroNguoiDang === "NHAN_SU" && !data.nguoiDaiDienDaDuyet ? "Người đại diện kiểm tra và đồng ý trước. Sau đó hệ thống mới lọc: OK thì công khai, vi phạm thì chuyển Admin." : "Bộ lọc đã gắn cờ tin này. Admin quyết định duyệt tay để công khai hoặc từ chối." : "Xem trước nội dung tin. Thao tác này không lưu hoặc công khai tin."}</Dialog.Description>
        {data && <div className="mt-6 space-y-5">
          <p>{data.diaDiemLamViec || "Chưa nhập địa điểm"} · {data.luongToiThieu || data.luongToiDa ? `${data.luongToiThieu.toLocaleString("vi-VN")} – ${data.luongToiDa.toLocaleString("vi-VN")} đ` : "Lương thỏa thuận"}</p>
          {(data.ketQuaSangLoc || data.vaiTroNguoiDang === "NHAN_SU") && <section className="rounded-lg border border-border bg-muted p-4"><h3 className="font-semibold">Bộ lọc tự động của hệ thống</h3><p className="mt-2 whitespace-pre-wrap text-sm">{data.ketQuaSangLoc || "Chưa chạy bộ lọc. Hệ thống chỉ sàng lọc sau khi Người đại diện đồng ý."}</p><p className="mt-3 text-sm font-medium">{data.vaiTroNguoiDang === "NHAN_SU" && !data.nguoiDaiDienDaDuyet ? "Đang chờ Người đại diện kiểm tra nội dung" : "Bộ lọc OK → Công khai · Vi phạm/nghi vấn → Admin duyệt tay"}</p></section>}
          {data.ghiChuKiemDuyet && <div className="rounded-lg border border-border bg-muted p-4"><h3 className="font-semibold">Kết quả / ghi chú xử lý</h3><p className="mt-2 whitespace-pre-wrap text-sm">{data.ghiChuKiemDuyet}</p></div>}
          {([["Mô tả công việc", data.moTaCongViec], ["Yêu cầu công việc", data.yeuCauCongViec], ["Kinh nghiệm", data.kinhNghiemYeuCau], ["Quyền lợi", data.quyenLoi]]).map(([title, text]) => <section key={title}><h3 className="font-semibold">{title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{text || "Chưa nhập"}</p></section>)}
          <section><h3 className="font-semibold">Kỹ năng yêu cầu</h3><div className="mt-2 flex flex-wrap gap-2">{data.kyNangs?.map(skill => <Badge key={skill.kyNangId} variant="secondary">{skill.tenKyNang || `Kỹ năng #${skill.kyNangId}`} · {SKILL_LEVELS[skill.mucDoYeuCau]}</Badge>)}</div></section>
        </div>}
        {actions && <div className="sticky bottom-0 mt-6 flex flex-wrap justify-end gap-3 border-t border-border bg-card py-4">{actions}</div>}
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
