"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Briefcase, Trash2, RotateCcw, Search, CheckCircle2, XCircle, Ban } from "lucide-react";
import { AdminGate } from "@/features/admin/AdminGate";
import { adminApi, TRIGGER_TIN } from "@/features/admin/api";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { JobPreview, type JobPreviewData } from "@/features/tin-tuyen-dung/job-preview";

interface TinRow {
  Id: number;
  TieuDe: string;
  DiaDiemLamViec?: string | null;
  LuongToiThieu: number;
  LuongToiDa: number;
  TrangThai: string;
  NgayHetHan?: string | null;
  NguoiDangTinId: number;
  DoanhNghiepId: number;
  LastModified?: string;
  NguoiDaiDienDaDuyet?: boolean;
  VaiTroNguoiDang?: string;
}

// Display labels + badge variants for the 9 real TrangThaiTinTuyenDung
// values (0 Nhap … 8 BiKhoa). Backend strings untouched.
const TIN_TRANG_THAI: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Nhap: { label: "Nháp", variant: "outline" },
  ChoDuyetHeThong: { label: "Chờ duyệt hệ thống", variant: "secondary" },
  ChoAdminDuyet: { label: "Chờ admin duyệt", variant: "secondary" },
  DangTuyen: { label: "Đang tuyển", variant: "default" },
  TamDung: { label: "Tạm dừng", variant: "outline" },
  HetHan: { label: "Hết hạn", variant: "secondary" },
  DaDong: { label: "Đã đóng", variant: "secondary" },
  TuChoi: { label: "Bị từ chối", variant: "destructive" },
  BiKhoa: { label: "Bị khóa", variant: "destructive" },
  ChoNguoiDaiDienDuyet: { label: "Chờ Người đại diện duyệt", variant: "outline" },
};

