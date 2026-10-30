"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useGetIdentity } from "@refinedev/core";
import { ClipboardList, Plus, Pencil, Trash2, X, Send, Pause, Play, Lock, Users, CheckCircle2, Eye, Copy, Search, Briefcase, CalendarDays, FileText } from "lucide-react";
import { JobPreview, deadlineDate, SKILL_LEVELS, type JobSkill, type JobPreviewData } from "@/features/tin-tuyen-dung/job-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminPageLayout, AdminCard, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type TinTuyenDung = {
  id: number;
  danhMucNgheId: number;
  tieuDe: string;
  moTaCongViec: string;
  kinhNghiemYeuCau: string;
  yeuCauCongViec: string;
  quyenLoi: string;
  diaDiemLamViec: string;
  phuongThucLamViec: number;
  luongToiThieu: number;
  luongToiDa: number;
  trangThai: string;
  ngayHetHan: string;
  lastModified: string | null;
  kyNangs: JobSkill[];
  ghiChuKiemDuyet: string;
  ketQuaSangLoc?: string;
  nguoiDaiDienDaDuyet?: boolean;
  vaiTroNguoiDang?: string;
};

type DanhMucNghe = {
  id: number;
  tenNghe: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

// BE trả TrangThai dạng tên enum ("Nhap", "DangTuyen", ...). Giữ thêm map số để tương thích cũ.
const TRANG_THAI: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Nhap: { label: "Nháp", variant: "secondary" },
  ChoDuyetHeThong: { label: "Chờ duyệt hệ thống", variant: "outline" },
  ChoAdminDuyet: { label: "Chờ admin duyệt", variant: "default" },
  DangTuyen: { label: "Đang tuyển", variant: "default" },
  TamDung: { label: "Tạm dừng", variant: "secondary" },
  HetHan: { label: "Hết hạn", variant: "destructive" },
  DaDong: { label: "Đã đóng", variant: "secondary" },
  TuChoi: { label: "Bị từ chối", variant: "destructive" },
  BiKhoa: { label: "Bị khóa", variant: "destructive" },
  ChoNguoiDaiDienDuyet: { label: "Chờ Người đại diện duyệt", variant: "outline" },
  "0": { label: "Nháp", variant: "secondary" },
  "1": { label: "Chờ duyệt hệ thống", variant: "outline" },
  "2": { label: "Chờ admin duyệt", variant: "default" },
  "3": { label: "Đang tuyển", variant: "default" },
  "4": { label: "Tạm dừng", variant: "secondary" },
  "5": { label: "Hết hạn", variant: "destructive" },
  "6": { label: "Đã đóng", variant: "secondary" },
  "7": { label: "Bị từ chối", variant: "destructive" },
  "8": { label: "Bị khóa", variant: "destructive" },
  "9": { label: "Chờ Người đại diện duyệt", variant: "outline" },
};

// Trigger enum số của backend (Domain/Enums/TriggerTinTuyenDung.cs)
const TRIGGER = { GuiDuyet: 0, TamDungTin: 6, MoLaiTin: 7, DongTin: 9, NguoiDaiDienDuyet: 13, NguoiDaiDienTuChoi: 14 } as const;

const API = "/api/dotnet/tintuyendungs";
const DM_API = "/api/dotnet/danhmucnghes";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? false;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

const EMPTY_FORM = {
  danhMucNgheId: 0,
  tieuDe: "",
  moTaCongViec: "",
  kinhNghiemYeuCau: "",
  yeuCauCongViec: "",
  quyenLoi: "",
  diaDiemLamViec: "",
  phuongThucLamViec: -1, // -1 = chưa chọn (placeholder), 0..3 = Onsite/Remote/Hybrid/Flexible
  luongToiThieu: 0,
  luongToiDa: 0,
  ngayHetHan: "",
  kyNangs: [] as JobSkill[],
};

