"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Save, RotateCcw, Search, CheckSquare, Square } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken, refreshIdentity } from "@/lib/auth-provider";
import { loadIdentity } from "@/lib/access-control-provider";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminErrorState,
  AdminInfoBanner,
} from "@/components/admin/admin-page-layout";

type Matrix = Record<string, Record<string, string[]>>;
interface MatrixResponse {
  roles: { id: string; name: string }[];
  resources: string[];
  matrix: Matrix;
}

const ALL_ACTIONS = ["list", "show", "create", "edit", "delete", "assign", "remove"] as const;

function extractData(body: unknown): MatrixResponse | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const data = (b["Data"] as unknown) ?? (b["data"] as unknown) ?? body;
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const roles = d["roles"] as MatrixResponse["roles"];
  const resources = d["resources"] as string[];
  const matrix = d["matrix"] as Matrix;
  if (!Array.isArray(roles) || !Array.isArray(resources) || !matrix || typeof matrix !== "object") return null;
  return { roles, resources, matrix };
}

function countChanges(original: Matrix, draft: Matrix): number {
  let count = 0;
  const allRoleResources = new Set<string>();
  for (const role of Object.keys(original)) {
    for (const res of Object.keys(original[role] ?? {})) allRoleResources.add(`${role}::${res}`);
  }
  for (const role of Object.keys(draft)) {
    for (const res of Object.keys(draft[role] ?? {})) allRoleResources.add(`${role}::${res}`);
  }
  for (const key of allRoleResources) {
    const [role, res] = key.split("::");
    const origActions = new Set(original[role]?.[res] ?? []);
    const draftActions = new Set(draft[role]?.[res] ?? []);
    if (origActions.size !== draftActions.size) { count++; continue; }
    for (const a of origActions) { if (!draftActions.has(a)) { count++; break; } }
  }
  return count;
}