export default function AdminTinTuyenDungPage() {
  const [rows, setRows] = useState<TinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [preview, setPreview] = useState<JobPreviewData | null>(null);
  const [reviewing, setReviewing] = useState<TinRow | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ChoAdminDuyet");
  const { confirm, prompt } = useConfirmDialog();

  const fetchRows = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.list<Record<string, unknown>>("/tintuyendungs", { _filter: kw, _start: (page - 1) * 20, _end: page * 20, TrangThai: statusFilter });
      setRows(Array.isArray(data) ? data.map(r => ({
        Id: Number(r.Id ?? r.id), TieuDe: String(r.TieuDe ?? r.tieuDe ?? ""),
        TrangThai: String(r.TrangThai ?? r.trangThai ?? ""), DoanhNghiepId: Number(r.DoanhNghiepId ?? r.doanhNghiepId),
        NguoiDangTinId: Number(r.NguoiDangTinId ?? r.nguoiDangTinId),
        LuongToiThieu: Number(r.LuongToiThieu ?? r.luongToiThieu), LuongToiDa: Number(r.LuongToiDa ?? r.luongToiDa),
        LastModified: (r.LastModified ?? r.lastModified) as string | undefined,
        NguoiDaiDienDaDuyet: Boolean(r.NguoiDaiDienDaDuyet ?? r.nguoiDaiDienDaDuyet),
        VaiTroNguoiDang: String(r.VaiTroNguoiDang ?? r.vaiTroNguoiDang ?? ""),
      })) : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRows(filter || undefined);
  }, [fetchRows, filter]);

  const showDetail = async (row: TinRow) => {
    try {
      const r = await adminApi.get<Record<string, unknown>>(`/tintuyendungs/show/${row.Id}`);
      const get = (key: string) => r[key] ?? r[key[0].toUpperCase() + key.slice(1)];
      setReviewing({ ...row, TrangThai: String(get("trangThai") ?? row.TrangThai),
        LastModified: get("lastModified") as string | undefined,
        NguoiDaiDienDaDuyet: Boolean(get("nguoiDaiDienDaDuyet")), VaiTroNguoiDang: String(get("vaiTroNguoiDang") ?? "") });
      setPreview({ tieuDe: String(get("tieuDe") ?? ""), moTaCongViec: String(get("moTaCongViec") ?? ""),
        yeuCauCongViec: String(get("yeuCauCongViec") ?? ""), kinhNghiemYeuCau: String(get("kinhNghiemYeuCau") ?? ""),
        quyenLoi: String(get("quyenLoi") ?? ""), diaDiemLamViec: String(get("diaDiemLamViec") ?? ""),
        luongToiThieu: Number(get("luongToiThieu") ?? 0), luongToiDa: Number(get("luongToiDa") ?? 0),
        ghiChuKiemDuyet: String(get("ghiChuKiemDuyet") ?? ""),
        ketQuaSangLoc: String(get("ketQuaSangLoc") ?? ""), nguoiDaiDienDaDuyet: Boolean(get("nguoiDaiDienDaDuyet")),
        vaiTroNguoiDang: String(get("vaiTroNguoiDang") ?? ""),
        kyNangs: ((get("kyNangYeuCaus") ?? []) as Record<string, unknown>[]).map(k => ({ kyNangId: Number(k.KyNangId ?? k.kyNangId), tenKyNang: String(k.TenKyNang ?? k.tenKyNang), mucDoYeuCau: Number(k.MucDoYeuCau ?? k.mucDoYeuCau) })) });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không tải được chi tiết tin."); }
  };

  const handleFire = async (row: TinRow, trigger: number, label: string) => {
    let note = `${label} bởi quản trị viên`;
    if (trigger === TRIGGER_TIN.AdminTuChoi || trigger === TRIGGER_TIN.AdminCuongCheKhoa) {
      const reason = await prompt({ title: `Lý do ${label.toLowerCase()}`, description: "Nêu nội dung cần sửa hoặc vi phạm của tin.", confirmLabel: label });
      if (!reason?.trim()) return;
      note = reason.trim();
    }
    const confirmed = await confirm({
      title: `${label} tin?`,
      description: `${label} tin "${row.TieuDe}"?`,
      confirmLabel: label,
      destructive: trigger === TRIGGER_TIN.AdminTuChoi || trigger === TRIGGER_TIN.AdminCuongCheKhoa,
    });
    if (!confirmed) return;
    setBusyId(row.Id);
    try {
      await adminApi.post(`/tintuyendungs/${row.Id}/fire`, {
        id: row.Id,
        trigger,
        ghiChu: note,
        expectedLastModified: row.LastModified,
      });
      const updated = await adminApi.get<Record<string, unknown>>(`/tintuyendungs/show/${row.Id}`);
      const actualState = String(updated.TrangThai ?? updated.trangThai ?? "");
      if (trigger === TRIGGER_TIN.AdminDuyet && actualState !== "DangTuyen")
        toast.error(`Tin chưa được công khai. ${String(updated.KetQuaSangLoc ?? updated.ketQuaSangLoc ?? "Bộ lọc hoặc trạng thái duyệt không cho phép.")}`);
      else toast.success(`Đã ${label.toLowerCase()} tin`);
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row: TinRow) => {
    const confirmed = await confirm({
      title: "Xóa tin tuyển dụng?",
      description: `Xóa bản nháp "${row.TieuDe}"? Tin có đơn ứng tuyển không được xóa.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyId(row.Id);
    try {
      await adminApi.remove(`/tintuyendungs/${row.Id}?expectedLastModified=${encodeURIComponent(row.LastModified ?? "")}`);
      toast.success("Đã xóa tin tuyển dụng");
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminGate>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Briefcase className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Quản trị tin tuyển dụng</h1>
              <p className="text-sm text-muted-foreground">Chỉ xử lý tin bị bộ lọc gắn cờ sau bước Người đại diện. Admin tự quyết định duyệt tay hoặc từ chối.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void fetchRows(filter || undefined)}>
            <RotateCcw className="mr-2 size-4" /> Tải lại
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void fetchRows(filter || undefined);
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  aria-label="Tìm tin tuyển dụng"
                  placeholder="Tìm theo tiêu đề..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <select aria-label="Lọc trạng thái tin" className="rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{Object.entries(TIN_TRANG_THAI).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select>
              <Button type="submit" variant="secondary">Tìm</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Id</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Doanh nghiệp</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const busy = busyId === row.Id;
                      const st = TIN_TRANG_THAI[row.TrangThai] ?? { label: row.TrangThai, variant: "secondary" as const };
                      return (
                        <TableRow key={row.Id}>
                          <TableCell>{row.Id}</TableCell>
                           <TableCell className="max-w-[280px] truncate font-medium"><button type="button" className="text-left text-primary underline-offset-4 hover:underline" onClick={() => void showDetail(row)}>{row.TieuDe}</button></TableCell>
                          <TableCell>
                            <Badge variant={st.variant}>
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell>#{row.DoanhNghiepId}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="outline" size="sm" disabled={busy} onClick={() => void showDetail(row)}>{row.TrangThai === "ChoAdminDuyet" ? "Xem và duyệt" : "Chi tiết"}</Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Cưỡng chế khóa (vi phạm)"
                                disabled={busy || !["DangTuyen", "TamDung"].includes(row.TrangThai)}
                                className="text-destructive"
                                onClick={() => void handleFire(row, TRIGGER_TIN.AdminCuongCheKhoa, "Cưỡng chế khóa")}
                              >
                                <Ban className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Xóa tin"
                                disabled={busy || !["Nhap", "TuChoi"].includes(row.TrangThai)}
                                className="text-destructive"
                                onClick={() => void handleDelete(row)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Trang trước</Button><span className="self-center text-sm">Trang {page}</span><Button variant="outline" disabled={loading || rows.length < 20} onClick={() => setPage(p => p + 1)}>Trang sau</Button></div>
        <JobPreview data={preview} onClose={() => { setPreview(null); setReviewing(null); }} actions={reviewing?.TrangThai === "ChoAdminDuyet" ? <>
          <Button variant="outline" disabled={busyId !== null} onClick={() => { setPreview(null); setReviewing(null); void handleFire(reviewing, TRIGGER_TIN.AdminTuChoi, "Từ chối"); }}><XCircle className="size-4" /> Từ chối</Button>
          <Button disabled={busyId !== null || (reviewing.VaiTroNguoiDang !== "NGUOI_DAI_DIEN" && !reviewing.NguoiDaiDienDaDuyet)} onClick={() => { setPreview(null); setReviewing(null); void handleFire(reviewing, TRIGGER_TIN.AdminDuyet, "Duyệt và công khai"); }}><CheckCircle2 className="size-4" /> Duyệt và công khai</Button>
        </> : undefined} />
      </div>
    </AdminGate>
  );
}