function fmtDate(d: string) {
  if (!d) return "—";
  try { return new Date(`${deadlineDate(d)}T12:00:00`).toLocaleDateString("vi-VN"); } catch { return d; }
}
function fmtMoney(n: number) {
  if (!n) return "Thỏa thuận";
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}
// Hiển thị số tiền có phân nhóm hàng nghìn khi nhập (25,000,000 -> 25.000.000)
function fmtMoneyInput(n: number) {
  if (!n) return "";
  return new Intl.NumberFormat("vi-VN").format(n);
}
// Bóc chữ số từ chuỗi có dấu chấm phân nhóm để lưu giá trị thô
function parseMoney(s: string): number {
  const digits = s.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function parseWorkMode(value: unknown): number {
  const text = `${value ?? ""}`.trim().toLowerCase();
  if (text === "remote") return 1;
  if (text === "hybrid") return 2;
  if (text === "flexible") return 3;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 && numeric <= 3 ? numeric : 0;
}

// Hôm nay theo giờ Việt Nam, dạng ISO (yyyy-MM-dd) để so sánh chuỗi.
function isoToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}
// "dd/MM/yyyy" -> ISO "yyyy-MM-dd". null nếu ngày không tồn tại.
function parseDdMmYyyy(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}
// ISO "yyyy-MM-dd" -> "dd/MM/yyyy"
function isoToDdMmYyyy(iso: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

export default function TinTuyenDungPage() {
  const { data: identity } = useGetIdentity<{ roles?: string[] }>();
  const isNguoiDaiDien = identity?.roles?.some(role => role.trim().toUpperCase() === "NGUOI_DAI_DIEN") ?? false;
  const [items, setItems] = useState<TinTuyenDung[]>([]);
  const [danhMucs, setDanhMucs] = useState<DanhMucNghe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firingId, setFiringId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TinTuyenDung | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [donCounts, setDonCounts] = useState<Record<number, number>>({});
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [preview, setPreview] = useState<JobPreviewData | null>(null);
  const [reviewing, setReviewing] = useState<TinTuyenDung | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errField, setErrField] = useState<string | null>(null);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillOpen, setSkillOpen] = useState(false);
  const [skillError, setSkillError] = useState("");
  const { confirm, prompt } = useConfirmDialog();

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { cache: "no-store", ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setErr("");
      const query = new URLSearchParams({ _start: String((page - 1) * 20), _end: String(page * 20), _filter: search });
      if (statusFilter !== "all") query.set("TrangThai", statusFilter);
      const res: ApiResponse<unknown> & { totalPages?: number; TotalPages?: number } = await apiFetch(`${API}?${query}`);
      setTotalPages(res.totalPages ?? res.TotalPages ?? 1);
      if (!ok(res)) throw new Error(msg(res));
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
          danhMucNgheId: Number(r.danhMucNgheId ?? r.DanhMucNgheId ?? 0),
          tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}`,
          moTaCongViec: `${r.moTaCongViec ?? r.MoTaCongViec ?? ""}`,
          kinhNghiemYeuCau: `${r.kinhNghiemYeuCau ?? r.KinhNghiemYeuCau ?? ""}`,
          yeuCauCongViec: `${r.yeuCauCongViec ?? r.YeuCauCongViec ?? ""}`,
          quyenLoi: `${r.quyenLoi ?? r.QuyenLoi ?? ""}`,
          diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}`,
          phuongThucLamViec: parseWorkMode(r.phuongThucLamViec ?? r.PhuongThucLamViec ?? r.workMode ?? r.WorkMode),
          luongToiThieu: Number(r.luongToiThieu ?? r.LuongToiThieu ?? 0),
          luongToiDa: Number(r.luongToiDa ?? r.LuongToiDa ?? 0),
          trangThai: `${r.trangThai ?? r.TrangThai ?? "Nhap"}`,
          ngayHetHan: `${r.ngayHetHan ?? r.NgayHetHan ?? ""}`,
          lastModified: (r.lastModified ?? r.LastModified ?? null) as string | null,
          kyNangs: ((r.kyNangYeuCaus ?? r.KyNangYeuCaus ?? []) as Record<string, unknown>[]).map(k => ({ kyNangId: Number(k.kyNangId ?? k.KyNangId), tenKyNang: String(k.tenKyNang ?? k.TenKyNang ?? ""), mucDoYeuCau: Number(k.mucDoYeuCau ?? k.MucDoYeuCau) })),
          ghiChuKiemDuyet: String(r.ghiChuKiemDuyet ?? r.GhiChuKiemDuyet ?? ""),
          ketQuaSangLoc: String(r.ketQuaSangLoc ?? r.KetQuaSangLoc ?? ""),
          nguoiDaiDienDaDuyet: Boolean(r.nguoiDaiDienDaDuyet ?? r.NguoiDaiDienDaDuyet),
          vaiTroNguoiDang: String(r.vaiTroNguoiDang ?? r.VaiTroNguoiDang ?? ""),
        };
      }));
      setDonCounts(Object.fromEntries(rawItems.map(v => { const r = v as Record<string, unknown>; return [Number(r.id ?? r.Id), Number(r.soLuongUngVien ?? r.SoLuongUngVien ?? 0)]; })));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, page, search, statusFilter]);

  const loadDanhMucs = useCallback(async () => {
    try {
      const res: ApiResponse<unknown> = await apiFetch(`${DM_API}?_start=0&_end=100`);
      if (!ok(res)) return;
      const d = extractData(res);
      const arr = Array.isArray(d) ? d : [];
      setDanhMucs(arr.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        return { id: Number(r.id ?? r.Id), tenNghe: `${r.tenNghe ?? r.TenNghe ?? ""}` };
      }).filter(x => x.id > 0));
    } catch {
      // Không chặn luồng chính nếu thiếu quyền danh mục
    }
  }, [apiFetch]);

  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);
  useEffect(() => {
    // Initial lookup data is fetched from the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDanhMucs();
    void (async () => {
      try {
        const options: { id: number; name: string }[] = [];
        for (let p = 0; ; p++) {
          const res = await apiFetch(`/api/dotnet/kynangs?_start=${p * 100}&_end=${(p + 1) * 100}`);
          if (!ok(res)) throw new Error(msg(res));
          const raw = extractData(res);
          if (!Array.isArray(raw) || raw.length === 0) break;
          options.push(...raw.map((k: Record<string, unknown>) => ({ id: Number(k.id ?? k.Id), name: String(k.tenKyNang ?? k.TenKyNang ?? "") })));
          const total = res.totalPages ?? res.TotalPages ?? 1;
          if (p + 1 >= total) break;
        }
        setSkills(options);
      } catch (error) { setErr(error instanceof Error ? error.message : "Không tải được danh sách kỹ năng."); }
    })();
  }, [apiFetch, loadDanhMucs]);

  function resetForm() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setErrField(null);
    setShowForm(false);
    setSkillQuery("");
    setSkillOpen(false);
    setSkillError("");
  }

  function openCreate() { setSuccessMsg(""); setErr(""); setErrField(null); setEditing(null); setForm({ ...EMPTY_FORM }); setSkillQuery(""); setSkillOpen(false); setSkillError(""); setShowForm(true); }
  function openEdit(item: TinTuyenDung) {
    setSuccessMsg(""); setErr(""); setErrField(null); setSkillQuery(""); setSkillOpen(false); setSkillError(""); setEditing(item);
    setForm({
      danhMucNgheId: item.danhMucNgheId,
      tieuDe: item.tieuDe,
      moTaCongViec: item.moTaCongViec,
      kinhNghiemYeuCau: item.kinhNghiemYeuCau,
      yeuCauCongViec: item.yeuCauCongViec,
      quyenLoi: item.quyenLoi,
      diaDiemLamViec: item.diaDiemLamViec,
      phuongThucLamViec: item.phuongThucLamViec,
      luongToiThieu: item.luongToiThieu,
      luongToiDa: item.luongToiDa,
      ngayHetHan: isoToDdMmYyyy(deadlineDate(item.ngayHetHan)),
      kyNangs: item.kyNangs,
    });
    setShowForm(true);
  }

  function validate(submit = false): { field: string | null; message: string } {
    if (!form.tieuDe.trim()) return { field: "tieuDe", message: "Tiêu đề không được để trống" };
    if (!form.danhMucNgheId || form.danhMucNgheId <= 0) return { field: "danhMucNgheId", message: "Vui lòng chọn danh mục nghề" };
    if (form.phuongThucLamViec < 0) return { field: "phuongThucLamViec", message: "Vui lòng chọn phương thức làm việc" };
    if (submit && !form.moTaCongViec.trim()) return { field: "moTaCongViec", message: "Cần mô tả công việc trước khi gửi duyệt" };
    if (submit && !form.yeuCauCongViec.trim()) return { field: "yeuCauCongViec", message: "Cần yêu cầu công việc trước khi gửi duyệt" };
    if (submit && !form.diaDiemLamViec.trim()) return { field: "diaDiemLamViec", message: "Cần địa điểm trước khi gửi duyệt" };
    if (form.tieuDe.length > 255 || form.diaDiemLamViec.length > 255) return { field: "tieuDe", message: "Tiêu đề và địa điểm tối đa 255 ký tự" };
    if (form.kinhNghiemYeuCau.length > 2000 || form.quyenLoi.length > 2000) return { field: "kinhNghiemYeuCau", message: "Kinh nghiệm và quyền lợi tối đa 2000 ký tự" };
    if (form.moTaCongViec.length > 5000 || form.yeuCauCongViec.length > 5000) return { field: "moTaCongViec", message: "Mô tả và yêu cầu công việc tối đa 5000 ký tự" };
    // Client-side date guard: chặn ngày quá khứ ngay khi lưu (cả nháp lẫn gửi duyệt).
    if (form.ngayHetHan) {
      const iso = parseDdMmYyyy(form.ngayHetHan);
      if (!iso) return { field: "ngayHetHan", message: "Ngày hết hạn không hợp lệ (định dạng dd/MM/yyyy)" };
      if (iso < isoToday()) return { field: "ngayHetHan", message: "Ngày hết hạn phải từ hôm nay trở đi" };
    }
    if (form.luongToiThieu < 0 || form.luongToiDa < 0) return { field: "luong", message: "Lương phải >= 0" };
    if (form.luongToiDa < form.luongToiThieu) return { field: "luong", message: "Lương tối đa phải >= lương tối thiểu" };
    return { field: null, message: "" };
  }

  function addSkill(skill: { id: number; name: string }) {
    if (form.kyNangs.some(k => k.kyNangId === skill.id)) return;
    setForm(f => ({ ...f, kyNangs: [...f.kyNangs, { kyNangId: skill.id, tenKyNang: skill.name, mucDoYeuCau: 2 }] }));
    setSkillQuery("");
    setSkillOpen(false);
    setSkillError("");
  }

  // Thử tạo kỹ năng mới qua API hiện có; HR/NDD không có quyền create sẽ nhận 403.
  async function createSkill(name: string) {
    const existing = skills.find(s => s.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) { addSkill(existing); return; }
    if (!name.trim()) return;
    try {
      setSkillError("");
      const res: ApiResponse<number> = await apiFetch("/api/dotnet/kynangs", {
        method: "POST",
        body: JSON.stringify({ tenKyNang: name.trim() }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không tạo được kỹ năng mới.");
      const newId = Number(extractData(res) ?? 0);
      if (!newId) throw new Error("Máy chủ không trả về ID kỹ năng.");
      setSkills(prev => (prev.some(s => s.id === newId) ? prev : [...prev, { id: newId, name: name.trim() }]));
      addSkill({ id: newId, name: name.trim() });
    } catch (e) {
      const detail = e instanceof Error ? e.message : "";
      setSkillError(
        /403|forbidden|quyền/i.test(detail)
          ? `Kỹ năng "${name.trim()}" chưa có trong kho và tài khoản của bạn chưa được quyền tạo mới. Hãy chọn kỹ năng gợi ý hoặc báo Admin thêm vào danh mục.`
          : detail || `Không tạo được kỹ năng "${name.trim()}".`,
      );
      setSkillOpen(false);
    }
  }

  async function handleSubmit(e?: FormEvent, submit = false) {
    e?.preventDefault();
    if (saving) return;
    const validation = validate(submit);
    if (validation.field) {
      setErr(validation.message); setErrField(validation.field);
      const ids: Record<string, string> = { tieuDe: "ttd-tieu-de", danhMucNgheId: "ttd-danh-muc", phuongThucLamViec: "ttd-phuong-thuc", diaDiemLamViec: "ttd-dia-diem", moTaCongViec: "ttd-mo-ta", yeuCauCongViec: "ttd-yeu-cau", ngayHetHan: "ttd-het-han", kinhNghiemYeuCau: "ttd-kinh-nghiem", luong: "ttd-luong-min" };
      document.getElementById(ids[validation.field])?.focus(); return;
    }
    try {
      setSaving(true); setErr(""); setErrField(null); setSuccessMsg("");
      const isEditing = editing !== null;
      const url = isEditing ? `${API}/${editing.id}` : API;
      const body = isEditing
        ? {
            id: editing.id,
            danhMucNgheId: Number(form.danhMucNgheId),
            tieuDe: form.tieuDe.trim(),
            moTaCongViec: form.moTaCongViec.trim(),
            kinhNghiemYeuCau: form.kinhNghiemYeuCau.trim(),
            yeuCauCongViec: form.yeuCauCongViec.trim(),
            quyenLoi: form.quyenLoi.trim(),
            diaDiemLamViec: form.diaDiemLamViec.trim(),
            phuongThucLamViec: Number(form.phuongThucLamViec),
            luongToiThieu: Number(form.luongToiThieu),
            luongToiDa: Number(form.luongToiDa),
            ngayHetHan: form.ngayHetHan ? parseDdMmYyyy(form.ngayHetHan) : null,
          }
        : {
            danhMucNgheId: Number(form.danhMucNgheId),
            tieuDe: form.tieuDe.trim(),
            moTaCongViec: form.moTaCongViec.trim(),
            kinhNghiemYeuCau: form.kinhNghiemYeuCau.trim(),
            yeuCauCongViec: form.yeuCauCongViec.trim(),
            quyenLoi: form.quyenLoi.trim(),
            diaDiemLamViec: form.diaDiemLamViec.trim(),
            phuongThucLamViec: Number(form.phuongThucLamViec),
            luongToiThieu: Number(form.luongToiThieu),
            luongToiDa: Number(form.luongToiDa),
            ngayHetHan: form.ngayHetHan ? parseDdMmYyyy(form.ngayHetHan) : null,
          };
      const res: ApiResponse<unknown> = await apiFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify({ ...body, kyNangs: form.kyNangs.map(({ kyNangId, mucDoYeuCau }) => ({ kyNangId, mucDoYeuCau })), expectedLastModified: editing?.lastModified }) });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu");
      let resultMessage = msg(res);
      if (submit) {
        const id = Number(extractData(res));
        setEditing({ ...form, id, lastModified: null, trangThai: "Nhap", ghiChuKiemDuyet: "" });
        const detailRes = await apiFetch(`${API}/show/${id}`);
        if (!ok(detailRes)) throw new Error(msg(detailRes));
        const detail = extractData(detailRes) as Record<string, unknown>;
        const version = (detail.lastModified ?? detail.LastModified ?? null) as string | null;
        // Preserve the saved ID if moderation fails, so retry updates instead of creating duplicates.
        setEditing({ ...form, id, lastModified: version, ngayHetHan: String(detail.ngayHetHan ?? detail.NgayHetHan ?? ""), trangThai: "Nhap", ghiChuKiemDuyet: "" });
        const fireRes = await apiFetch(`${API}/${id}/fire`, { method: "POST", body: JSON.stringify({ id, trigger: TRIGGER.GuiDuyet, ghiChu: "Gửi duyệt từ form đăng tin", expectedLastModified: version }) });
        if (!ok(fireRes)) throw new Error(msg(fireRes));
        resultMessage = msg(fireRes);
      }
      setSuccessMsg(resultMessage || "Đã lưu nháp.");
      resetForm(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Không thể lưu"); } finally { setSaving(false); }
  }

  async function handleFire(item: TinTuyenDung, trigger: number, label: string, confirmMsg?: string) {
    let note = `${label} từ trang quản lý tin`;
    if (trigger === TRIGGER.NguoiDaiDienTuChoi) {
      const reason = await prompt({ title: "Lý do từ chối", description: "Giúp nhân sự biết nội dung cần sửa.", confirmLabel: "Từ chối" });
      if (!reason?.trim()) return;
      note = reason.trim();
    }
    const confirmed = await confirm({
      title: `${label} tin?`,
      description: confirmMsg ?? `${label} tin "${item.tieuDe}"?`,
      confirmLabel: label,
      destructive: trigger === TRIGGER.NguoiDaiDienTuChoi || trigger === TRIGGER.DongTin,
    });
    if (!confirmed) return;
    try {
      setFiringId(item.id); setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}/fire`, {
        method: "POST",
        body: JSON.stringify({ id: item.id, trigger, ghiChu: note, expectedLastModified: item.lastModified }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể cập nhật trạng thái");
      // Backend trả về kết quả funnel (pass/vùng xám/từ chối) trong Message — ưu tiên hiển thị nó.
      setSuccessMsg(msg(res) || `Đã ${label.toLowerCase()} tin.`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Không thể cập nhật trạng thái"); } finally { setFiringId(null); }
  }

  async function handleDelete(item: TinTuyenDung) {
    const confirmed = await confirm({
      title: "Xóa tin tuyển dụng?",
      description: `Xóa tin "${item.tieuDe}"? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}?expectedLastModified=${encodeURIComponent(item.lastModified ?? "")}`, { method: "DELETE" });
      if (!ok(res)) throw new Error(msg(res));
      setSuccessMsg("Xóa thành công."); if (editing?.id === item.id) resetForm(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Không thể xóa"); }
  }

  const filtered = items.filter(i => !search.trim() || i.tieuDe.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Quản lý tin tuyển dụng</h1>
        {isNguoiDaiDien && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setStatusFilter("ChoNguoiDaiDienDuyet"); setPage(1); }}>
            Chờ tôi duyệt
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Trạng thái:</span>
        <Select value={statusFilter} onValueChange={value => { setStatusFilter(value ?? "all"); setPage(1); }}>
          <SelectTrigger aria-label="Lọc trạng thái" className="h-9 w-auto rounded-full px-4 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ({items.length})</SelectItem>
            {Object.entries(TRANG_THAI).filter(([key]) => !/^\d+$/.test(key)).map(([key, state]) => <SelectItem key={key} value={key}>{state.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Tìm tin tuyển dụng" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tin..." className="h-9 rounded-xl pl-9" />
        </div>
      </div>

      {successMsg && <div role="status" className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>}
      {err && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      {showForm && (
        <form noValidate onSubmit={e => void handleSubmit(e)} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-foreground">{editing ? "Chỉnh sửa tin tuyển dụng" : "Tạo tin tuyển dụng mới"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tin Nhân sự cần Người đại diện đồng ý trước khi hệ thống lọc. Tin Người đại diện đi thẳng đến bộ lọc. OK thì công khai; vi phạm/nghi vấn thì Admin quyết định.</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={resetForm}><X className="size-4" /></Button>
          </div>
          {errField && <p id="ttd-field-error" role="alert" className="text-sm text-destructive">{err}</p>}

          {/* Card 1: Thông tin vị trí tuyển dụng */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Briefcase className="size-4 text-[#355C8C]" /> Thông tin vị trí tuyển dụng
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ttd-tieu-de">Tiêu đề *</Label>
                 <Input id="ttd-tieu-de" aria-invalid={errField === "tieuDe"} value={form.tieuDe} maxLength={255} onChange={e => setForm(f => ({ ...f, tieuDe: e.target.value }))} required placeholder="VD: Senior Frontend Developer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ttd-danh-muc">Danh mục nghề *</Label>
                <Select value={form.danhMucNgheId > 0 ? String(form.danhMucNgheId) : ""} onValueChange={value => setForm(f => ({ ...f, danhMucNgheId: Number(value) }))}>
                  <SelectTrigger id="ttd-danh-muc" aria-invalid={errField === "danhMucNgheId"} className="h-10 w-full"><SelectValue placeholder="-- Chọn danh mục --" /></SelectTrigger>
                  <SelectContent>
                    {danhMucs.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.tenNghe}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ttd-phuong-thuc">Phương thức làm việc *</Label>
                <Select value={form.phuongThucLamViec >= 0 ? String(form.phuongThucLamViec) : ""} onValueChange={value => setForm(f => ({ ...f, phuongThucLamViec: Number(value) }))}>
                  <SelectTrigger id="ttd-phuong-thuc" aria-invalid={errField === "phuongThucLamViec"} className="h-10 w-full"><SelectValue placeholder="-- Chọn phương thức --" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Onsite</SelectItem>
                    <SelectItem value="1">Remote</SelectItem>
                    <SelectItem value="2">Hybrid</SelectItem>
                    <SelectItem value="3">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ttd-dia-diem">Địa điểm *</Label>
                 <Input id="ttd-dia-diem" aria-invalid={errField === "diaDiemLamViec"} value={form.diaDiemLamViec} maxLength={255} onChange={e => setForm(f => ({ ...f, diaDiemLamViec: e.target.value }))} required placeholder="VD: Hà Nội, TP. Hồ Chí Minh" />
              </div>
            </div>
          </section>

          {/* Card 2: Thời gian & đãi ngộ */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="size-4 text-[#355C8C]" /> Thời gian &amp; đãi ngộ
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ttd-het-han">Ngày hết hạn</Label>
                <Input
                  id="ttd-het-han"
                  aria-invalid={errField === "ngayHetHan"}
                  inputMode="numeric"
                  maxLength={10}
                  value={form.ngayHetHan}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
                    setForm(f => ({ ...f, ngayHetHan: parts.join("/") }));
                  }}
                  placeholder="DD/MM/YYYY"
                />
                <p className="text-xs text-muted-foreground">Không chọn ngày quá khứ. Nhận hồ sơ đến hết ngày đã chọn theo giờ Việt Nam.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ttd-luong-min">Lương tối thiểu (VND)</Label>
                <Input
                  id="ttd-luong-min"
                  aria-invalid={errField === "luong"}
                  inputMode="numeric"
                  value={fmtMoneyInput(form.luongToiThieu)}
                  onChange={e => setForm(f => ({ ...f, luongToiThieu: parseMoney(e.target.value) }))}
                  placeholder="VD: 10.000.000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ttd-luong-max">Lương tối đa (VND)</Label>
                <Input
                  id="ttd-luong-max"
                  aria-invalid={errField === "luong"}
                  inputMode="numeric"
                  value={fmtMoneyInput(form.luongToiDa)}
                  onChange={e => setForm(f => ({ ...f, luongToiDa: parseMoney(e.target.value) }))}
                  placeholder="VD: 20.000.000"
                />
              </div>
            </div>
          </section>

          {/* Card 3: Nội dung chi tiết */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="size-4 text-[#355C8C]" /> Nội dung chi tiết
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ttd-mo-ta">Mô tả công việc *</Label>
                <textarea id="ttd-mo-ta" aria-invalid={errField === "moTaCongViec"} value={form.moTaCongViec} onChange={e => setForm(f => ({ ...f, moTaCongViec: e.target.value }))} rows={4} maxLength={5000} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Mô tả trách nhiệm, công việc hằng ngày..." />
                <div className="flex justify-end"><span className="text-xs text-muted-foreground">{form.moTaCongViec.length}/5000 ký tự</span></div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ttd-yeu-cau">Yêu cầu công việc *</Label>
                <textarea id="ttd-yeu-cau" aria-invalid={errField === "yeuCauCongViec"} value={form.yeuCauCongViec} onChange={e => setForm(f => ({ ...f, yeuCauCongViec: e.target.value }))} rows={4} maxLength={5000} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Yêu cầu kỹ năng, bằng cấp..." />
                <div className="flex justify-end"><span className="text-xs text-muted-foreground">{form.yeuCauCongViec.length}/5000 ký tự</span></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ttd-kinh-nghiem">Kinh nghiệm yêu cầu</Label>
                <textarea id="ttd-kinh-nghiem" value={form.kinhNghiemYeuCau} onChange={e => setForm(f => ({ ...f, kinhNghiemYeuCau: e.target.value }))} rows={2} maxLength={2000} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="VD: 2+ năm kinh nghiệm React..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ttd-quyen-loi">Quyền lợi</Label>
                <textarea id="ttd-quyen-loi" value={form.quyenLoi} onChange={e => setForm(f => ({ ...f, quyenLoi: e.target.value }))} rows={2} maxLength={2000} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="VD: Bảo hiểm, thưởng tháng 13..." />
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <div className="space-y-2">
                <Label htmlFor="ttd-ky-nang">Kỹ năng yêu cầu</Label>
                <div className="relative">
                  <Input
                    id="ttd-ky-nang"
                    value={skillQuery}
                    placeholder="Gõ hoặc chọn kỹ năng (VD: React, Kubernetes...)"
                    onChange={e => { setSkillQuery(e.target.value); setSkillOpen(true); setSkillError(""); }}
                    onFocus={() => setSkillOpen(true)}
                    onBlur={() => setSkillOpen(false)}
                    onKeyDown={e => {
                      if (e.key === "Escape") { setSkillOpen(false); return; }
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const q = skillQuery.trim();
                      if (!q) return;
                      const exact = skills.find(s => s.name.trim().toLowerCase() === q.toLowerCase());
                      if (exact) addSkill(exact);
                      else void createSkill(q);
                    }}
                  />
                  {skillOpen && (() => {
                    const q = skillQuery.trim().toLowerCase();
                    const matched = skills.filter(s => !form.kyNangs.some(k => k.kyNangId === s.id) && (!q || s.name.toLowerCase().includes(q)));
                    const exact = !!q && skills.some(s => s.name.trim().toLowerCase() === q);
                    return (
                      <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg">
                        {matched.length === 0 && !q && (
                          <li className="px-3 py-2 text-sm text-muted-foreground">Chưa có kỹ năng nào trong kho.</li>
                        )}
                        {matched.slice(0, 50).map(s => (
                          <li key={s.id}>
                            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => addSkill(s)} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted">
                              {s.name}
                            </button>
                          </li>
                        ))}
                        {q && !exact && (
                          <li>
                            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => void createSkill(skillQuery.trim())} className="w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted">
                              ＋ Thêm mới &quot;{skillQuery.trim()}&quot;
                            </button>
                          </li>
                        )}
                      </ul>
                    );
                  })()}
                </div>
                {skillError && <p role="alert" className="text-xs text-destructive">{skillError}</p>}
                <div className="space-y-2">
                  {form.kyNangs.map(skill => <div key={skill.kyNangId} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                    <span className="flex-1 text-sm">{skill.tenKyNang || skills.find(s => s.id === skill.kyNangId)?.name}</span>
                    <Select value={String(skill.mucDoYeuCau)} onValueChange={value => setForm(f => ({ ...f, kyNangs: f.kyNangs.map(k => k.kyNangId === skill.kyNangId ? { ...k, mucDoYeuCau: Number(value) } : k) }))}>
                      <SelectTrigger aria-label={`Mức độ yêu cầu ${skill.tenKyNang}`} className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>{SKILL_LEVELS.map((label, i) => <SelectItem key={i} value={String(i)}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" aria-label={`Bỏ kỹ năng ${skill.tenKyNang}`} onClick={() => setForm(f => ({ ...f, kyNangs: f.kyNangs.filter(k => k.kyNangId !== skill.kyNangId) }))}><X className="size-4" /></Button>
                  </div>)}
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Hủy</Button>
            <Button type="button" variant="outline" onClick={() => { setReviewing(null); setPreview(form); }} disabled={saving}><Eye className="size-4" /> Xem trước</Button>
            <Button type="submit" variant="outline" disabled={saving}>{saving ? "Đang xử lý..." : "Lưu nháp"}</Button>
            <Button type="button" disabled={saving} onClick={() => void handleSubmit(undefined, true)}><Send className="size-4" /> Lưu và gửi duyệt</Button>
          </div>
        </form>
      )}

      <AdminCard>
        {!loading && !err && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Danh sách tin đăng ({filtered.length})</h2>
            <Button size="sm" className="rounded-full" onClick={openCreate}><Plus className="size-3.5" /> Tạo tin mới</Button>
          </div>
        )}
        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <AdminEmptyState
            icon={ClipboardList}
            title={search || statusFilter !== "all" ? "Không tìm thấy tin tuyển dụng" : "Chưa có tin tuyển dụng"}
            description={search || statusFilter !== "all" ? "Thử thay đổi từ khóa hoặc bộ lọc trạng thái." : "Bắt đầu đăng tin tuyển dụng đầu tiên để thu hút và tiếp cận ứng viên."}
            action={!search && statusFilter === "all" ? <Button size="sm" className="rounded-full" onClick={openCreate}><Plus className="size-4" /> Tạo tin tuyển dụng</Button> : undefined}
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(item => {
              const st = TRANG_THAI[item.trangThai] ?? { label: item.trangThai, variant: "secondary" as const };
              const busy = firingId === item.id;
              // Gửi duyệt hiện cho cả Nhân sự lẫn Người đại diện (fallback khi auto-duyệt
              // lúc tạo/sửa thất bại — tránh tin chết ở Nháp mà không gửi lại được).
               const canEditDraft = ["Nhap", "0", "TuChoi", "7"].includes(item.trangThai);
               const canGuiDuyet = canEditDraft || ["ChoDuyetHeThong", "1"].includes(item.trangThai);
              const isDangTuyen = item.trangThai === "DangTuyen" || item.trangThai === "3";
              const isTamDung = item.trangThai === "TamDung" || item.trangThai === "4";
              // Tin nhân sự đăng đã qua funnel, chờ chủ doanh nghiệp duyệt — chỉ NDD thấy nút.
              const choNguoiDaiDienDuyet = isNguoiDaiDien && (item.trangThai === "ChoNguoiDaiDienDuyet" || item.trangThai === "9");
              return (
                <div key={item.id} className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{item.tieuDe}</h3>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    {item.trangThai === "TuChoi" && <p className="mt-2 text-sm text-destructive">{item.ghiChuKiemDuyet}</p>}
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      {item.diaDiemLamViec && <span>{item.diaDiemLamViec}</span>}
                      <span>{fmtMoney(item.luongToiThieu)} — {fmtMoney(item.luongToiDa)}</span>
                      {item.ngayHetHan && <span>Hết hạn: {fmtDate(item.ngayHetHan)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => { setReviewing(choNguoiDaiDienDuyet ? item : null); setPreview(item); }}><Eye className="size-4" /> {choNguoiDaiDienDuyet ? "Xem và duyệt" : "Chi tiết"}</Button>
                    <Link
                      href={`/tin-tuyen-dung/${item.id}/ung-vien`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
                    >
                      <Users className="size-4" /> {donCounts[item.id] ?? 0} ứng viên
                    </Link>
                    {canGuiDuyet && (
                      <Button variant="default" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.GuiDuyet, "Gửi duyệt")}><Send className="size-4" /> Gửi duyệt</Button>
                    )}
                    {isDangTuyen && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.TamDungTin, "Tạm dừng")}><Pause className="size-4" /> Tạm dừng</Button>
                    )}
                    {isTamDung && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.MoLaiTin, "Gửi duyệt mở lại", "Tin Nhân sự cần Người đại diện đồng ý, sau đó hệ thống lọc: OK thì công khai, vi phạm thì chuyển Admin.")}><Play className="size-4" /> Gửi duyệt mở lại</Button>
                    )}
                    {(isDangTuyen || isTamDung) && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.DongTin, "Đóng tin", `Đóng tin "${item.tieuDe}"? Tin đã đóng không mở lại được.`)}><Lock className="size-4" /> Đóng tin</Button>
                    )}
                    {(canEditDraft || isTamDung) && <Button variant="outline" size="sm" disabled={busy} onClick={() => openEdit(item)}><Pencil className="size-4" /> Sửa</Button>}
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => { openEdit(item); setEditing(null); setForm(f => ({ ...f, tieuDe: `${item.tieuDe} (bản sao)`.slice(0, 255), ngayHetHan: "" })); }}><Copy className="size-4" /> Sao chép</Button>
                    {canEditDraft && (donCounts[item.id] ?? 0) === 0 && <Button variant="ghost" size="sm" disabled={busy} className="text-destructive hover:text-destructive" aria-label={`Xóa nháp: ${item.tieuDe}`} onClick={() => void handleDelete(item)}><Trash2 className="size-4" /></Button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
      <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Trang trước</Button><span className="text-sm text-muted-foreground">Trang {page} / {Math.max(totalPages, 1)}</span><Button variant="outline" disabled={loading || page >= totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</Button></div>
      <JobPreview data={preview} onClose={() => { setPreview(null); setReviewing(null); }} actions={reviewing && isNguoiDaiDien ? <>
        <Button variant="outline" onClick={() => { setPreview(null); setReviewing(null); void handleFire(reviewing, TRIGGER.NguoiDaiDienTuChoi, "Từ chối"); }}>Từ chối</Button>
        <Button onClick={() => { setPreview(null); setReviewing(null); void handleFire(reviewing, TRIGGER.NguoiDaiDienDuyet, "Đồng ý và chạy bộ lọc", "Sau khi bạn đồng ý, hệ thống mới lọc: OK thì công khai, vi phạm hoặc nghi vấn thì chuyển Admin duyệt tay."); }}><CheckCircle2 className="size-4" /> Đồng ý và chạy bộ lọc</Button>
      </> : undefined} />
    </AdminPageLayout>
  );
}
