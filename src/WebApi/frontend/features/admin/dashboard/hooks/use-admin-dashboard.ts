"use client";

import { useCallback, useEffect, useState } from "react";
import { getValidToken, refreshSession } from "@/lib/auth-provider";
import type { AdminDashboardData, DashboardPeriod } from "../types/dashboard";

type ApiEnvelope = {
  Data?: AdminDashboardData;
  data?: AdminDashboardData;
  Message?: string;
  message?: string;
};

export function useAdminDashboard(period: DashboardPeriod) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let token = await getValidToken();
        const send = () => fetch(`/api/dotnet/admin/dashboard?days=${period}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        let response = await send();
        if (response.status === 401 && await refreshSession()) {
          token = await getValidToken();
          response = await send();
        }
        if (!response.ok) throw new Error(response.status === 403
          ? "Bạn không có quyền xem dashboard quản trị."
          : `Không tải được dashboard (HTTP ${response.status}).`);

        const payload = await response.json() as ApiEnvelope;
        const dashboard = payload.Data ?? payload.data;
        if (!dashboard) throw new Error(payload.Message ?? payload.message ?? "Phản hồi dashboard không hợp lệ.");
        setData(dashboard);
      } catch (reason) {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Không tải được dashboard.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [period, refreshKey]);

  return { data, loading, error, reload };
}
