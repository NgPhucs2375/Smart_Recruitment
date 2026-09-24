"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ArrowLeft, CheckCheck, Eye, FileText, Loader2, Star, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  AdminPageLayout,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";

type DonUngTuyen = {
  id: number;
  hoSoUngVienId: number;
  tinTuyenDungId: number;
  cvUngVienId: number;
  cvPhienBanId: number | null;
  trangThai: number;
  ghiChu: string;
  ngayUngTuyen: string;
};

type DanhGia = {
  donUngTuyenId: number;
  noiDungPhanHoi: string;
  ketLuan: string;
  ngayPhanHoi: string;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

// Trạng thái số của backend (Domain/Enums/TrangThaiDonUngTuyen.cs)
const TRANG_THAI: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Khởi tạo", variant: "outline" },
  1: { label: "Lỗi xử lý hồ sơ", variant: "destructive" },
  2: { label: "Chờ xử lý", variant: "default" },
  3: { label: "Đã xem", variant: "secondary" },
  4: { label: "Ứng viên rút đơn", variant: "secondary" },
  5: { label: "Phù hợp", variant: "default" },
  6: { label: "Đã từ chối", variant: "destructive" },
  7: { label: "Quá hạn xử lý", variant: "destructive" },
  8: { label: "Tin bị đóng", variant: "secondary" },
  9: { label: "Vô hiệu", variant: "destructive" },
};

// Trigger số của backend (Domain/Enums/TriggerDonUngTuyen.cs) — hành động của HR
const TRIGGER = { XemDon: 5, DanhGiaPhuHop: 6, TuChoi: 7 } as const;

const STATUS_BY_NAME: Record<string, number> = {
  khoitao: 0,
  loixulyhoso: 1,
  choxuly: 2,
  daxem: 3,
  phuhop: 5,
  tuchoi: 6,
  ungvienrutdon: 4,
  quahanxuly: 7,
  tintuyendungbidong: 8,
  vohieuhoa: 9,
};

const API = "/api/dotnet/donungtuyens";
const DG_API = "/api/dotnet/danhgias";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function parseTrangThai(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = `${value ?? ""}`.trim();
  if (/^\d+$/.test(text)) return Number(text);
  return STATUS_BY_NAME[text.toLowerCase().replace(/[\s_-]/g, "")] ?? -1;
}

function fmtDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("vi-VN");
  } catch {
    return d;
  }
}

