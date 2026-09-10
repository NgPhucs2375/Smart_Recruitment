"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  MapPin,
  Calendar,
  Send,
  Pause,
  Play,
  XCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { tinTuyenDungApi, danhMucNgheApi } from "../api";
import { HR_ACTIONS, TRANG_THAI_BADGE, TRANG_THAI_LABEL, TRIGGER_LABEL, canEditContent } from "../constants";
import type { DanhMucNghe, TinTuyenDungListItem, TriggerTinTuyenDung } from "../types";
import { TinForm, emptyTinForm, tinToFormValue, type TinFormValue } from "./tin-form";

function formatLuong(min: number, max: number): string {
  const fmt = (v: number) => (v > 0 ? `${v.toLocaleString("vi-VN")}đ` : "");
  if (!min && !max) return "Thương lượng";
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  return fmt(min || max);
}

type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; id: number } | { kind: "detail"; id: number };

export function TinTuyenDungView() {
  const [items, setItems] = useState<TinTuyenDungListItem[]>([]);
  const [danhMucs, setDanhMucs] = useState<DanhMucNghe[]>([]);
  const [danhMucBlocked, setDanhMucBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [editInitial, setEditInitial] = useState<TinFormValue | undefined>(undefined);

  const loadList = useCallback(async (kw = "") => {
    setLoading(true);
    try {
      const data = await tinTuyenDungApi.list(kw);
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách tin.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDanhMucs = useCallback(async () => {
    try {
      setDanhMucs(await danhMucNgheApi.list());
    } catch {
      // NGUOI_DAI_DIEN không có quyền danhmucnghes/list → fallback nhập mã tay
      setDanhMucBlocked(true);
      setDanhMucs([]);
    }
  }, []);

  useEffect(() => {
    void loadList();
    void loadDanhMucs();
  }, [loadList, loadDanhMucs]);

  const openCreate = () => {
    setEditInitial(undefined);
    setMode({ kind: "create" });
  };

  const openEdit = async (id: number) => {
    try {
      const detail = await tinTuyenDungApi.getById(id);
      setEditInitial(tinToFormValue(detail));
      setMode({ kind: "edit", id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được tin.");
    }
  };

  const handleCreate = async (value: TinFormValue) => {
    setSaving(true);
    try {
      const id = await tinTuyenDungApi.create(value);
      toast.success(`Đã tạo tin #${id} ở trạng thái Nháp. Hãy bấm "Gửi duyệt" để công khai.`);
      setMode({ kind: "list" });
      await loadList(filter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tạo tin thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, value: TinFormValue) => {
    setSaving(true);
    try {
      await tinTuyenDungApi.update(id, { ...value, id });
      toast.success("Cập nhật tin thành công!");
      setMode({ kind: "list" });
      await loadList(filter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cập nhật tin thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleFire = async (id: number, trigger: TriggerTinTuyenDung) => {
    const label = TRIGGER_LABEL[trigger].toLowerCase();
    if (!window.confirm(`Xác nhận "${TRIGGER_LABEL[trigger]}" cho tin #${id}?`)) return;
    setActingId(id);
    try {
      await tinTuyenDungApi.fire({ id, trigger });
      toast.success(`Đã ${label} tin #${id}.`);
      await loadList(filter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại.");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Đóng (xóa mềm) tin #${id}? Tin sẽ chuyển sang "Đã đóng".`)) return;
    setActingId(id);
    try {
      await tinTuyenDungApi.remove(id);
      toast.success("Đã đóng tin tuyển dụng.");
      await loadList(filter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa tin thất bại.");
    } finally {
      setActingId(null);
    }
  };

  const triggerIcon = (t: TriggerTinTuyenDung) => {
    switch (t) {
      case "GuiDuyet": return <Send className="mr-1.5 size-3.5" />;
      case "TamDungTin": return <Pause className="mr-1.5 size-3.5" />;
      case "MoLaiTin": return <Play className="mr-1.5 size-3.5" />;
      case "DongTin": return <XCircle className="mr-1.5 size-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tin tuyển dụng</h1>
            <p className="text-sm text-muted-foreground">
              Đăng tin, gửi duyệt và quản lý trạng thái tuyển dụng.
            </p>
          </div>
        </div>
        {mode.kind === "list" ? (
          <Button onClick={openCreate} className="h-10 rounded-xl">
            <Plus className="mr-2 size-4" /> Đăng tin mới
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setMode({ kind: "list" })} className="h-10 rounded-xl">
            Quay lại danh sách
          </Button>
        )}
      </div>

      {mode.kind === "list" && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadList(filter)}
              placeholder="Tìm theo tiêu đề tin..."
              className="h-10 rounded-xl pl-9 text-sm"
            />
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Đang tải tin tuyển dụng...
            </div>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <CardTitle>Chưa có tin tuyển dụng nào</CardTitle>
                <CardDescription>Đăng tin đầu tiên để bắt đầu tuyển dụng nhân sự.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                <Button onClick={openCreate}>
                  <Plus className="mr-2 size-4" /> Đăng tin mới
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map((tin) => {
                const actions = HR_ACTIONS[tin.trangThai] ?? [];
                const busy = actingId === tin.id;
                return (
                  <Card key={tin.id} className="transition hover:shadow-md">
                    <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">#{tin.id} — {tin.tieuDe}</h3>
                          <Badge className={`text-[11px] ${TRANG_THAI_BADGE[tin.trangThai] ?? ""}`}>
                            {TRANG_THAI_LABEL[tin.trangThai] ?? tin.trangThai}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {tin.diaDiemLamViec && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" /> {tin.diaDiemLamViec}
                            </span>
                          )}
                          <span>{formatLuong(tin.luongToiThieu, tin.luongToiDa)}</span>
                          {tin.ngayHetHan && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              Hạn: {new Date(tin.ngayHetHan).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {canEditContent(tin.trangThai) && (
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => void openEdit(tin.id)}>
                            <Pencil className="mr-1.5 size-3.5" /> Sửa
                          </Button>
                        )}
                        {actions.map((t) => (
                          <Button key={t} variant="outline" size="sm" disabled={busy} onClick={() => void handleFire(tin.id, t)}>
                            {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : triggerIcon(t)}
                            {TRIGGER_LABEL[t]}
                          </Button>
                        ))}
                        {(tin.trangThai === "DangTuyen" || tin.trangThai === "TamDung") && (
                          <Button variant="ghost" size="sm" disabled={busy} className="text-red-600 hover:text-red-700" onClick={() => void handleDelete(tin.id)}>
                            <Trash2 className="mr-1.5 size-3.5" /> Đóng tin
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMode({ kind: "detail", id: tin.id })}>
                          <Eye className="mr-1.5 size-3.5" /> Chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {mode.kind === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Đăng tin tuyển dụng mới</CardTitle>
            <CardDescription>Tin mới được lưu ở trạng thái Nháp — gửi duyệt để công khai.</CardDescription>
          </CardHeader>
          <CardContent>
            <TinForm
              initial={emptyTinForm()}
              danhMucs={danhMucs}
              danhMucBlocked={danhMucBlocked}
              saving={saving}
              submitLabel="Đăng tin"
              onSubmit={(v) => void handleCreate(v)}
              onCancel={() => setMode({ kind: "list" })}
            />
          </CardContent>
        </Card>
      )}

      {mode.kind === "edit" && (
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa tin #{mode.id}</CardTitle>
            <CardDescription>Chỉ sửa được nội dung khi tin đang ở Nháp hoặc Bị từ chối.</CardDescription>
          </CardHeader>
          <CardContent>
            {editInitial ? (
              <TinForm
                initial={editInitial}
                danhMucs={danhMucs}
                danhMucBlocked={danhMucBlocked}
                saving={saving}
                submitLabel="Lưu thay đổi"
                onSubmit={(v) => void handleUpdate(mode.id, v)}
                onCancel={() => setMode({ kind: "list" })}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Đang tải...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mode.kind === "detail" && (
        <TinDetailCard
          id={mode.id}
          onBack={() => setMode({ kind: "list" })}
          onEdit={() => void openEdit(mode.id)}
        />
      )}
    </div>
  );
}

function TinDetailCard({ id, onBack, onEdit }: { id: number; onBack: () => void; onEdit: () => void }) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof tinTuyenDungApi.getById>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await tinTuyenDungApi.getById(id);
        if (alive) setDetail(d);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được chi tiết tin.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết tin #{id}</CardTitle>
        <CardDescription>{detail?.tieuDe}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tải...
          </div>
        ) : detail ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge className={TRANG_THAI_BADGE[detail.trangThai] ?? ""}>
                {TRANG_THAI_LABEL[detail.trangThai] ?? detail.trangThai}
              </Badge>
              <span className="text-muted-foreground">{formatLuong(detail.luongToiThieu, detail.luongToiDa)}</span>
            </div>
            {detail.diaDiemLamViec && <p><strong>Địa điểm:</strong> {detail.diaDiemLamViec}</p>}
            {detail.ngayHetHan && <p><strong>Hạn nộp:</strong> {new Date(detail.ngayHetHan).toLocaleDateString("vi-VN")}</p>}
            {detail.moTaCongViec && <div><strong>Mô tả:</strong><p className="whitespace-pre-wrap text-muted-foreground">{detail.moTaCongViec}</p></div>}
            {detail.yeuCauCongViec && <div><strong>Yêu cầu:</strong><p className="whitespace-pre-wrap text-muted-foreground">{detail.yeuCauCongViec}</p></div>}
            {detail.kinhNghiemYeuCau && <p><strong>Kinh nghiệm:</strong> {detail.kinhNghiemYeuCau}</p>}
            {detail.quyenLoi && <p><strong>Quyền lợi:</strong> {detail.quyenLoi}</p>}
          </>
        ) : (
          <p className="text-muted-foreground">Không có dữ liệu.</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onBack}>Quay lại</Button>
          {detail && canEditContent(detail.trangThai) && <Button onClick={onEdit}>Chỉnh sửa</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
