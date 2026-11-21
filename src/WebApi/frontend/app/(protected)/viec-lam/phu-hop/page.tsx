"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2, Target, TrendingUp } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { getValidToken, refreshSession } from "@/lib/auth-provider";
import { cvApi, hoSoApi } from "@/lib/api/cv-api";
import type { CvVm } from "@/lib/types";
import { MatchedJobCard, type RecommendationItem } from "@/features/recommendations/matched-job-card";

type KetQuaPhuHop = {
  id: number;
  hoSoUngVienId: number;
  tinTuyenDungId: number;
  diemPhuHop: number;
  phanLoai: number;
  created: string;
  hoTenUngVien?: string;
  tieuDeTinTuyenDung?: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const PHAN_LOAI: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Cao", variant: "default" },
  1: { label: "Trung bình", variant: "secondary" },
  2: { label: "Thấp", variant: "outline" },
};

const API = "/api/dotnet/ketquaphuhops";
// Ngưỡng này phải khớp ContentBasedMatcher.PhanLoaiCua (Cao >= 0.66, Trung bình >= 0.33).
const HIGH_SCORE = 0.66;
const MEDIUM_SCORE = 0.33;
const PAGE_STEP = 10;
const MAX_TOP_N = 30;

const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;
const asText = (value: unknown): string => `${value ?? ""}`.trim();
const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map((v) => `${v}`).filter(Boolean) : []);
const numOrUndefined = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

async function apiFetch(url: string, opts?: RequestInit) {
  let token = await getValidToken();
  const send = () => fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });

  let res = await send();
  if (res.status === 401 && await refreshSession()) {
    token = await getValidToken();
    res = await send();
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
  return body;
}

function normalizeRecommendation(value: unknown): RecommendationItem {
  const r = (value ?? {}) as Record<string, unknown>;
  return {
    tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
    tieuDe: asText(r.tieuDe ?? r.TieuDe) || "Tin tuyển dụng",
    tenDoanhNghiep: asText(r.tenDoanhNghiep ?? r.TenDoanhNghiep),
    diaDiemLamViec: asText(r.diaDiemLamViec ?? r.DiaDiemLamViec),
    luongToiThieu: Number(r.luongToiThieu ?? r.LuongToiThieu ?? 0),
    luongToiDa: Number(r.luongToiDa ?? r.LuongToiDa ?? 0),
    diemPhuHop: Number(r.diemPhuHop ?? r.DiemPhuHop ?? 0),
    diemKyNang: numOrUndefined(r.diemKyNang ?? r.DiemKyNang),
    bonusViTri: numOrUndefined(r.bonusViTri ?? r.BonusViTri),
    bonusLuong: numOrUndefined(r.bonusLuong ?? r.BonusLuong),
    bonusDiaDiem: numOrUndefined(r.bonusDiaDiem ?? r.BonusDiaDiem),
    bonusKinhNghiem: numOrUndefined(r.bonusKinhNghiem ?? r.BonusKinhNghiem),
    phatBatBuoc: numOrUndefined(r.phatBatBuoc ?? r.PhatBatBuoc),
    kyNangThoa: asList(r.kyNangThoa ?? r.KyNangThoa),
    kyNangThieu: asList(r.kyNangThieu ?? r.KyNangThieu),
    kyNangBatBuocThieu: asList(r.kyNangBatBuocThieu ?? r.KyNangBatBuocThieu),
    workMode: asText(r.workMode ?? r.WorkMode),
    level: asText(r.level ?? r.Level),
    employmentType: asText(r.employmentType ?? r.EmploymentType),
    created: asText(r.created ?? r.Created),
    soLuongUngVien: Number(r.soLuongUngVien ?? r.SoLuongUngVien ?? 0),
    kyNangs: asList(r.kyNangs ?? r.KyNangs),
    ngayHetHan: asText(r.ngayHetHan ?? r.NgayHetHan),
    lyDoGoiY: asText(r.lyDoGoiY ?? r.LyDoGoiY),
  };
}

function fmtDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d; }
}

export default function PhuHopPage() {
  const identity = useStoredIdentity();
  const isCandidate = identity?.roles.some((r) => r.trim().toUpperCase() === "UNG_VIEN") ?? false;

  return isCandidate ? <CandidatePhuHop /> : <RecruiterPhuHop />;
}

