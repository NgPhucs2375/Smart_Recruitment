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
}

export default function AdminTinTuyenDungPage() {
  const [rows, setRows] = useState<TinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchRows = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.list<TinRow>("/tintuyendungs", kw ? { _filter: kw } : undefined);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const handleFire = async (row: TinRow, trigger: number, label: string) => {
    if (!window.confirm(`${label} tin "${row.TieuDe}"?`)) return;
    setBusyId(row.Id);
    try {
      await adminApi.post(`/tintuyendungs/${row.Id}/fire`, {
        id: row.Id,
        trigger,
        ghiChu: `${label} bởi quản trị viên`,
      });
      toast.success(`Đã ${label.toLowerCase()} tin`);
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row: TinRow) => {
    if (!window.confirm(`Xóa tin "${row.TieuDe}"? Tin sẽ bị đóng qua state machine.`)) return;
    setBusyId(row.Id);
    try {
      await adminApi.remove(`/tintuyendungs/${row.Id}`);
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
              <p className="text-sm text-muted-foreground">Duyệt tin, hạ tin vi phạm, xóa tin</p>
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
                  placeholder="Tìm theo tiêu đề..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
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
                      return (
                        <TableRow key={row.Id}>
                          <TableCell>{row.Id}</TableCell>
                          <TableCell className="max-w-[280px] truncate font-medium">{row.TieuDe}</TableCell>
                          <TableCell>
                            <Badge variant={row.TrangThai === "DangTuyen" ? "default" : "secondary"}>
                              {row.TrangThai}
                            </Badge>
                          </TableCell>
                          <TableCell>#{row.DoanhNghiepId}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Duyệt tin"
                                disabled={busy}
                                className="text-green-600"
                                onClick={() => void handleFire(row, TRIGGER_TIN.AdminDuyet, "Duyệt")}
                              >
                                <CheckCircle2 className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Từ chối tin"
                                disabled={busy}
                                className="text-amber-600"
                                onClick={() => void handleFire(row, TRIGGER_TIN.AdminTuChoi, "Từ chối")}
                              >
                                <XCircle className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Cưỡng chế khóa (vi phạm)"
                                disabled={busy}
                                className="text-orange-600"
                                onClick={() => void handleFire(row, TRIGGER_TIN.AdminCuongCheKhoa, "Cưỡng chế khóa")}
                              >
                                <Ban className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Xóa tin"
                                disabled={busy}
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
      </div>
    </AdminGate>
  );
}
