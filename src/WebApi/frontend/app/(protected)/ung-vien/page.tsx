"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCheck, Eye, FileText, Search, UserX, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";

type Application = {
  id: number;
  hoSoUngVienId: number;
  tinTuyenDungId: number;
  cvUngVienId: number;
  trangThai: number;
  ghiChu: string;
  ngayUngTuyen: string;
  tieuDe: string;
};

type CandidateProfile = {
  id: number;
  hoTen: string;
  viTriUngTuyen: string;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

const APPLICATIONS_API = "/api/dotnet/donungtuyens";
const PROFILES_API = "/api/dotnet/hosoungviens";
const TRIGGER = { XemDon: 5, DanhGiaPhuHop: 6, TuChoi: 7 } as const;

const STATUS: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Khởi tạo", variant: "outline" },
  1: { label: "Lỗi xử lý hồ sơ", variant: "destructive" },
  2: { label: "Chờ xử lý", variant: "default" },
  3: { label: "Đã xem", variant: "secondary" },
  4: { label: "Ứng viên rút đơn", variant: "secondary" },
  5: { label: "Phù hợp", variant: "default" },
  6: { label: "Từ chối", variant: "destructive" },
  7: { label: "Quá hạn xử lý", variant: "destructive" },
  8: { label: "Tin đã đóng", variant: "secondary" },
  9: { label: "Vô hiệu hóa", variant: "destructive" },
};

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

const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function parseStatus(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = `${value ?? ""}`.trim();
  if (/^\d+$/.test(text)) return Number(text);
  return STATUS_BY_NAME[text.toLowerCase().replace(/[\s_-]/g, "")] ?? -1;
}

function extractArray<T>(response: ApiResponse<unknown> | null): T[] {
  const data = response ? extractData(response) : undefined;
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const value = data as Record<string, unknown>;
    if (Array.isArray(value.items)) return value.items as T[];
    if (Array.isArray(value.Items)) return value.Items as T[];
  }
  return [];
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