type CategoryFilter = "all" | "high" | "medium" | "low";
type WorkModeFilter = "all" | "Onsite" | "Remote" | "Hybrid" | "Flexible";
type SalaryFilter = "all" | "10" | "15" | "20" | "30";
type SortMode = "ai" | "score" | "title";

// SelectValue của base-ui không tự lấy nhãn từ item đang chọn, nên trigger cần
// nhận đúng chuỗi tiếng Việt thay vì giá trị thô ("all", "ai"…).
const CATEGORY_LABEL: Record<CategoryFilter, string> = {
  all: "Tất cả mức độ",
  high: "Cao từ 66%",
  medium: "Trung bình 33–65%",
  low: "Thấp dưới 33%",
};
const WORK_MODE_LABEL: Record<WorkModeFilter, string> = {
  all: "Mọi hình thức",
  Onsite: "Tại văn phòng",
  Remote: "Remote",
  Hybrid: "Hybrid",
  Flexible: "Linh hoạt",
};
const SALARY_LABEL: Record<SalaryFilter, string> = {
  all: "Mọi mức lương",
  "10": "Từ 10 triệu",
  "15": "Từ 15 triệu",
  "20": "Từ 20 triệu",
  "30": "Từ 30 triệu",
};
const SORT_LABEL: Record<SortMode, string> = {
  ai: "Adam xếp hạng",
  score: "Điểm cao nhất",
  title: "Tên công việc",
};

