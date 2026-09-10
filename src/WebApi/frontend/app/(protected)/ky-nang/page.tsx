"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";

type KyNang = {
  id: number;
  tenKyNang: string;
  moTa: string;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

const API_URL = "/api/dotnet/kynang";

function getResponseData<T>(response: ApiResponse<T>): T | undefined {
  return response.Data ?? response.data;
}

function getResponseMessage(response: ApiResponse<unknown>): string {
  return response.Message ?? response.message ?? "";
}

function isResponseSucceeded(response: ApiResponse<unknown>): boolean {
  return response.Succeeded ?? response.succeeded ?? true;
}

function normalizeKyNang(value: unknown): KyNang {
  const item = value as Record<string, unknown>;

  return {
    id: Number(item.id ?? item.Id),
    tenKyNang: String(item.tenKyNang ?? item.TenKyNang ?? ""),
    moTa: String(item.moTa ?? item.MoTa ?? ""),
  };
}

export default function KyNangPage() {
  const [items, setItems] = useState<KyNang[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<KyNang | null>(null);

  const [tenKyNang, setTenKyNang] = useState("");
  const [moTa, setMoTa] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const apiFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const token = localStorage.getItem("access_token");

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const apiMessage =
          body?.Message ??
          body?.message ??
          `Request failed with status ${response.status}`;

        throw new Error(apiMessage);
      }

      return body;
    },
    [],
  );

  const loadKyNangs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response: ApiResponse<unknown> = await apiFetch(API_URL);

      if (!isResponseSucceeded(response)) {
        throw new Error(getResponseMessage(response) || "Không thể tải kỹ năng.");
      }

      const payload = getResponseData(response);

      let rawItems: unknown[] = [];

      if (Array.isArray(payload)) {
        rawItems = payload;
      } else if (payload && typeof payload === "object") {
        const data = payload as Record<string, unknown>;

        if (Array.isArray(data.items)) {
          rawItems = data.items;
        } else if (Array.isArray(data.Items)) {
          rawItems = data.Items;
        }
      }

      setItems(rawItems.map(normalizeKyNang));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách kỹ năng.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadKyNangs();
  }, [loadKyNangs]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter(
      (item) =>
        item.tenKyNang.toLowerCase().includes(keyword) ||
        item.moTa.toLowerCase().includes(keyword),
    );
  }, [items, search]);

  function resetForm() {
    setEditingItem(null);
    setTenKyNang("");
    setMoTa("");
    setShowForm(false);
  }

  function openCreateForm() {
    setMessage("");
    setError("");
    setEditingItem(null);
    setTenKyNang("");
    setMoTa("");
    setShowForm(true);
  }

  function openEditForm(item: KyNang) {
    setMessage("");
    setError("");
    setEditingItem(item);
    setTenKyNang(item.tenKyNang);
    setMoTa(item.moTa);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = tenKyNang.trim();

    if (!normalizedName) {
      setError("Tên kỹ năng không được để trống.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const editing = editingItem !== null;

      const url = editing
        ? `${API_URL}/${editingItem.id}`
        : API_URL;

      const body = editing
        ? {
            id: editingItem.id,
            tenKyNang: normalizedName,
            moTa: moTa.trim(),
          }
        : {
            tenKyNang: normalizedName,
            moTa: moTa.trim(),
          };

      const response: ApiResponse<number> = await apiFetch(url, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body),
      });

      if (!isResponseSucceeded(response)) {
        setError(getResponseMessage(response) || "Không thể lưu kỹ năng.");
        return;
      }

      setMessage(
        editing
          ? "Cập nhật kỹ năng thành công."
          : "Thêm kỹ năng thành công.",
      );

      resetForm();
      await loadKyNangs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu kỹ năng.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: KyNang) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa kỹ năng "${item.tenKyNang}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response: ApiResponse<unknown> = await apiFetch(
        `${API_URL}/${item.id}`,
        {
          method: "DELETE",
        },
      );

      if (!isResponseSucceeded(response)) {
        setError(getResponseMessage(response) || "Không thể xóa kỹ năng.");
        return;
      }

      setMessage("Xóa kỹ năng thành công.");

      if (editingItem?.id === item.id) {
        resetForm();
      }

      await loadKyNangs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể xóa kỹ năng.",
      );
    }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Tags}
        title="Quản lý kỹ năng"
        description="Quản lý danh mục kỹ năng được sử dụng trong hệ thống tuyển dụng."
        actions={
          <Button onClick={openCreateForm}>
            <Plus className="size-4" />
            Thêm kỹ năng
          </Button>
        }
      />

      {message && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-foreground">
                {editingItem ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {editingItem
                  ? "Cập nhật thông tin kỹ năng đã chọn."
                  : "Tạo một kỹ năng mới trong danh mục."}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetForm}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="tenKyNang"
                className="text-sm font-medium text-foreground"
              >
                Tên kỹ năng
              </label>

              <Input
                id="tenKyNang"
                value={tenKyNang}
                onChange={(event) => setTenKyNang(event.target.value)}
                placeholder="Ví dụ: Docker"
                maxLength={255}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="moTa"
                className="text-sm font-medium text-foreground"
              >
                Mô tả
              </label>

              <Input
                id="moTa"
                value={moTa}
                onChange={(event) => setMoTa(event.target.value)}
                placeholder="Mô tả ngắn về kỹ năng"
                maxLength={500}
                disabled={saving}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button type="submit" disabled={saving}>
              {saving
                ? "Đang lưu..."
                : editingItem
                  ? "Lưu thay đổi"
                  : "Thêm kỹ năng"}
            </Button>
          </div>
        </form>
      )}

      <AdminCard>
        <AdminCardHeader
          title="Danh sách kỹ năng"
          description={`${items.length} kỹ năng trong hệ thống`}
          action={
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm kỹ năng..."
                className="pl-9"
              />
            </div>
          }
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Tên kỹ năng</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="w-40 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <AdminLoadingState />
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <AdminEmptyState
                    icon={Tags}
                    title={search ? "Không tìm thấy kết quả" : "Chưa có kỹ năng"}
                    description={
                      search
                        ? "Thử thay đổi từ khóa tìm kiếm."
                        : "Bắt đầu bằng cách thêm kỹ năng mới vào hệ thống."
                    }
                    action={
                      !search ? (
                        <Button onClick={openCreateForm} size="sm">
                          <Plus className="size-4" />
                          Thêm kỹ năng
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {item.id}
                  </TableCell>

                  <TableCell className="font-medium text-foreground">
                    {item.tenKyNang}
                  </TableCell>

                  <TableCell className="max-w-xl text-muted-foreground">
                    {item.moTa || "—"}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(item)}
                      >
                        <Pencil className="size-4" />
                        Sửa
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void handleDelete(item)}
                      >
                        <Trash2 className="size-4" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminCard>
    </AdminPageLayout>
  );
}
