"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardCheck, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { getValidToken } from "@/lib/auth-provider";
import { JobPreviewBody, type JobPreviewData } from "@/features/tin-tuyen-dung/job-preview";

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };
type TinChiTiet = JobPreviewData & { id: number; trangThai: string; lastModified: string | null };

const API = "/api/dotnet/tintuyendungs";
const TRIGGER = { NguoiDaiDienDuyet: 13, NguoiDaiDienTuChoi: 14 } as const;
// Chỉ tin đang ở bước chờ Người đại diện (enum "ChoNguoiDaiDienDuyet" = 9) mới được duyệt.
const CHO_NGUOI_DAI_DIEN = new Set(["ChoNguoiDaiDienDuyet", "9"]);

const msg = (r: ApiResponse<unknown>) => String(r.Message ?? r.message ?? "");
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

export default function DuyetTinChiTietPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tinId = Number(params?.id);

  const [detail, setDetail] = useState<TinChiTiet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { confirm, prompt } = useConfirmDialog();

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const token = await getValidToken();
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}`, ...init?.headers },
    });
    const body = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    if (!response.ok) throw new Error(msg(body ?? {}) || `HTTP ${response.status}`);
    if (body && (body.Succeeded ?? body.succeeded) === false) throw new Error(msg(body) || "Thao tác thất bại");
    return body ?? {};
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(tinId) || tinId <= 0) {
      setError("Tin tuyển dụng không hợp lệ.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = await request(`${API}/show/${tinId}`);
      const d = (extractData(body) ?? {}) as Record<string, unknown>;
      const rawSkills = (d.kyNangYeuCaus ?? d.KyNangYeuCaus ?? []) as Record<string, unknown>[];
      setDetail({
        id: Number(d.id ?? d.Id ?? tinId),
        tieuDe: String(d.tieuDe ?? d.TieuDe ?? ""),
        moTaCongViec: String(d.moTaCongViec ?? d.MoTaCongViec ?? ""),
        kinhNghiemYeuCau: String(d.kinhNghiemYeuCau ?? d.KinhNghiemYeuCau ?? ""),
        yeuCauCongViec: String(d.yeuCauCongViec ?? d.YeuCauCongViec ?? ""),
        quyenLoi: String(d.quyenLoi ?? d.QuyenLoi ?? ""),
        diaDiemLamViec: String(d.diaDiemLamViec ?? d.DiaDiemLamViec ?? ""),
        luongToiThieu: Number(d.luongToiThieu ?? d.LuongToiThieu ?? 0),
        luongToiDa: Number(d.luongToiDa ?? d.LuongToiDa ?? 0),
        kyNangs: Array.isArray(rawSkills)
          ? rawSkills.map(k => ({
              kyNangId: Number(k.kyNangId ?? k.KyNangId),
              tenKyNang: String(k.tenKyNang ?? k.TenKyNang ?? ""),
              mucDoYeuCau: Number(k.mucDoYeuCau ?? k.MucDoYeuCau),
            }))
          : [],
        ghiChuKiemDuyet: String(d.ghiChuKiemDuyet ?? d.GhiChuKiemDuyet ?? ""),
        ketQuaSangLoc: String(d.ketQuaSangLoc ?? d.KetQuaSangLoc ?? ""),
        nguoiDaiDienDaDuyet: Boolean(d.nguoiDaiDienDaDuyet ?? d.NguoiDaiDienDaDuyet),
        vaiTroNguoiDang: String(d.vaiTroNguoiDang ?? d.VaiTroNguoiDang ?? ""),
        trangThai: String(d.trangThai ?? d.TrangThai ?? ""),
        lastModified: (d.lastModified ?? d.LastModified ?? null) as string | null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được tin tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }, [request, tinId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const pending = detail ? CHO_NGUOI_DAI_DIEN.has(detail.trangThai) : false;

  async function decide(approve: boolean) {
    if (!detail) return;
    const action = approve ? "Duyệt" : "Từ chối";
    let note = "Người đại diện đồng ý, chuyển sang bộ lọc hệ thống";
    if (!approve) {
      const reason = await prompt({ title: "Lý do từ chối tin", description: "Nêu nội dung cần Nhân sự sửa.", confirmLabel: "Từ chối" });
      if (!reason?.trim()) return;
      note = reason.trim();
    }
    const confirmed = await confirm({
      title: `${action} tin?`,
      description: approve
        ? "Sau khi bạn đồng ý, hệ thống mới lọc: OK thì công khai, vi phạm hoặc nghi vấn thì chuyển Admin duyệt tay."
        : `Bạn chắc chắn muốn từ chối tin "${detail.tieuDe}"?`,
      confirmLabel: action,
      destructive: !approve,
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const result = await request(`${API}/${detail.id}/fire`, {
        method: "POST",
        body: JSON.stringify({
          id: detail.id,
          trigger: approve ? TRIGGER.NguoiDaiDienDuyet : TRIGGER.NguoiDaiDienTuChoi,
          ghiChu: note,
          expectedLastModified: detail.lastModified,
        }),
      });
      toast.success(msg(result) || (approve ? "Đã chuyển sang bộ lọc hệ thống" : "Đã từ chối tin"));
      router.replace("/duyet-tin-nhan-su");
    } catch (e) {
      // Thường gặp: người khác vừa xử lý tin (lastModified đổi) — tải lại để thấy trạng thái mới.
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật tin");
      void load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={ClipboardCheck}
        title="Chi tiết tin chờ duyệt"
        description={pending ? "Xem lại toàn bộ nội dung trước khi quyết định. Đồng ý → hệ thống lọc: OK thì công khai, vi phạm thì chuyển Admin duyệt tay." : "Tin này không còn ở hàng chờ duyệt của bạn."}
        actions={<div className="flex flex-wrap gap-2">
          <Link href="/duyet-tin-nhan-su" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}><ArrowLeft className="size-4" /> Hàng chờ duyệt</Link>
          <Button variant="outline" onClick={() => void load()} disabled={loading || busy}><RefreshCw className="size-4" /> Tải lại</Button>
        </div>}
      />

      {loading ? <AdminCard><AdminLoadingState /></AdminCard> : error ? (
        <AdminCard><p className="p-6 text-sm text-destructive">{error}</p></AdminCard>
      ) : detail ? (
        <AdminCard>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{detail.tieuDe || "Tin chưa có tiêu đề"}</h2>
              <Badge variant={pending ? "default" : "secondary"}>{pending ? "Chờ Người đại diện duyệt" : "Không còn ở hàng chờ"}</Badge>
            </div>
            <JobPreviewBody data={detail} />
          </div>
          {pending && <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-border bg-card p-4">
            <Button variant="destructive" disabled={busy} onClick={() => void decide(false)}><XCircle className="size-4" /> Từ chối</Button>
            <Button disabled={busy} onClick={() => void decide(true)}><CheckCircle2 className="size-4" /> Đồng ý và chạy bộ lọc</Button>
          </div>}
        </AdminCard>
      ) : null}
    </AdminPageLayout>
  );
}
