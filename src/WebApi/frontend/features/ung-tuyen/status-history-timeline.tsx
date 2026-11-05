"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, History, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getValidToken } from "@/lib/auth-provider";

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

type LichSuItem = {
  id: number;
  trangThaiTruoc: number | string | null;
  trangThaiSau: number | string | null;
  trigger: number | string | null;
  nguoiThucHienId: number | null;
  tenNguoiThucHien: string | null;
  ghiChu: string | null;
  created: string;
};

type Picked = Record<string, unknown>;

const pick = (row: Picked, names: string[]): unknown => {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
  }
  return null;
};

const soNguyen = (value: unknown): number => {
  if (typeof value === "number") return value;
  const text = `${value ?? ""}`.trim();
  if (/^\d+$/.test(text)) return Number(text);
  return -1;
};

const TRANG_THAI_LABEL: Record<number, string> = {
  0: "Khởi tạo",
  1: "Lỗi xử lý hồ sơ",
  2: "Chờ xử lý",
  3: "Đã xem",
  4: "Ứng viên rút đơn",
  5: "Phù hợp",
  6: "Từ chối",
  7: "Quá hạn xử lý",
  8: "Tin bị đóng",
  9: "Vô hiệu",
};

const TRANG_THAI_NAME: Record<string, number> = {
  khoitao: 0,
  loixulyhoso: 1,
  choxuly: 2,
  daxem: 3,
  ungvienrutdon: 4,
  phuhop: 5,
  tuchoi: 6,
  quahanxuly: 7,
  tintuyendungbidong: 8,
  vohieuhoa: 9,
};

const TRIGGER_LABEL: Record<number, string> = {
  0: "Hệ thống tiếp nhận hồ sơ",
  1: "Hồ sơ lỗi khi tiếp nhận",
  2: "Ứng viên nộp lại hồ sơ",
  3: "Quá hạn xử lý",
  4: "Tin tuyển dụng bị đóng",
  5: "Nhà tuyển dụng xem hồ sơ",
  6: "Nhà tuyển dụng đánh giá phù hợp",
  7: "Nhà tuyển dụng từ chối",
  8: "Ứng viên rút đơn",
};

const TRIGGER_NAME: Record<string, number> = {
  xulyhosothanhcong: 0,
  xulyhosothatbai: 1,
  noplaihoso: 2,
  hethanxuly: 3,
  dongboitintuyendung: 4,
  xemdon: 5,
  danghiaphuhop: 6,
  tuchoi: 7,
  rutdon: 8,
};

const tinhTrangThai = (value: unknown): string => {
  const so = soNguyen(value);
  if (so >= 0) return TRANG_THAI_LABEL[so] ?? `#${so}`;
  const ten = `${value ?? ""}`.trim().toLowerCase().replace(/[\s_-]/g, "");
  const mapped = TRANG_THAI_NAME[ten];
  return mapped === undefined ? `${value ?? "—"}` : TRANG_THAI_LABEL[mapped];
};

const tinhTrigger = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const so = soNguyen(value);
  if (so >= 0) return TRIGGER_LABEL[so] ?? `Trigger #${so}`;
  const ten = `${value}`.trim().toLowerCase().replace(/[\s_-]/g, "");
  const mapped = TRIGGER_NAME[ten];
  return mapped === undefined ? `${value}` : TRIGGER_LABEL[mapped];
};

const fmtNgayGio = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function StatusHistoryTimeline({ donId }: { donId: number }) {
  const [items, setItems] = useState<LichSuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(donId) || donId <= 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const token = await getValidToken();
      const response = await fetch(
        `/api/dotnet/donungtuyens/show/${donId}/lich-su`,
        {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        },
      );
      const body = (await response.json().catch(() => null)) as ApiResponse<
        unknown[]
      > | null;
      if (!response.ok || !(body?.Succeeded ?? body?.succeeded ?? false)) {
        throw new Error(
          body?.Message ??
            body?.message ??
            `HTTP ${response.status}: không đọc được lịch sử đơn.`,
        );
      }
      const rows = (body?.Data ?? body?.data ?? []) as unknown as Picked[];
      setItems(
        rows.map((row) => ({
          id: Number(pick(row, ["Id", "id"]) ?? 0),
          trangThaiTruoc: pick(row, ["TrangThaiTruoc", "trangThaiTruoc"]) as
            | number
            | string
            | null,
          trangThaiSau: pick(row, ["TrangThaiSau", "trangThaiSau"]) as
            | number
            | string
            | null,
          trigger: pick(row, ["Trigger", "trigger"]) as number | string | null,
          nguoiThucHienId:
            (pick(row, ["NguoiThucHienId", "nguoiThucHienId"]) as number) ??
            null,
          tenNguoiThucHien:
            (pick(row, ["TenNguoiThucHien", "tenNguoiThucHien"]) as string) ??
            null,
          ghiChu: (pick(row, ["GhiChu", "ghiChu"]) as string) ?? null,
          created: `${pick(row, ["Created", "created"]) ?? ""}`,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được lịch sử đơn.");
    } finally {
      setLoading(false);
    }
  }, [donId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải lịch sử xử lý...
      </p>
    );
  }

  if (error) {
    return (
      <p className="flex items-center gap-2 text-sm text-destructive">
        <CircleAlert className="size-4" /> {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="size-4" /> Chưa có bản ghi lịch sử cho đơn này.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item, index) => {
        const trigger = tinhTrigger(item.trigger);
        const tacNhan =
          item.tenNguoiThucHien ||
          (item.nguoiThucHienId ? `Người dùng #${item.nguoiThucHienId}` : "Hệ thống");
        const laMoc = trigger === null;
        return (
          <li key={item.id} className="flex gap-3">
            <span
              className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                laMoc ? "bg-muted-foreground/40" : "bg-primary"
              }`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {laMoc ? "Mốc ban đầu" : trigger}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {laMoc
                  ? `Trạng thái: ${tinhTrangThai(item.trangThaiSau)}`
                  : `${tinhTrangThai(item.trangThaiTruoc)} → ${tinhTrangThai(
                      item.trangThaiSau,
                    )}`}
                {" • "}
                {tacNhan}
                {index === items.length - 1 && !laMoc && (
                  <Badge variant="outline" className="ml-2 align-middle">
                    hiện tại
                  </Badge>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/80">
                {fmtNgayGio(item.created)}
              </p>
              {item.ghiChu && (
                <p className="mt-1 break-words text-xs text-foreground/80">
                  {item.ghiChu}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
