"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken, refreshIdentity } from "@/lib/auth-provider";
import { loadIdentity } from "@/lib/access-control-provider";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import { ShieldCheck, Save, RotateCcw } from "lucide-react";

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
  // Response<T> wrapper: { Succeeded, Data: { roles, resources, matrix } }
  const data = (b["Data"] as unknown) ?? (b["data"] as unknown) ?? body;
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const roles = d["roles"] as MatrixResponse["roles"];
  const resources = d["resources"] as string[];
  const matrix = d["matrix"] as Matrix;
  if (!Array.isArray(roles) || !Array.isArray(resources) || !matrix || typeof matrix !== "object") return null;
  return { roles, resources, matrix };
}

export default function PermissionMatrixPage() {
  const [data, setData] = useState<MatrixResponse | null>(null);
  const [draft, setDraft] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState(() => loadIdentity());

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
      // deep clone
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
    return [...data.resources].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const isDirty = useMemo(() => {
    if (!data) return false;
    return JSON.stringify(data.matrix) !== JSON.stringify(draft);
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
      // refresh permissions cached in localStorage so sidebar updates immediately
      await refreshIdentity();
      toast.success("Đã lưu ma trận quyền (policy.csv cache đã đồng bộ)");
      // refetch to get server-canonical
      await fetchMatrix();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Lỗi tải ma trận</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
          <CardContent><Button variant="outline" onClick={fetchMatrix}><RotateCcw className="mr-2 size-4" /> Thử lại</Button></CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Compute union actions per resource for column compactness: show only actions that exist for that resource in any role, plus common actions
  const getActionsForResource = (resource: string): string[] => {
    const set = new Set<string>();
    for (const role of data.roles) {
      const acts = draft[role.name]?.[resource] ?? data.matrix[role.name]?.[resource] ?? [];
      for (const a of acts) set.add(a);
    }
    // Include ALL_ACTIONS that are used somewhere for this resource, fallback to common 5
    if (set.size === 0) return ["list", "show", "create", "edit", "delete"];
    // Keep order defined by ALL_ACTIONS
    return ALL_ACTIONS.filter((a) => set.has(a));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div>
          <div>
            <h1 className="text-xl font-semibold">Permission Matrix</h1>
            <p className="text-sm text-muted-foreground">DB (RoleClaims) là truth, <code className="rounded bg-muted px-1 py-0.5 text-xs">wwwroot/policy.csv</code> là cache RAM — chỉnh ở đây sẽ ghi DB + ghi file + reload Enforcer</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!isDirty || saving} onClick={() => data && setDraft(JSON.parse(JSON.stringify(data.matrix)))}><RotateCcw className="mr-2 size-4" /> Hủy</Button>
          <Button disabled={!isDirty || saving || !canEdit} onClick={handleSave}>{saving ? "Đang lưu..." : <><Save className="mr-2 size-4" /> Lưu ma trận</>}</Button>
        </div>
      </div>

      {!canEdit && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Bạn chỉ có quyền xem (roleclaims:edit thiếu) — liên hệ QUAN_TRI_VIEN</div>}

      <Card>
        <CardHeader>
          <CardTitle>Ma trận Role × Resource</CardTitle>
          <CardDescription>Tick để cấp quyền. Mỗi ô là tập actions cho role trên resource. Dòng = resource, Cột = role</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px] sticky left-0 bg-card">Resource</TableHead>
                {data.roles.map((r) => (
                  <TableHead key={r.id} className="text-center min-w-[180px]">{r.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {resourcesSorted.map((resource) => {
                const actions = getActionsForResource(resource);
                return (
                  <TableRow key={resource}>
                    <TableCell className="font-medium sticky left-0 bg-card">{resource}</TableCell>
                    {data.roles.map((role) => {
                      const checkedSet = new Set(draft[role.name]?.[resource] ?? []);
                      return (
                        <TableCell key={role.id + resource}>
                          <div className="flex flex-wrap gap-3">
                            {actions.map((act) => {
                              const checked = checkedSet.has(act);
                              const id = `${role.name}-${resource}-${act}`;
                              return (
                                <Label key={id} htmlFor={id} className="flex items-center gap-1.5 text-xs font-normal cursor-pointer">
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
        </CardContent>
      </Card>

      {isDirty && <p className="text-sm text-muted-foreground">Có thay đổi chưa lưu — nhớ bấm Lưu để đồng bộ DB + policy.csv cache</p>}
    </div>
  );
}
