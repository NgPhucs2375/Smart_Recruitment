"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, RefreshCw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/lib/auth-provider";

type TinChoDuyet = {
  id: number;
  tieuDe: string;
  moTaCongViec: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  nguoiDangTinId: number;
  trangThai: string;
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

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}`, ...init?.headers },
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
      const body = await request(`${API}?_start=0&_end=0`);
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
        };
      }).filter((item) => item.trangThai === "ChoNguoiDaiDienDuyet" || item.trangThai === "9"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách chờ duyệt");
    } finally {
      setLoading(false);
    }
  }, [request]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function decide(item: TinChoDuyet, approve: boolean) {
    const action = approve ? "duyệt" : "từ chối";
    if (!window.confirm(`Bạn chắc chắn muốn ${action} tin “${item.tieuDe}”?`)) return;
    setBusyId(item.id);
    try {
      await request(`${API}/${item.id}/fire`, {
        method: "POST",
        body: JSON.stringify({
          id: item.id,
          trigger: approve ? TRIGGER.NguoiDaiDienDuyet : TRIGGER.NguoiDaiDienTuChoi,
          ghiChu: `${approve ? "Đã duyệt" : "Đã từ chối"} bởi Người đại diện`,
        }),
      });
      setItems((current) => current.filter((row) => row.id !== item.id));
      toast.success(approve ? "Tin đã được duyệt và công khai" : "Đã từ chối tin");
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
        description="Các tin đã đạt kiểm duyệt hệ thống và đang chờ quyết định của Người đại diện."
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
                    <CheckCircle2 className="size-4" /> Duyệt và đăng
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}
