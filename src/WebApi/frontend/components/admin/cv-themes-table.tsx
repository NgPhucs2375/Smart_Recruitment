"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LayoutTemplate, Pencil, Trash2, Plus, Search, Upload } from "lucide-react";
import { cvThemesApi, type CvThemeVm, type CvThemeInput } from "@/lib/api/cv-themes-api";

const EMPTY: CvThemeInput = {
  Slug: "",
  Ten: "",
  MoTa: "",
  MoTaNgan: "",
  DanhMuc: "developer",
  NganhPhuHop: "all",
  ViTriMucTieu: "all",
  CapBac: "all",
  Tags: "",
  PhongCachThietKe: "modern",
  SoCot: 1,
  ThanThienATS: true,
  MauSacChuDao: "",
  TamLyMauSac: "",
  KhuyenNghiSuDung: "",
  TranhSuDungKhi: "",
  GoiYAI: "",
  LaMacDinh: false,
  IsActive: true,
  ThuTu: 0,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function CvThemesTable() {
  const [rows, setRows] = useState<CvThemeVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CvThemeVm | null>(null);
  const [form, setForm] = useState<CvThemeInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const set = <K extends keyof CvThemeInput>(key: K, value: CvThemeInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchRows = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const data = await cvThemesApi.list(kw ? { _filter: kw } : undefined);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (row: CvThemeVm) => {
    setEditing(row);
    setForm({
      Slug: row.Slug,
      Ten: row.Ten,
      MoTa: row.MoTa ?? "",
      MoTaNgan: row.MoTaNgan ?? "",
      DanhMuc: row.DanhMuc ?? "",
      NganhPhuHop: row.NganhPhuHop ?? "",
      ViTriMucTieu: row.ViTriMucTieu ?? "",
      CapBac: row.CapBac ?? "",
      Tags: row.Tags ?? "",
      PhongCachThietKe: row.PhongCachThietKe ?? "",
      SoCot: row.SoCot,
      ThanThienATS: row.ThanThienATS,
      MauSacChuDao: row.MauSacChuDao ?? "",
      TamLyMauSac: row.TamLyMauSac ?? "",
      KhuyenNghiSuDung: row.KhuyenNghiSuDung ?? "",
      TranhSuDungKhi: row.TranhSuDungKhi ?? "",
      GoiYAI: row.GoiYAI ?? "",
      LaMacDinh: row.LaMacDinh,
      IsActive: row.IsActive,
      ThuTu: row.ThuTu,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.Slug.trim() || !form.Ten.trim()) {
      toast.error("Slug và tên theme là bắt buộc");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await cvThemesApi.update(editing.Id, { ...form, Id: editing.Id });
        toast.success("Cập nhật theme thành công");
      } else {
        await cvThemesApi.create(form);
        toast.success("Tạo theme thành công");
      }
      setShowForm(false);
      void fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: CvThemeVm) => {
    if (!window.confirm(`Xóa theme "${row.Ten}"? Theme đang được CV dùng sẽ bị chặn xóa.`)) return;
    try {
      await cvThemesApi.remove(row.Id);
      toast.success("Đã xóa theme");
      void fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const handleUpload = async (row: CvThemeVm, file: File | undefined) => {
    if (!file) return;
    setUploadingId(row.Id);
    try {
      await cvThemesApi.uploadPreview(row.Id, file);
      toast.success("Tải ảnh preview thành công");
      void fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải ảnh thất bại");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="size-5" /> Theme CV cho AI gợi ý
          </CardTitle>
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Thêm theme
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex max-w-sm items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Lọc theo tên/slug/tags..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void fetchRows(filter || undefined);
              }}
            />
            <Button variant="outline" onClick={() => void fetchRows(filter || undefined)}>
              Lọc
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Cấp bậc</TableHead>
                  <TableHead>ATS</TableHead>
                  <TableHead>Hiện</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.Id}>
                    <TableCell className="font-mono text-xs">{row.Slug}</TableCell>
                    <TableCell className="font-medium">{row.Ten}</TableCell>
                    <TableCell>{row.DanhMuc}</TableCell>
                    <TableCell>{row.CapBac}</TableCell>
                    <TableCell>{row.ThanThienATS ? "Có" : "Không"}</TableCell>
                    <TableCell>{row.IsActive ? "Có" : "Không"}</TableCell>
                    <TableCell>{row.ThuTu}</TableCell>
                    <TableCell>
                      <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline">
                        <Upload className="size-3.5" />
                        {uploadingId === row.Id ? "Đang tải..." : row.PreviewStorageKey ? "Đổi ảnh" : "Tải ảnh"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={uploadingId === row.Id}
                          onChange={(e) => {
                            void handleUpload(row, e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Sửa">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => void handleDelete(row)} aria-label="Xóa">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Chưa có theme nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? `Sửa theme #${editing.Id}` : "Thêm theme mới"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug (khớp id registry)">
              <Input value={form.Slug} onChange={(e) => set("Slug", e.target.value)} placeholder="tech-modern" />
            </Field>
            <Field label="Tên hiển thị">
              <Input value={form.Ten} onChange={(e) => set("Ten", e.target.value)} placeholder="Tech Modern" />
            </Field>
            <Field label="Mô tả">
              <Textarea value={form.MoTa ?? ""} onChange={(e) => set("MoTa", e.target.value)} rows={2} />
            </Field>
            <Field label="Mô tả ngắn">
              <Input value={form.MoTaNgan ?? ""} onChange={(e) => set("MoTaNgan", e.target.value)} />
            </Field>
            <Field label="Danh mục">
              <Input value={form.DanhMuc ?? ""} onChange={(e) => set("DanhMuc", e.target.value)} placeholder="developer" />
            </Field>
            <Field label="Ngành phù hợp (CSV)">
              <Input value={form.NganhPhuHop ?? ""} onChange={(e) => set("NganhPhuHop", e.target.value)} placeholder="IT,Data" />
            </Field>
            <Field label="Vị trí mục tiêu (CSV)">
              <Input value={form.ViTriMucTieu ?? ""} onChange={(e) => set("ViTriMucTieu", e.target.value)} placeholder="Backend,BA" />
            </Field>
            <Field label="Cấp bậc">
              <Input value={form.CapBac ?? ""} onChange={(e) => set("CapBac", e.target.value)} placeholder="fresher/all/senior" />
            </Field>
            <Field label="Tags (CSV)">
              <Input value={form.Tags ?? ""} onChange={(e) => set("Tags", e.target.value)} placeholder="IT,Developer" />
            </Field>
            <Field label="Phong cách">
              <Input value={form.PhongCachThietKe ?? ""} onChange={(e) => set("PhongCachThietKe", e.target.value)} placeholder="modern" />
            </Field>
            <Field label="Số cột">
              <Input
                type="number"
                min={1}
                max={2}
                value={form.SoCot ?? 1}
                onChange={(e) => set("SoCot", Number(e.target.value) || 1)}
              />
            </Field>
            <Field label="Màu chủ đạo">
              <Input value={form.MauSacChuDao ?? ""} onChange={(e) => set("MauSacChuDao", e.target.value)} placeholder="#274b73" />
            </Field>
            <Field label="Tâm lý màu sắc">
              <Textarea value={form.TamLyMauSac ?? ""} onChange={(e) => set("TamLyMauSac", e.target.value)} rows={2} />
            </Field>
            <Field label="Khuyến nghị sử dụng">
              <Textarea value={form.KhuyenNghiSuDung ?? ""} onChange={(e) => set("KhuyenNghiSuDung", e.target.value)} rows={2} />
            </Field>
            <Field label="Tránh dùng khi">
              <Textarea value={form.TranhSuDungKhi ?? ""} onChange={(e) => set("TranhSuDungKhi", e.target.value)} rows={2} />
            </Field>
            <Field label="Gợi ý cho AI">
              <Textarea value={form.GoiYAI ?? ""} onChange={(e) => set("GoiYAI", e.target.value)} rows={2} />
            </Field>
            <Field label="Thứ tự">
              <Input
                type="number"
                value={form.ThuTu ?? 0}
                onChange={(e) => set("ThuTu", Number(e.target.value) || 0)}
              />
            </Field>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.ThanThienATS ?? true}
                  onCheckedChange={(v) => set("ThanThienATS", v === true)}
                />
                Thân thiện ATS
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.LaMacDinh ?? false} onCheckedChange={(v) => set("LaMacDinh", v === true)} />
                Mặc định
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.IsActive ?? true} onCheckedChange={(v) => set("IsActive", v === true)} />
                Hiển thị
              </label>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