export default function UngVienPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm, prompt } = useConfirmDialog();
  const [items, setItems] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Record<number, CandidateProfile>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  const statusFilter = searchParams.get("status") ?? "all";
  const jobFilter = searchParams.get("jobId") ?? "all";
  const statusValue = statusFilter === "all" ? null : parseStatus(statusFilter);

  const apiFetch = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    const body = await response.json().catch(() => null) as ApiResponse<unknown> | null;
    if (!response.ok) throw new Error(body ? msg(body) : `HTTP ${response.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const query = new URLSearchParams({ _start: "0", _end: "100" });
      if (statusValue !== null && statusValue >= 0) query.set("TrangThai", `${statusValue}`);
      if (jobFilter !== "all") query.set("TinTuyenDungId", jobFilter);

      const [applicationsResponse, profilesResponse] = await Promise.all([
        apiFetch(`${APPLICATIONS_API}?${query.toString()}`),
        apiFetch(`${PROFILES_API}?_start=0&_end=100`),
      ]);
      if (!applicationsResponse || !ok(applicationsResponse)) {
        throw new Error(applicationsResponse ? msg(applicationsResponse) : "Không tải được danh sách đơn ứng tuyển.");
      }

      const applications = extractArray<Record<string, unknown>>(applicationsResponse).map((value) => ({
        id: Number(value.id ?? value.Id ?? 0),
        hoSoUngVienId: Number(value.hoSoUngVienId ?? value.HoSoUngVienId ?? 0),
        tinTuyenDungId: Number(value.tinTuyenDungId ?? value.TinTuyenDungId ?? 0),
        cvUngVienId: Number(value.cvUngVienId ?? value.CVUngVienId ?? 0),
        trangThai: parseStatus(value.trangThai ?? value.TrangThai),
        ghiChu: `${value.ghiChu ?? value.GhiChu ?? ""}`,
        ngayUngTuyen: `${value.ngayUngTuyen ?? value.NgayUngTuyen ?? ""}`,
        tieuDe: `${value.tieuDe ?? value.TieuDe ?? "Tin tuyển dụng"}`,
      }));
      setItems(applications);

      const profileMap: Record<number, CandidateProfile> = {};
      for (const value of extractArray<Record<string, unknown>>(profilesResponse)) {
        const id = Number(value.id ?? value.Id ?? 0);
        if (id) {
          profileMap[id] = {
            id,
            hoTen: `${value.hoTen ?? value.HoTen ?? ""}`,
            viTriUngTuyen: `${value.viTriUngTuyen ?? value.ViTriUngTuyen ?? ""}`,
          };
        }
      }
      setProfiles(profileMap);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, jobFilter, statusValue]);

  // Data loading is intentionally triggered when the URL filters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => {
      const profile = profiles[item.hoSoUngVienId];
      return [profile?.hoTen, profile?.viTriUngTuyen, item.tieuDe].some((value) =>
        value?.toLowerCase().includes(normalized),
      );
    });
  }, [items, profiles, search]);

  async function handleViewCv(item: Application) {
    if (actingId === item.id) return;
    try {
      setActingId(item.id);
      if (item.trangThai === 2) {
        const response = await apiFetch(`${APPLICATIONS_API}/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({ id: item.id, trigger: TRIGGER.XemDon, ghiChu: "" }),
        });
        if (!response || !ok(response)) throw new Error(response ? msg(response) : "Không thể ghi nhận đã xem hồ sơ.");
        setItems((current) => current.map((entry) =>
          entry.id === item.id ? { ...entry, trangThai: 3 } : entry,
        ));
      }
      const returnTo = encodeURIComponent("/ung-vien");
      router.push(`/tin-tuyen-dung/${item.tinTuyenDungId}/ung-vien/cv/${item.cvUngVienId}?donId=${item.id}&returnTo=${returnTo}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Không thể mở hồ sơ ứng viên.");
      setActingId(null);
    }
  }

  async function handleAction(item: Application, trigger: number, label: string) {
    if (actingId === item.id) return;
    const profileName = profiles[item.hoSoUngVienId]?.hoTen ?? `hồ sơ #${item.hoSoUngVienId}`;
    const note = trigger === TRIGGER.TuChoi
      ? await prompt({
        title: `Từ chối đơn của ${profileName}`,
        description: "Lý do sẽ được lưu cùng đơn ứng tuyển và có thể được gửi tới ứng viên.",
        placeholder: "Nhập lý do (tùy chọn)",
        confirmLabel: "Tiếp tục",
        destructive: true,
      })
      : "";
    if (note === null) return;
    if (!await confirm({
      title: `${label[0].toUpperCase()}${label.slice(1)} đơn?`,
      description: `${profileName} sẽ được chuyển sang trạng thái tương ứng trong quy trình tuyển dụng.`,
      confirmLabel: label[0].toUpperCase() + label.slice(1),
      destructive: trigger === TRIGGER.TuChoi,
    })) return;

    try {
      setActingId(item.id);
      setErr("");
      setSuccessMsg("");
      const response = await apiFetch(`${APPLICATIONS_API}/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ id: item.id, trigger, ghiChu: note.trim() }),
      });
      if (!response || !ok(response)) throw new Error(response ? msg(response) : "Không thể cập nhật đơn.");
      setSuccessMsg(msg(response) || `Đã ${label.toLowerCase()} đơn.`);
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Không thể cập nhật đơn.");
    } finally {
      setActingId(null);
    }
  }

  function setStatusFilter(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") next.delete("status");
    else next.set("status", value);
    router.push(`/ung-vien${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Users}
        title="Hộp thư ứng viên"
        description="Mở hồ sơ, đánh giá và xử lý các đơn ứng tuyển theo đúng trạng thái."
      />

      {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
      {successMsg && <Alert><AlertDescription>{successMsg}</AlertDescription></Alert>}

      <AdminCard>
        <AdminCardHeader
          title="Đơn ứng tuyển"
          description={`${filtered.length} đơn trong phạm vi bạn được phân quyền`}
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                <option value="all">Tất cả trạng thái</option>
                <option value="2">Chờ xử lý</option>
                <option value="3">Đã xem</option>
                 <option value="6">Từ chối</option>
                 <option value="5">Phù hợp</option>
              </select>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ứng viên hoặc tin..." className="pl-9" />
              </div>
            </div>
          }
        />

        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <AdminEmptyState
            icon={FileText}
            title={search || statusFilter !== "all" ? "Không tìm thấy đơn phù hợp" : "Chưa có đơn ứng tuyển"}
            description={search || statusFilter !== "all" ? "Thử thay đổi bộ lọc hoặc từ khóa." : "Các đơn ứng tuyển mới sẽ xuất hiện ở đây để bạn xử lý."}
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const profile = profiles[item.hoSoUngVienId];
              const state = STATUS[item.trangThai] ?? { label: `Trạng thái #${item.trangThai}`, variant: "outline" as const };
              const busy = actingId === item.id;
              return (
                <div key={item.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {(profile?.hoTen || "UV").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground">{profile?.hoTen || `Hồ sơ #${item.hoSoUngVienId}`}</span>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{item.tieuDe}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {profile?.viTriUngTuyen && `${profile.viTriUngTuyen} • `}
                      Đơn #{item.id} • Nộp {formatDate(item.ngayUngTuyen)}
                    </p>
                    {item.ghiChu && <p className="mt-1 text-xs text-muted-foreground">Ghi chú: {item.ghiChu}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleViewCv(item)}>
                      <Eye className="size-4" /> Xem CV
                    </Button>
                    {(item.trangThai === 2 || item.trangThai === 3) && (
                      <Button size="sm" disabled={busy} onClick={() => void handleAction(item, TRIGGER.DanhGiaPhuHop, "duyệt phù hợp")}>
                        <CheckCheck className="size-4" /> Duyệt phù hợp
                      </Button>
                    )}
                    {(item.trangThai === 2 || item.trangThai === 3) && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => void handleAction(item, TRIGGER.TuChoi, "từ chối")}>
                        <UserX className="size-4" /> Từ chối
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}