export default function UngVienTheoTinPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { confirm, prompt } = useConfirmDialog();
  const tinId = Number(params.id);

  const [tieuDe, setTieuDe] = useState("");
  const [items, setItems] = useState<DonUngTuyen[]>([]);
  const [hoSoNames, setHoSoNames] = useState<Record<number, string>>({});
  const [danhGias, setDanhGias] = useState<Record<number, DanhGia>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  // Dialog đánh giá & kết luận (state END của đơn ở mức Phù hợp).
  const [evalDon, setEvalDon] = useState<DonUngTuyen | null>(null);
  const [evalNoiDung, setEvalNoiDung] = useState("");
  const [evalKetLuan, setEvalKetLuan] = useState("");
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      ...opts,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts?.headers,
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(tinId) || tinId <= 0) {
      setErr("Tin tuyển dụng không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const [tinRes, donRes]: ApiResponse<unknown>[] = await Promise.all([
        apiFetch(`/api/dotnet/tintuyendungs/show/${tinId}`),
        apiFetch(`${API}?TinTuyenDungId=${tinId}&_start=0&_end=1000`),
      ]);
      if (tinRes && ok(tinRes)) {
        const t = (extractData(tinRes) ?? {}) as Record<string, unknown>;
        setTieuDe(`${t.tieuDe ?? t.TieuDe ?? ""}`);
      }
      if (!donRes || !ok(donRes)) throw new Error(donRes ? msg(donRes) : "Không tải được danh sách đơn.");
      const d = extractData(donRes);
      const arr = Array.isArray(d) ? d : [];
      const list = arr.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        return {
          id: Number(r.id ?? r.Id ?? 0),
          hoSoUngVienId: Number(r.hoSoUngVienId ?? r.HoSoUngVienId ?? 0),
          tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
          cvUngVienId: Number(r.cvUngVienId ?? r.CVUngVienId ?? 0),
          cvPhienBanId: r.cvPhienBanId ?? r.CVPhienBanId ?? null,
          trangThai: parseTrangThai(r.trangThai ?? r.TrangThai),
          ghiChu: `${r.ghiChu ?? r.GhiChu ?? ""}`,
          ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}`,
        } as DonUngTuyen;
      });
      setItems(list);

      // Tên ứng viên từ hồ sơ (quyền hosoungviens/show đã có) — lỗi thì giữ "Hồ sơ #id".
      const ids = [...new Set(list.map((x) => x.hoSoUngVienId).filter((x) => x > 0))];
      const names: Record<number, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const hRes = await apiFetch(`/api/dotnet/hosoungviens/show/${id}`);
            const h = (extractData(hRes ?? {}) ?? {}) as Record<string, unknown>;
            const name = `${h.hoTen ?? h.HoTen ?? ""}`.trim();
            if (name) names[id] = name;
          } catch {
            // bỏ qua từng hồ sơ lỗi
          }
        }),
      );
      setHoSoNames(names);

      // Đánh giá/Kết luận đã có của từng đơn (mỗi đơn tối đa 1 đánh giá).
      const dgMap: Record<number, DanhGia> = {};
      await Promise.all(
        list.map(async (don) => {
          try {
            const gRes = await apiFetch(`${DG_API}?DonUngTuyenId=${don.id}&_start=0&_end=1`);
            const gd = extractData(gRes ?? {});
            const gArr = Array.isArray(gd) ? gd : [];
            if (gArr.length > 0) {
              const g = gArr[0] as Record<string, unknown>;
              dgMap[don.id] = {
                donUngTuyenId: don.id,
                noiDungPhanHoi: `${g.noiDungPhanHoi ?? g.NoiDungPhanHoi ?? ""}`,
                ketLuan: `${g.ketLuan ?? g.KetLuan ?? ""}`,
                ngayPhanHoi: `${g.ngayPhanHoi ?? g.NgayPhanHoi ?? ""}`,
              };
            }
          } catch {
            // bỏ qua từng đơn lỗi
          }
        }),
      );
      setDanhGias(dgMap);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, tinId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleAction(item: DonUngTuyen, trigger: number, label: string, needReason = false) {
    let ghiChu = "";
    if (needReason) {
      const input = await prompt({
        title: `Từ chối đơn của ${hoSoNames[item.hoSoUngVienId] ?? `hồ sơ #${item.hoSoUngVienId}`}`,
        description: "Lý do sẽ được lưu cùng đơn ứng tuyển và có thể được gửi tới ứng viên.",
        placeholder: "Nhập lý do (tùy chọn)",
        confirmLabel: "Tiếp tục",
        destructive: true,
      });
      if (input === null) return;
      ghiChu = input.trim();
      if (!await confirm({
        title: "Từ chối đơn ứng tuyển?",
        description: `Đơn #${item.id} sẽ được chuyển sang trạng thái Từ chối.`,
        confirmLabel: "Từ chối đơn",
        destructive: true,
      })) return;
    } else if (!await confirm({
      title: `${label[0].toUpperCase()}${label.slice(1)} đơn ứng tuyển?`,
      description: `Đơn #${item.id} sẽ được cập nhật trong quy trình tuyển dụng.`,
      confirmLabel: label[0].toUpperCase() + label.slice(1),
    })) {
      return;
    }
    try {
      setActingId(item.id);
      setErr("");
      setSuccessMsg("");
       const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ id: item.id, trigger, ghiChu }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể cập nhật đơn");
       const nextStatus = trigger === TRIGGER.TuChoi ? 6 : trigger === TRIGGER.DanhGiaPhuHop ? 5 : undefined;
      if (nextStatus !== undefined) {
        setItems((current) => current.map((entry) =>
          entry.id === item.id ? { ...entry, trangThai: nextStatus, ghiChu } : entry,
        ));
      }
      setSuccessMsg(msg(res) || `Đã ${label.toLowerCase()} đơn #${item.id}.`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể cập nhật đơn");
    } finally {
      setActingId(null);
    }
  }

  async function handleViewCv(item: DonUngTuyen) {
    if (actingId === item.id) return;

    try {
      setActingId(item.id);
      setErr("");
      setSuccessMsg("");
      // Luôn đọc state từ server để tránh dùng dữ liệu cũ trong danh sách.
      const detail: ApiResponse<unknown> = await apiFetch(`${API}/show/${item.id}`);
      const detailData = (extractData(detail) ?? {}) as Record<string, unknown>;
      const currentStatus = parseTrangThai(detailData.trangThai ?? detailData.TrangThai);
      if (currentStatus === 2) {
        const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({ id: item.id, trigger: TRIGGER.XemDon, ghiChu: "" }),
        });
        if (!ok(res)) throw new Error(msg(res) || "Không thể ghi nhận đã xem hồ sơ");
      }
      setItems((current) => current.map((entry) =>
        entry.id === item.id ? { ...entry, trangThai: 3 } : entry,
      ));
      const returnTo = encodeURIComponent(`/tin-tuyen-dung/${tinId}/ung-vien`);
      router.push(`/tin-tuyen-dung/${tinId}/ung-vien/cv/${item.cvUngVienId}?donId=${item.id}&returnTo=${returnTo}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể mở hồ sơ ứng viên");
      setActingId(null);
    }
  }

  // Quyền fire theo state machine: XemDon từ Chờ xử lý, Phù hợp từ Đã xem, Từ chối ở các bước HR.
  const canPhuHop = (s: number) => s === 3;
  const canTuChoi = (s: number) => s === 2 || s === 3;
  // Đánh giá & Kết luận là bước END — chỉ khi đơn đã Phù hợp và chưa có đánh giá.
  const canDanhGia = (item: DonUngTuyen) => item.trangThai === 5 && !danhGias[item.id];

  function openEval(item: DonUngTuyen) {
    setEvalDon(item);
    setEvalNoiDung(danhGias[item.id]?.noiDungPhanHoi ?? "");
    setEvalKetLuan(danhGias[item.id]?.ketLuan ?? "");
  }

  async function submitEval() {
    if (!evalDon || evalSubmitting) return;
    if (!evalNoiDung.trim() || !evalKetLuan.trim()) {
      setErr("Vui lòng nhập nhận xét và kết luận.");
      return;
    }
    try {
      setEvalSubmitting(true);
      setErr("");
      const res: ApiResponse<unknown> = await apiFetch(DG_API, {
        method: "POST",
        body: JSON.stringify({
          donUngTuyenId: evalDon.id,
          noiDungPhanHoi: evalNoiDung.trim(),
          ketLuan: evalKetLuan.trim(),
        }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu đánh giá");
      setEvalDon(null);
      setSuccessMsg(msg(res) || `Đã ghi nhận đánh giá cho đơn #${evalDon.id}.`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu đánh giá");
    } finally {
      setEvalSubmitting(false);
    }
  }

  return (
    <AdminPageLayout>
      <Link
        href="/tin-tuyen-dung"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Về quản lý tin
      </Link>

      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Tin #{tinId} • Ứng viên ứng tuyển
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {tieuDe || `Tin tuyển dụng #${tinId}`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mở hồ sơ, đánh giá phù hợp hoặc từ chối. Khi mở lần đầu, hệ thống ghi nhận đã xem và thông báo cho ứng viên.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>
      )}
      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>
      )}

      <AdminCard>
        <AdminCardHeader title="Danh sách đơn ứng tuyển" description={`${items.length} đơn`} />
        {loading ? (
          <AdminLoadingState />
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={FileText}
            title="Chưa có ứng viên nào"
            description="Khi ứng viên nộp đơn vào tin này, danh sách sẽ hiện ở đây."
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const st = TRANG_THAI[item.trangThai] ?? { label: `#${item.trangThai}`, variant: "secondary" as const };
              const busy = actingId === item.id;
              const name = hoSoNames[item.hoSoUngVienId] ?? `Hồ sơ #${item.hoSoUngVienId}`;
              return (
                <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Đơn #{item.id} • CV #{item.cvUngVienId}
                      {item.cvPhienBanId != null && Number(item.cvPhienBanId) > 0 && ` (bản CV #${item.cvPhienBanId})`}
                      {" • "}Nộp {fmtDate(item.ngayUngTuyen)}
                    </p>
                    {item.ghiChu && <p className="mt-1 text-xs text-muted-foreground">Ghi chú: {item.ghiChu}</p>}
                    {danhGias[item.id] && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Đánh giá: <span className="font-semibold text-foreground">{danhGias[item.id].ketLuan}</span>
                        {danhGias[item.id].ngayPhanHoi && ` • ${fmtDate(danhGias[item.id].ngayPhanHoi)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleViewCv(item)}>
                      <Eye className="size-4" /> Xem CV
                    </Button>
                     {canPhuHop(item.trangThai) && (
                       <Button variant="default" size="sm" disabled={busy} onClick={() => void handleAction(item, TRIGGER.DanhGiaPhuHop, "duyệt phù hợp")}>
                         <CheckCheck className="size-4" /> Duyệt phù hợp
                      </Button>
                    )}
                    {canTuChoi(item.trangThai) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={() => void handleAction(item, TRIGGER.TuChoi, "Từ chối", true)}
                      >
                        <UserX className="size-4" /> Từ chối
                      </Button>
                    )}
                    {canDanhGia(item) && (
                      <Button variant="default" size="sm" disabled={busy} onClick={() => openEval(item)}>
                        <Star className="size-4" /> Đánh giá
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      <DialogPrimitive.Root open={evalDon !== null} onOpenChange={(next) => { if (!next) setEvalDon(null); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Popup className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl outline-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                    <Star className="size-5 text-primary" /> Đánh giá & kết luận
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                    Đơn #{evalDon?.id} — bước cuối của vòng tuyển. Mỗi đơn chỉ có 1 đánh giá.
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  aria-label="Đóng"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </div>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nhận xét *
              </label>
              <textarea
                value={evalNoiDung}
                onChange={(e) => setEvalNoiDung(e.target.value)}
                rows={4}
                placeholder="VD: Kỹ năng phù hợp, giao tiếp tốt, có thể đi làm ngay..."
                className="mt-1.5 flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kết luận *
              </label>
              <input
                value={evalKetLuan}
                onChange={(e) => setEvalKetLuan(e.target.value)}
                placeholder="VD: Đạt — mời nhận việc / Không đạt"
                className="mt-1.5 flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <div className="mt-5 flex justify-end gap-2">
                <DialogPrimitive.Close className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  Huỷ
                </DialogPrimitive.Close>
                <Button type="button" size="sm" className="rounded-full" disabled={evalSubmitting} onClick={() => void submitEval()}>
                  {evalSubmitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  {evalSubmitting ? "Đang lưu..." : "Lưu đánh giá"}
                </Button>
              </div>
            </DialogPrimitive.Popup>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </AdminPageLayout>
  );
}
