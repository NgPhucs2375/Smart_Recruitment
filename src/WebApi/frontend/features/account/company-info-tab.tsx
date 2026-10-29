"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Lock } from "lucide-react";
import {
  AdminCard,
  AdminEmptyState,
  AdminInfoBanner,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

type DoanhNghiep = {
  id: number;
  tenDoanhNghiep: string;
  moTa: string;
  website: string;
  diaChi: string;
  logoUrl: string;
  maSoThue: string;
  linhVucHoatDong: string;
  quyMoNhanSu: string;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

const API = "/api/dotnet/doanhnghieps";
const API_MINE = "/api/dotnet/doanhnghieps/mine";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function websiteHref(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

/** Tab "Công ty" trong /tai-khoan — thẻ thông tin tĩnh (chỉ xem), không sửa. */
export function CompanyInfoTab() {
  const identity = useStoredIdentity();
  const isRepresentative = (identity?.roles ?? []).some(
    (role) => role.trim().toUpperCase() === "NGUOI_DAI_DIEN",
  );
  const [company, setCompany] = useState<DoanhNghiep | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts?.headers,
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const mapCompany = (raw: Record<string, unknown>): DoanhNghiep => ({
    id: Number(raw.id ?? raw.Id),
    tenDoanhNghiep: `${raw.tenDoanhNghiep ?? raw.TenDoanhNghiep ?? ""}`,
    moTa: `${raw.moTa ?? raw.MoTa ?? ""}`,
    website: `${raw.website ?? raw.Website ?? ""}`,
    diaChi: `${raw.diaChi ?? raw.DiaChi ?? ""}`,
    logoUrl: `${raw.logoUrl ?? raw.LogoUrl ?? ""}`,
    maSoThue: `${raw.maSoThue ?? raw.MaSoThue ?? ""}`,
    linhVucHoatDong: `${raw.linhVucHoatDong ?? raw.LinhVucHoatDong ?? ""}`,
    quyMoNhanSu: `${raw.quyMoNhanSu ?? raw.QuyMoNhanSu ?? ""}`,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      // Ưu tiên /mine (doanh nghiệp của chính user) — tránh lấy items[0] từ list tất cả.
      try {
        const mine: ApiResponse<unknown> = await apiFetch(API_MINE);
        if (ok(mine)) {
          const d = extractData(mine) as Record<string, unknown> | undefined;
          if (d && (d.id !== undefined || d.Id !== undefined)) {
            setCompany(mapCompany(d));
            return;
          }
        }
      } catch {
        // fallback sang list khi thiếu quyền /mine
      }
      const res: ApiResponse<unknown> = await apiFetch(API);
      if (!ok(res)) throw new Error(msg(res));
      const d = extractData(res);
      let items: unknown[] = [];
      if (Array.isArray(d)) items = d;
      else if (d && typeof d === "object") {
        const obj = d as Record<string, unknown>;
        if (Array.isArray(obj.items)) items = obj.items;
        else if (Array.isArray(obj.Items)) items = obj.Items;
      }
      if (items.length > 0) setCompany(mapCompany(items[0] as Record<string, unknown>));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  if (loading) return <AdminLoadingState />;

  const rows: { label: string; value: string; href?: string }[] = company
    ? [
        ...(company.maSoThue ? [{ label: "Mã số thuế", value: company.maSoThue }] : []),
        ...(company.quyMoNhanSu ? [{ label: "Quy mô", value: company.quyMoNhanSu }] : []),
        ...(company.website
          ? [{ label: "Website", value: company.website, href: websiteHref(company.website) }]
          : []),
        ...(company.diaChi ? [{ label: "Địa chỉ", value: company.diaChi }] : []),
        ...(isRepresentative && identity?.email
          ? [{ label: "Đại diện", value: identity.email }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-5">
      <AdminInfoBanner>
        <span className="inline-flex items-center gap-2">
          <Lock className="size-4" />
          Bạn đang ở chế độ Chỉ xem (Read-only)
        </span>
      </AdminInfoBanner>

      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Không tải được thông tin doanh nghiệp. Vui lòng thử lại. ({err})
        </div>
      )}

      {!company ? (
        <AdminEmptyState
          icon={Building2}
          title="Chưa có thông tin doanh nghiệp"
          description="Tài khoản của bạn chưa gắn với doanh nghiệp nào trên hệ thống."
        />
      ) : (
        <AdminCard>
          <div className="flex items-start gap-4 p-5 sm:p-6">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={`Logo ${company.tenDoanhNghiep}`}
                className="size-14 shrink-0 rounded-xl border border-border bg-background object-cover"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="size-6 text-primary" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">
                {company.tenDoanhNghiep || "—"}
              </h2>
              {company.linhVucHoatDong && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Lĩnh vực: {company.linhVucHoatDong}
                </p>
              )}
            </div>
          </div>

          {rows.length > 0 && (
            <div className="border-t border-border p-5 sm:p-6">
              <dl className="space-y-2.5">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3"
                  >
                    <dt className="text-sm text-muted-foreground sm:w-36 sm:shrink-0">
                      {row.label}:
                    </dt>
                    <dd className="min-w-0 break-words text-sm text-foreground">
                      {row.href ? (
                        <a
                          href={row.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="border-t border-border p-5 sm:p-6">
            <p className="text-sm font-medium text-foreground">Giới thiệu:</p>
            <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">
              {company.moTa || "Chưa cập nhật giới thiệu doanh nghiệp."}
            </p>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
