"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, RefreshCw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { getValidToken } from "@/lib/auth-provider";

type TinChoDuyet = {
  id: number;
  tieuDe: string;
  moTaCongViec: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  nguoiDangTinId: number;
  trangThai: string;
  lastModified?: string;
};

const API = "/api/dotnet/tintuyendungs";
const TRIGGER = { NguoiDaiDienDuyet: 13, NguoiDaiDienTuChoi: 14 } as const;

function value(row: Record<string, unknown>, camel: string, pascal: string) {
  return row[camel] ?? row[pascal];
}

export default function DuyetTinNhanSuPage() {
  const [items, setItems] = useState<TinChoDuyet[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { confirm, prompt } = useConfirmDialog();

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const token = await getValidToken();
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}`, ...init?.headers },
    });
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) throw new Error(String(body?.Message ?? body?.message ?? `HTTP ${response.status}`));
    const succeeded = body?.Succeeded ?? body?.succeeded;
    if (succeeded === false) throw new Error(String(body?.Message ?? body?.message ?? "Thao tác thất bại"));
    return body;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // _end=0 trả 0 dòng → hàng chờ duyệt luôn rỗng; cần _end>0 như mọi list call khác.
      const body = await request(`${API}?TrangThai=ChoNguoiDaiDienDuyet&_start=${(page - 1) * 20}&_end=${page * 20}`);
      setTotalPages(Number(body?.TotalPages ?? body?.totalPages ?? 1) || 1);
      const raw = body?.Data ?? body?.data;
      const rows = Array.isArray(raw) ? raw : [];
      setItems(rows.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: Number(value(row, "id", "Id")),
          tieuDe: String(value(row, "tieuDe", "TieuDe") ?? ""),
          moTaCongViec: String(value(row, "moTaCongViec", "MoTaCongViec") ?? ""),
          diaDiemLamViec: String(value(row, "diaDiemLamViec", "DiaDiemLamViec") ?? ""),
          luongToiThieu: Number(value(row, "luongToiThieu", "LuongToiThieu") ?? 0),
          luongToiDa: Number(value(row, "luongToiDa", "LuongToiDa") ?? 0),
          nguoiDangTinId: Number(value(row, "nguoiDangTinId", "NguoiDangTinId") ?? 0),
          trangThai: String(value(row, "trangThai", "TrangThai") ?? ""),
          lastModified: value(row, "lastModified", "LastModified") as string | undefined,
        };
      }).filter((item) => item.trangThai === "ChoNguoiDaiDienDuyet" || item.trangThai === "9"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách chờ duyệt");
    } finally {
      setLoading(false);
    }
  }, [request, page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function decide(item: TinChoDuyet, approve: boolean) {
    const action = approve ? "Duyệt" : "Từ chối";
    const reason = approve ? "Người đại diện đồng ý, chuyển sang bộ lọc hệ thống" : await prompt({ title: "Lý do từ chối tin", description: "Nêu nội dung cần Nhân sự sửa.", confirmLabel: "Từ chối" });
    if (!reason?.trim()) return;
    const confirmed = await confirm({
      title: `${action} tin?`,
      description: `Bạn chắc chắn muốn ${action.toLowerCase()} tin "${item.tieuDe}"?`,
      confirmLabel: action,
      destructive: !approve,
    });
    if (!confirmed) return;
    setBusyId(item.id);
    try {
      const result = await request(`${API}/${item.id}/fire`, {
        method: "POST",
        body: JSON.stringify({
          id: item.id,
          trigger: approve ? TRIGGER.NguoiDaiDienDuyet : TRIGGER.NguoiDaiDienTuChoi,
          ghiChu: reason,
          expectedLastModified: item.lastModified,
        }),
      });
      setItems((current) => current.filter((row) => row.id !== item.id));
      toast.success(String(result?.Message ?? result?.message ?? (approve ? "Đã chuyển sang bộ lọc hệ thống" : "Đã từ chối tin")));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật tin");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={ClipboardCheck}
        title="Duyệt tin của Nhân sự"
        description="Nhân sự gửi tin → Người đại diện đồng ý → hệ thống lọc: OK thì công khai, vi phạm thì Admin duyệt tay."
        actions={<Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" /> Tải lại</Button>}
      />

      <AdminCard>
        <AdminCardHeader title="Hàng chờ phê duyệt" description={`${items.length} tin cần xử lý`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={ClipboardCheck} title="Không có tin chờ duyệt" description="Tin do Nhân sự gửi sẽ xuất hiện tại đây sau khi vượt qua kiểm duyệt tự động." />
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{item.tieuDe}</h2>
                    <Badge variant="outline">Đã qua hệ thống</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.moTaCongViec}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><UserRound className="size-3.5" /> Nhân sự #{item.nguoiDangTinId}</span>
                    <span>{item.diaDiemLamViec}</span>
                    <span>{new Intl.NumberFormat("vi-VN").format(item.luongToiThieu)} - {new Intl.NumberFormat("vi-VN").format(item.luongToiDa)} đ</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={busyId === item.id} onClick={() => void decide(item, false)}>
                    <XCircle className="size-4" /> Từ chối
                  </Button>
                  <Button disabled={busyId === item.id} onClick={() => void decide(item, true)}>
                    <CheckCircle2 className="size-4" /> Đồng ý và chạy bộ lọc
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>
      <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Trang trước</Button><span className="text-sm">Trang {page}/{totalPages}</span><Button variant="outline" disabled={loading || page >= totalPages} onClick={() => setPage(value => value + 1)}>Trang sau</Button></div>
    </AdminPageLayout>
  );
}