function CandidatePhuHop() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [needsCv, setNeedsCv] = useState(false);
  const [topN, setTopN] = useState(PAGE_STEP);
  const [cvs, setCvs] = useState<CvVm[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  // Lần tải đầu hiện spinner toàn khung; các lần "Xem thêm" chỉ quay nút,
  // không thay danh sách đang đọc bằng trạng thái loading.
  const hasDataRef = useRef(false);

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [workMode, setWorkMode] = useState<WorkModeFilter>("all");
  const [salaryMin, setSalaryMin] = useState<SalaryFilter>("all");
  const [locationQuery, setLocationQuery] = useState("");
  const [onlyMandatoryReady, setOnlyMandatoryReady] = useState(false);
  const [sort, setSort] = useState<SortMode>("ai");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hoSo = await hoSoApi.getMyHoSo();
        const list = await cvApi.listCvs(hoSo.id);
        if (!cancelled) setCvs(list.filter((cv) => cv.id > 0));
      } catch {
        // Chưa có hồ sơ: API gợi ý sẽ trả thông báo riêng, không cần báo lỗi kép.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    try {
      if (hasDataRef.current) setLoadingMore(true);
      setErr("");
      const query = new URLSearchParams({ topN: String(topN) });
      if (selectedCvId) query.set("cvUngVienId", String(selectedCvId));
      const res: ApiResponse<unknown> = await apiFetch(`${API}/recommendations?${query.toString()}`);
      const succeeded = ok(res);
      setNotice(msg(res));
      setNeedsCv(!succeeded);
      const d = extractData(res);
      const rawItems = succeeded && Array.isArray(d) ? d : [];
      const mapped = rawItems.map(normalizeRecommendation);
      setItems(mapped);
      hasDataRef.current = mapped.length > 0;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, [topN, selectedCvId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => {
    const minSalary = salaryMin === "all" ? 0 : Number(salaryMin) * 1_000_000;
    const location = locationQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (category === "high" && item.diemPhuHop < HIGH_SCORE) return false;
      if (category === "medium" && (item.diemPhuHop < MEDIUM_SCORE || item.diemPhuHop >= HIGH_SCORE)) return false;
      if (category === "low" && item.diemPhuHop >= MEDIUM_SCORE) return false;
      if (workMode !== "all" && item.workMode !== workMode) return false;
      if (minSalary > 0 && item.luongToiDa < minSalary) return false;
      if (location && !item.diaDiemLamViec.toLowerCase().includes(location)) return false;
      if (onlyMandatoryReady && item.kyNangBatBuocThieu.length > 0) return false;
      return true;
    });
    // "ai" giữ nguyên thứ tự API trả về vì đó đã là thứ tự DeepSeek sắp xếp lại.
    if (sort === "score") filtered.sort((a, b) => b.diemPhuHop - a.diemPhuHop);
    if (sort === "title") filtered.sort((a, b) => a.tieuDe.localeCompare(b.tieuDe, "vi"));
    return filtered;
  }, [items, category, workMode, salaryMin, locationQuery, onlyMandatoryReady, sort]);

  const total = items.length;
  const highCount = items.filter((i) => i.diemPhuHop >= HIGH_SCORE).length;
  const mandatoryReadyCount = items.filter((i) => i.kyNangBatBuocThieu.length === 0).length;
  const aiReasonCount = visibleItems.filter((item) => item.lyDoGoiY).length;
  const canLoadMore = !loading && !needsCv && items.length > 0 && items.length >= topN && topN < MAX_TOP_N;

  function handleCvChange(value: string | null) {
    const next = value === null || value === "default" ? null : Number(value);
    if (next === selectedCvId) return;
    hasDataRef.current = false;
    setLoading(true);
    setTopN(PAGE_STEP);
    setSelectedCvId(next);
  }

  const selectedCv = selectedCvId ? cvs.find((cv) => cv.id === selectedCvId) : undefined;
  const cvTriggerLabel = selectedCv
    ? (selectedCv.viTriUngTuyen || selectedCv.tenFile || `CV #${selectedCv.id}`)
    : "CV mặc định";

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Target}
        title="Việc làm phù hợp"
        description="Các tin đang tuyển được xếp hạng theo kỹ năng, vị trí, lương và địa điểm trong CV của bạn."
        actions={cvs.length > 1 ? (
          <Select value={selectedCvId ? String(selectedCvId) : "default"} onValueChange={handleCvChange}>
            <SelectTrigger className="h-9 w-52 rounded-lg px-3 text-sm" aria-label="Chọn CV để phân tích">
              <SelectValue placeholder="Chọn CV">{cvTriggerLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">CV mặc định</SelectItem>
              {cvs.map((cv) => (
                <SelectItem key={cv.id} value={String(cv.id)}>
                  {(cv.viTriUngTuyen || cv.tenFile || `CV #${cv.id}`) + (cv.isDefault ? " · mặc định" : "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : undefined}
      />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <div className="border-b border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-foreground">Dành cho bạn</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {aiReasonCount > 0
                  ? `${visibleItems.length}/${total} tin đang hiển thị · ${aiReasonCount} tin có lý do AI`
                  : `${visibleItems.length}/${total} tin đang hiển thị`}
              </p>
            </div>
            <Link href="/viec-lam" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary/50">
              Tìm thêm việc <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-primary/5 px-3 py-2">
              <p className="text-xs text-muted-foreground">Tổng gợi ý</p>
              <p className="text-xl font-semibold text-foreground">{total}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">Phù hợp cao (≥66%)</p>
              <p className="text-xl font-semibold text-emerald-700">{highCount}</p>
            </div>
            <div className="rounded-xl bg-sky-500/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">Đủ kỹ năng bắt buộc</p>
              <p className="text-xl font-semibold text-sky-700">{mandatoryReadyCount}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select value={category} onValueChange={(value) => setCategory(value as CategoryFilter)}>
              <SelectTrigger className="h-9 w-44 rounded-lg px-3 text-sm"><SelectValue placeholder="Mức độ">{CATEGORY_LABEL[category]}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="high">Cao từ 66%</SelectItem>
                <SelectItem value="medium">Trung bình 33–65%</SelectItem>
                <SelectItem value="low">Thấp dưới 33%</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workMode} onValueChange={(value) => setWorkMode(value as WorkModeFilter)}>
              <SelectTrigger className="h-9 w-40 rounded-lg px-3 text-sm"><SelectValue placeholder="Hình thức">{WORK_MODE_LABEL[workMode]}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi hình thức</SelectItem>
                <SelectItem value="Onsite">Tại văn phòng</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="Flexible">Linh hoạt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={salaryMin} onValueChange={(value) => setSalaryMin(value as SalaryFilter)}>
              <SelectTrigger className="h-9 w-36 rounded-lg px-3 text-sm"><SelectValue placeholder="Mức lương">{SALARY_LABEL[salaryMin]}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi mức lương</SelectItem>
                <SelectItem value="10">Từ 10 triệu</SelectItem>
                <SelectItem value="15">Từ 15 triệu</SelectItem>
                <SelectItem value="20">Từ 20 triệu</SelectItem>
                <SelectItem value="30">Từ 30 triệu</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="Lọc theo địa điểm…"
              className="w-48 rounded-lg text-sm"
              aria-label="Lọc theo địa điểm"
            />
            <label className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground">
              <Switch checked={onlyMandatoryReady} onCheckedChange={setOnlyMandatoryReady} aria-label="Chỉ tin đủ kỹ năng bắt buộc" />
              Đủ kỹ năng bắt buộc
            </label>
            <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
              <SelectTrigger className="h-9 w-40 rounded-lg px-3 text-sm"><SelectValue placeholder="Sắp xếp">{SORT_LABEL[sort]}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="ai">Adam xếp hạng</SelectItem>
                <SelectItem value="score">Điểm cao nhất</SelectItem>
                <SelectItem value="title">Tên công việc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <AdminLoadingState />
        ) : needsCv ? (
          <AdminEmptyState
            icon={FileText}
            title="Adam cần CV để gợi ý việc làm"
            description={notice || "Hoàn thiện hoặc chọn CV mặc định để Adam phân tích và đề xuất những cơ hội phù hợp hơn."}
            action={
              <Link href="/CV" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Hoàn thiện CV <ArrowRight className="size-4" />
              </Link>
            }
          />
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={Target}
            title="Chưa có kết quả phù hợp"
            description={notice || "Chưa có tin tuyển dụng nào đủ điểm khớp với kỹ năng trong CV của bạn."}
          />
        ) : visibleItems.length === 0 ? (
          <AdminEmptyState
            icon={Target}
            title="Bộ lọc chưa khớp tin nào"
            description="Thử bỏ bớt điều kiện lọc (mức độ, hình thức, lương, địa điểm) để xem lại toàn bộ gợi ý."
          />
        ) : (
          <div className="space-y-4 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleItems.map((item) => <MatchedJobCard key={item.tinTuyenDungId} item={item} />)}
            </div>
            {canLoadMore && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => { setLoadingMore(true); setTopN(Math.min(MAX_TOP_N, topN + PAGE_STEP)); }}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-primary transition hover:border-primary/50 disabled:opacity-60"
                >
                  {loadingMore && <Loader2 className="size-4 animate-spin" />}
                  Xem thêm việc phù hợp
                </button>
              </div>
            )}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}

function RecruiterPhuHop() {
  const [items, setItems] = useState<KetQuaPhuHop[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true); setErr("");
      const res: ApiResponse<unknown> = await apiFetch(API);
      if (!ok(res)) throw new Error(msg(res) || "Không thể tải dữ liệu");
      const d = extractData(res);
      let rawItems: unknown[] = [];
      if (Array.isArray(d)) rawItems = d;
      else if (d && typeof d === "object") {
        const obj = d as Record<string, unknown>;
        if (Array.isArray(obj.items)) rawItems = obj.items;
        else if (Array.isArray(obj.Items)) rawItems = obj.Items;
      }
      setItems(rawItems.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        return {
          id: Number(r.id ?? r.Id),
          hoSoUngVienId: Number(r.hoSoUngVienId ?? r.HoSoUngVienId ?? 0),
          tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
          diemPhuHop: Number(r.diemPhuHop ?? r.DiemPhuHop ?? 0),
          phanLoai: Number(r.phanLoai ?? r.PhanLoai ?? 1),
          created: `${r.created ?? r.Created ?? ""}`,
          hoTenUngVien: String(r.hoTenUngVien ?? r.HoTenUngVien ?? ""),
          tieuDeTinTuyenDung: String(r.tieuDeTinTuyenDung ?? r.TieuDeTinTuyenDung ?? ""),
        };
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Target} title="Ứng viên phù hợp" description="Các ứng viên được AI gợi ý phù hợp với tin tuyển dụng." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <AdminCardHeader title="Kết quả phù hợp" description={`${items.length} kết quả`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={Target} title="Chưa có kết quả phù hợp" description="Kết quả sẽ hiển thị khi có dữ liệu matching." />
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => {
              const pl = PHAN_LOAI[item.phanLoai] ?? { label: "—", variant: "secondary" as const };
              const pct = Math.round(item.diemPhuHop * 100);
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.hoTenUngVien || `Hồ sơ #${item.hoSoUngVienId}`}</span>
                      <Badge variant={pl.variant}>{pl.label}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <Link href={`/tin-tuyen-dung/${item.tinTuyenDungId}/ung-vien`} className="flex items-center gap-1 hover:text-foreground">
                        {item.tieuDeTinTuyenDung || `Tin #${item.tinTuyenDungId}`}
                        <ArrowRight className="size-3.5" />
                      </Link>
                      <span className="flex items-center gap-1"><TrendingUp className="size-3.5" /> Điểm phù hợp: {pct}%</span>
                      {item.created && <span>{fmtDate(item.created)}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-2xl font-semibold text-foreground">{pct}%</span>
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
