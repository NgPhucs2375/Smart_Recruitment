"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ListChecks, Pencil, Plus, Save, Search, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/features/admin/AdminGate";
import { adminApi } from "@/features/admin/api";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Rule = {
  Id: number;
  TuKhoa: string;
  Loai: number;
  DiemTru: number;
  MoTa?: string | null;
  IsActive: boolean;
};

const EMPTY_FORM = { tuKhoa: "", loai: 1, diemTru: 25, moTa: "", isActive: true };

export default function QuyTacKiemDuyetPage() {
  const [items, setItems] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (filter?: string) => {
    setLoading(true);
    try {
      const rows = await adminApi.list<Rule>("/quytackiemduyettins", filter ? { _filter: filter } : undefined);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được rule kiểm duyệt");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: Rule) {
    setEditingId(item.Id);
    setForm({
      tuKhoa: item.TuKhoa,
      loai: item.Loai,
      diemTru: item.DiemTru,
      moTa: item.MoTa ?? "",
      isActive: item.IsActive,
    });
    setShowForm(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.tuKhoa.trim()) {
      toast.error("Vui lòng nhập từ khóa");
      return;
    }
    if (form.loai === 2 && (form.diemTru < 1 || form.diemTru > 100)) {
      toast.error("Điểm trừ phải từ 1 đến 100");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tuKhoa: form.tuKhoa.trim(),
        loai: form.loai,
        diemTru: form.loai === 1 ? 100 : form.diemTru,
        moTa: form.moTa.trim(),
        isActive: form.isActive,
      };
      if (editingId) await adminApi.put(`/quytackiemduyettins/${editingId}`, payload);
      else await adminApi.post("/quytackiemduyettins", payload);
      toast.success(editingId ? "Đã cập nhật rule" : "Đã thêm rule mới");
      setShowForm(false);
      await load(search || undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu rule");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Rule) {
    if (!window.confirm(`Xóa rule “${item.TuKhoa}”?`)) return;
    try {
      await adminApi.remove(`/quytackiemduyettins/${item.Id}`);
      setItems((current) => current.filter((rule) => rule.Id !== item.Id));
      toast.success("Đã xóa rule");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa rule");
    }
  }

  return (
    <AdminGate>
      <AdminPageLayout>
        <AdminPageHeader
          icon={ShieldAlert}
          title="Rule kiểm duyệt tự động"
          description="Quản lý từ khóa cấm và tín hiệu rủi ro dùng để chấm điểm tin tuyển dụng."
          actions={<Button onClick={openCreate}><Plus className="size-4" /> Thêm rule</Button>}
        />

        {showForm && (
          <AdminCard className="p-5">
            <form className="space-y-5" onSubmit={submit}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{editingId ? "Cập nhật rule" : "Thêm rule kiểm duyệt"}</h2>
                  <p className="text-sm text-muted-foreground">Từ khóa được chuẩn hóa viết thường và bỏ dấu khi đối chiếu.</p>
                </div>
                <Button type="button" size="icon" variant="ghost" aria-label="Đóng biểu mẫu" onClick={() => setShowForm(false)}><X className="size-4" /></Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Từ khóa</Label>
                  <Input id="keyword" value={form.tuKhoa} onChange={(event) => setForm((current) => ({ ...current, tuKhoa: event.target.value }))} placeholder="VD: đặt cọc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Loại rule</Label>
                  <Select value={String(form.loai)} onValueChange={(value) => setForm((current) => ({ ...current, loai: Number(value) }))}>
                    <SelectTrigger id="rule-type" className="h-9 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Từ khóa cấm, từ chối ngay</SelectItem>
                      <SelectItem value="2">Tín hiệu rủi ro, trừ điểm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Điểm trừ</Label>
                  <Input id="score" type="number" min={1} max={100} disabled={form.loai === 1} value={form.loai === 1 ? 100 : form.diemTru} onChange={(event) => setForm((current) => ({ ...current, diemTru: Number(event.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Input id="description" value={form.moTa} onChange={(event) => setForm((current) => ({ ...current, moTa: event.target.value }))} placeholder="Lý do hoặc nhóm vi phạm" />
                </div>
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                Kích hoạt rule ngay sau khi lưu
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
                <Button type="submit" disabled={saving}><Save className="size-4" /> {saving ? "Đang lưu..." : "Lưu rule"}</Button>
              </div>
            </form>
          </AdminCard>
        )}

        <AdminCard>
          <AdminCardHeader
            title="Danh sách rule"
            description={`${items.length} rule đang hiển thị`}
            action={
              <form className="relative w-full sm:w-72" onSubmit={(event) => { event.preventDefault(); void load(search || undefined); }}>
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm từ khóa hoặc mô tả..." />
              </form>
            }
          />
          {loading ? <AdminLoadingState /> : items.length === 0 ? (
            <AdminEmptyState icon={ListChecks} title="Chưa có rule kiểm duyệt" description="Thêm từ khóa cấm hoặc tín hiệu rủi ro để hệ thống bắt đầu kiểm tra." action={<Button size="sm" onClick={openCreate}><Plus className="size-4" /> Thêm rule</Button>} />
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.Id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{item.TuKhoa}</span>
                      <Badge variant={item.Loai === 1 ? "destructive" : "secondary"}>{item.Loai === 1 ? "Từ khóa cấm" : `Trừ ${item.DiemTru} điểm`}</Badge>
                      <Badge variant={item.IsActive ? "default" : "outline"}>{item.IsActive ? "Đang bật" : "Đã tắt"}</Badge>
                    </div>
                    {item.MoTa && <p className="mt-1 text-sm text-muted-foreground">{item.MoTa}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Pencil className="size-4" /> Sửa</Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void remove(item)}><Trash2 className="size-4" /> Xóa</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </AdminPageLayout>
    </AdminGate>
  );
}
