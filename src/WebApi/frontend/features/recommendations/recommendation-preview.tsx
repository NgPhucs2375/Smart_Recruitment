"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type Recommendation = {
  tinTuyenDungId: number;
  tieuDe: string;
  tenDoanhNghiep: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  diemPhuHop: number;
  kyNangThoa: string[];
  kyNangThieu: string[];
};

type ApiRecommendation = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value : `${value ?? ""}`;
}

function number(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function normalizeRecommendation(value: ApiRecommendation): Recommendation {
  return {
    tinTuyenDungId: number(value.tinTuyenDungId ?? value.TinTuyenDungId),
    tieuDe: text(value.tieuDe ?? value.TieuDe),
    tenDoanhNghiep: text(value.tenDoanhNghiep ?? value.TenDoanhNghiep),
    diaDiemLamViec: text(value.diaDiemLamViec ?? value.DiaDiemLamViec),
    luongToiThieu: number(value.luongToiThieu ?? value.LuongToiThieu),
    luongToiDa: number(value.luongToiDa ?? value.LuongToiDa),
    diemPhuHop: number(value.diemPhuHop ?? value.DiemPhuHop) * 100,
    kyNangThoa: list(value.kyNangThoa ?? value.KyNangThoa),
    kyNangThieu: list(value.kyNangThieu ?? value.KyNangThieu),
  };
}

function money(value: number) {
  return value > 0 ? `${Math.round(value).toLocaleString("vi-VN")} đ` : "Thỏa thuận";
}

export function RecommendationPreview({ count = 5 }: { count?: number }) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("access_token");
    fetch(`/api/dotnet/ketquaphuhops/recommendations?topN=${count}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được gợi ý việc làm.");
        return response.json();
      })
      .then((body) => {
        const data = body?.data ?? body?.Data;
        if (!cancelled && Array.isArray(data)) setItems(data.map(normalizeRecommendation));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setItems([]);
        setError(reason instanceof Error ? reason.message : "Không tải được gợi ý việc làm.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [count]);

  return (
    <section className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="size-3.5" /> Adam đề xuất</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Dành cho bạn</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dựa trên CV mặc định và kỹ năng của bạn.</p>
        </div>
        <Link href="/viec-lam/phu-hop" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Xem tất cả <ArrowUpRight className="size-4" />
        </Link>
      </div>
      {loading ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {Array.from({ length: Math.min(count, 5) }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-border bg-card/70" />)}
        </div>
      ) : error ? (
        <p className="mt-5 rounded-2xl border border-destructive/20 bg-card px-4 py-4 text-sm text-muted-foreground">{error}</p>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-5">
          <p className="text-sm font-medium">Chưa có gợi ý việc làm.</p>
          <p className="mt-1 text-sm text-muted-foreground">Hãy tạo hoặc chọn CV mặc định để Adam tìm việc phù hợp cho bạn.</p>
          <Link href="/CV" className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4">Mở workspace CV</Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {items.slice(0, count).map((item) => (
          <Link key={item.tinTuyenDungId} href={`/viec-lam/${item.tinTuyenDungId}`} className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-medium">{item.tieuDe}</h3>
                <p className="mt-1 truncate text-xs text-muted-foreground">{item.tenDoanhNghiep} · {item.diaDiemLamViec || "Linh hoạt"}</p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{Math.round(item.diemPhuHop)}%</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{money(item.luongToiThieu)} - {money(item.luongToiDa)}</p>
            {item.kyNangThieu?.length > 0 && <p className="mt-2 truncate text-xs text-amber-700">Còn thiếu: {item.kyNangThieu.slice(0, 3).join(", ")}</p>}
          </Link>
          ))}
        </div>
      )}
    </section>
  );
}