export default function PermissionMatrixPage() {
  const [data, setData] = useState<MatrixResponse | null>(null);
  const [draft, setDraft] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState(() => loadIdentity());
  const [search, setSearch] = useState("");

  const canEdit = useMemo(() => {
    const isAdministrator = identity?.roles?.some(
      (role) => role.trim().toUpperCase() === "QUAN_TRI_VIEN",
    );
    return Boolean(isAdministrator) || hasPermission(identity?.permissions, "roleclaims", "edit");
  }, [identity]);

  useEffect(() => {
    void refreshIdentity().then(() => setIdentity(loadIdentity()));
  }, []);

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/dotnet/roleclaims/matrix", {
        headers: { Authorization: `Bearer ${token ?? ""}`, Accept: "application/json" },
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { const j = JSON.parse(text); msg = j?.Message ?? j?.message ?? msg; } catch { if (text) msg = text; }
        throw new Error(msg);
      }
      const body = await res.json();
      const parsed = extractData(body);
      if (!parsed) throw new Error("Dữ liệu matrix không hợp lệ");
      setData(parsed);
      setDraft(JSON.parse(JSON.stringify(parsed.matrix)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchMatrix);
  }, [fetchMatrix]);

  const resourcesSorted = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.resources].sort((a, b) => a.localeCompare(b));
    if (!search.trim()) return sorted;
    const q = search.trim().toLowerCase();
    return sorted.filter((r) => r.toLowerCase().includes(q));
  }, [data, search]);

  const isDirty = useMemo(() => {
    if (!data) return false;
    return JSON.stringify(data.matrix) !== JSON.stringify(draft);
  }, [data, draft]);

  const changeCount = useMemo(() => {
    if (!data) return 0;
    return countChanges(data.matrix, draft);
  }, [data, draft]);

  const toggleAction = (role: string, resource: string, action: string, checked: boolean) => {
    setDraft((prev) => {
      const next: Matrix = { ...prev };
      const roleMap = { ...(next[role] ?? {}) };
      const cur = new Set(roleMap[resource] ?? []);
      if (checked) cur.add(action);
      else cur.delete(action);
      const arr = Array.from(cur);
      if (arr.length === 0) delete roleMap[resource];
      else roleMap[resource] = arr.sort();
      next[role] = roleMap;
      return next;
    });
  };

  const toggleAllForRole = (role: string, resource: string, actions: string[], checked: boolean) => {
    setDraft((prev) => {
      const next: Matrix = { ...prev };
      const roleMap = { ...(next[role] ?? {}) };
      if (checked) {
        roleMap[resource] = [...actions].sort();
      } else {
        delete roleMap[resource];
      }
      next[role] = roleMap;
      return next;
    });
  };

  const handleSave = async () => {
    if (!canEdit) { toast.error("Bạn không có quyền chỉnh sửa ma trận"); return; }
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/dotnet/roleclaims/matrix", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ Matrix: draft }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { const j = JSON.parse(text); msg = j?.Message ?? j?.message ?? msg; } catch { if (text) msg = text; }
        throw new Error(msg);
      }
      await refreshIdentity();
      toast.success("Đã lưu ma trận quyền (policy.csv cache đã đồng bộ)");
      await fetchMatrix();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout>
        <AdminPageHeader
          icon={ShieldCheck}
          title="Phân quyền"
          description="Quản lý ma trận quyền Role × Resource."
        />
        <AdminErrorState message={error} onRetry={fetchMatrix} />
      </AdminPageLayout>
    );
  }

  if (!data) return null;

  const getActionsForResource = (resource: string): string[] => {
    const set = new Set<string>();
    for (const role of data.roles) {
      const acts = draft[role.name]?.[resource] ?? data.matrix[role.name]?.[resource] ?? [];
      for (const a of acts) set.add(a);
    }
    if (set.size === 0) return ["list", "show", "create", "edit", "delete"];
    return ALL_ACTIONS.filter((a) => set.has(a));
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={ShieldCheck}
        title="Phân quyền"
        description="Quản lý ma trận quyền Role × Resource trong hệ thống."
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {changeCount} quyền đã thay đổi
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!isDirty || saving}
              onClick={() => data && setDraft(JSON.parse(JSON.stringify(data.matrix)))}
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Hủy
            </Button>
            <Button
              size="sm"
              disabled={!isDirty || saving || !canEdit}
              onClick={handleSave}
              className={isDirty ? "bg-primary text-primary-foreground shadow-sm" : ""}
            >
              {saving ? "Đang lưu..." : <><Save className="mr-1.5 size-3.5" /> Lưu ma trận</>}
            </Button>
          </div>
        }
      />

      {!canEdit && (
        <AdminInfoBanner>
          Bạn chỉ có quyền xem — liên hệ Quản trị viên để được cấp quyền chỉnh sửa.
        </AdminInfoBanner>
      )}

      <AdminCard>
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {resourcesSorted.length} resource{resourcesSorted.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[160px] sticky left-0 bg-card z-20 border-r">
                  Resource
                </TableHead>
                {data.roles.map((r) => (
                  <TableHead key={r.id} className="text-center min-w-[170px] sticky top-0 z-10 bg-card border-l border-border/50">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-xs">{r.name}</span>
                        {canEdit && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                resourcesSorted.forEach((res) => {
                                  const actions = getActionsForResource(res);
                                  toggleAllForRole(r.name, res, actions, true);
                                });
                              }}
                              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                              title="Chọn tất cả"
                            >
                              <CheckSquare className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resourcesSorted.forEach((res) => {
                                  toggleAllForRole(r.name, res, [], false);
                                });
                              }}
                              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                              title="Bỏ tất cả"
                            >
                              <Square className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {resourcesSorted.map((resource) => {
                const actions = getActionsForResource(resource);
                return (
                  <TableRow key={resource}>
                    <TableCell className="font-medium text-xs sticky left-0 bg-card z-10 border-r py-1.5">
                      {resource}
                    </TableCell>
                    {data.roles.map((role) => {
                      const checkedSet = new Set(draft[role.name]?.[resource] ?? []);
                      return (
                        <TableCell key={role.id + resource} className="border-l border-border/50 py-1.5">
                          <div className="flex flex-nowrap gap-x-2 gap-y-0.5">
                            {actions.map((act) => {
                              const checked = checkedSet.has(act);
                              const id = `${role.name}-${resource}-${act}`;
                              return (
                                <Label key={id} htmlFor={id} className="flex items-center gap-1 text-[11px] font-normal cursor-pointer whitespace-nowrap">
                                  <Checkbox id={id} checked={checked} disabled={!canEdit} onCheckedChange={(v) => toggleAction(role.name, resource, act, Boolean(v))} />
                                  {act}
                                </Label>
                              );
                            })}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      {isDirty && (
        <AdminInfoBanner>
          Có thay đổi chưa lưu — nhớ bấm Lưu để đồng bộ DB + policy.csv cache.
        </AdminInfoBanner>
      )}
    </AdminPageLayout>
  );
}
