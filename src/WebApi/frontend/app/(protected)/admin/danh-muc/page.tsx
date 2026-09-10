"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tags, Pencil, Trash2, Plus, RotateCcw, Search } from "lucide-react";
import { AdminGate } from "@/features/admin/AdminGate";
import { adminApi } from "@/features/admin/api";

interface DanhMucRow {
  Id: number;
  Ten: string;
  MoTa?: string | null;
}

interface CatalogConfig {
  key: string;
  label: string;
  listPath: string;
  nameField: "tenNghe" | "tenKyNang";
  mapRow: (raw: Record<string, unknown>) => DanhMucRow;
  toCreate: (ten: string, moTa: string) => Record<string, unknown>;
  toUpdate: (id: number, ten: string, moTa: string) => Record<string, unknown>;
}

function readStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function readNum(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

const CATALOGS: CatalogConfig[] = [
  {
    key: "nghe",
    label: "Ngành nghề",
    listPath: "/danhmucnghes",
    nameField: "tenNghe",
    mapRow: (r) => ({ Id: readNum(r["Id"] ?? r["id"]), Ten: readStr(r["TenNghe"]), MoTa: readStr(r["MoTa"]) || null }),
    toCreate: (ten, moTa) => ({ tenNghe: ten, moTa: moTa || null }),
    toUpdate: (id, ten, moTa) => ({ id, tenNghe: ten, moTa: moTa || null }),
  },
  {
    key: "kynang",
    label: "Kỹ năng",
    listPath: "/kynangs",
    nameField: "tenKyNang",
    mapRow: (r) => ({ Id: readNum(r["Id"] ?? r["id"]), Ten: readStr(r["TenKyNang"]), MoTa: readStr(r["MoTa"]) || null }),
    toCreate: (ten, moTa) => ({ tenKyNang: ten, moTa: moTa || null }),
    toUpdate: (id, ten, moTa) => ({ id, tenKyNang: ten, moTa: moTa || null }),
  },
];

function CatalogTable({ config }: { config: CatalogConfig }) {
  const [rows, setRows] = useState<DanhMucRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DanhMucRow | null>(null);
  const [ten, setTen] = useState("");
  const [moTa, setMoTa] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRows = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.list<Record<string, unknown>>(
        config.listPath,
        kw ? { _filter: kw } : undefined,
      );
      setRows(Array.isArray(data) ? data.map(config.mapRow) : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setTen("");
    setMoTa("");
    setShowForm(true);
  };

  const openEdit = (row: DanhMucRow) => {
    setEditing(row);
    setTen(row.Ten);
    setMoTa(row.MoTa ?? "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!ten.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`${config.listPath}/${editing.Id}`, config.toUpdate(editing.Id, ten.trim(), moTa.trim()));
        toast.success("Đã cập nhật");
      } else {
        await adminApi.post(config.listPath, config.toCreate(ten.trim(), moTa.trim()));
        toast.success("Đã thêm mới");
      }
      setShowForm(false);
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: DanhMucRow) => {
    if (!window.confirm(`Xóa "${row.Ten}"?`)) return;
    try {
      await adminApi.remove(`${config.listPath}/${row.Id}`);
      toast.success("Đã xóa");
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void fetchRows(filter || undefined);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={`Tìm ${config.label.toLowerCase()}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">Tìm</Button>
        </form>
        <Button variant="outline" onClick={() => void fetchRows(filter || undefined)}>
          <RotateCcw className="mr-2 size-4" /> Tải lại
        </Button>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" /> Thêm
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editing ? `Sửa ${config.label} #${editing.Id}` : `Thêm ${config.label}`}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`${config.key}-ten`}>Tên *</Label>
              <Input id={`${config.key}-ten`} value={ten} onChange={(e) => setTen(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${config.key}-mota`}>Mô tả</Label>
              <Textarea id={`${config.key}-mota`} rows={3} value={moTa} onChange={(e) => setMoTa(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button disabled={saving} onClick={handleSave}>{saving ? "Đang lưu..." : "Lưu"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Id</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.Id}>
                <TableCell>{row.Id}</TableCell>
                <TableCell className="font-medium">{row.Ten}</TableCell>
                <TableCell className="max-w-[320px] truncate text-muted-foreground">{row.MoTa ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Sửa" onClick={() => openEdit(row)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Xóa" className="text-destructive" onClick={() => void handleDelete(row)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function AdminDanhMucPage() {
  return (
    <AdminGate>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Tags className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Quản trị danh mục</h1>
            <p className="text-sm text-muted-foreground">Ngành nghề và kỹ năng dùng chung toàn hệ thống</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="nghe">
              <TabsList>
                <TabsTrigger value="nghe">Ngành nghề</TabsTrigger>
                <TabsTrigger value="kynang">Kỹ năng</TabsTrigger>
              </TabsList>
              {CATALOGS.map((c) => (
                <TabsContent key={c.key} value={c.key} className="pt-4">
                  <CatalogTable config={c} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
