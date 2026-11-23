"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getValidToken, refreshSession } from "@/lib/auth-provider";

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
  lyDoGoiY: string;
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
    lyDoGoiY: text(value.lyDoGoiY ?? value.LyDoGoiY).trim(),
  };
}

function money(value: number) {
  return value > 0 ? `${Math.round(value).toLocaleString("vi-VN")} đ` : "Thỏa thuận";
}

export function RecommendationPreview({ count = 5 }: { count?: number }) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Backend phân biệt hai trạng thái trống bằng Succeeded: false = chưa có hồ sơ/CV
  // để phân tích, true + data rỗng = có CV nhưng chưa tin nào đủ điểm. Gộp lại một
  // câu sẽ nói sai (báo "chọn CV mặc định" khi người dùng đã có CV mặc định).
  const [notice, setNotice] = useState("");
  const [needsCv, setNeedsCv] = useState(false);
  const railId = useId();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const next = { left: el.scrollLeft > 4, right: maxScroll - el.scrollLeft > 4 };
    setEdges((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || collapsed) return;
    // rAF/ResizeObserver đều bất đồng bộ nên không setState đồng bộ trong effect.
    // Thêm timeout vì rAF có thể bị hoãn ở tab nền/headless, khi đó nút ‹ › mất.
    const frame = window.requestAnimationFrame(updateEdges);
    const settle = window.setTimeout(updateEdges, 60);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateEdges);
    observer?.observe(el);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer?.disconnect();
    };
  }, [updateEdges, collapsed, items.length]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 220), behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;
    const request = async () => {
      let token = await getValidToken();
      const send = () => fetch(`/api/dotnet/ketquaphuhops/recommendations?topN=${count}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      let response = await send();
      if (response.status === 401 && await refreshSession()) {
        token = await getValidToken();
        response = await send();
      }
      return response;
    };

    request()
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được gợi ý việc làm.");
        return response.json();
      })
      .then((body) => {
        if (cancelled) return;
        const succeeded = body?.Succeeded ?? body?.succeeded ?? true;
        setNotice(body?.Message ?? body?.message ?? "");
        setNeedsCv(!succeeded);
        const data = body?.data ?? body?.Data;
        if (succeeded && Array.isArray(data)) setItems(data.map(normalizeRecommendation));
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
    <section className="rounded-3xl border border-workspace-ai/30 bg-workspace-ai-soft/35 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-workspace-ai"><Sparkles className="size-3.5" /> Adam gợi ý cho bạn</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Việc làm phù hợp với cv của bạn</h2>
          {/* <p className="mt-1 text-sm text-muted-foreground">Dựa trên CV mặc định và kỹ năng của bạn.</p> */}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[0.65rem] font-semibold text-muted-foreground transition-colors hover:bg-workspace-ai/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-workspace-ai"
            aria-expanded={!collapsed}
            aria-controls={railId}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronDown className="size-3.5" aria-hidden="true" /> : <ChevronUp className="size-3.5" aria-hidden="true" />}
            {collapsed ? "Mở rộng" : "Thu gọn"}
          </button>
          <Link href="/viec-lam/phu-hop" className="group flex items-center gap-1 text-sm font-medium text-workspace-ai transition-colors hover:text-workspace-ai/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-workspace-ai">
            Xem thêm việc phù hợp <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="mt-5 flex gap-3 overflow-hidden">
          {Array.from({ length: Math.min(count, 5) }).map((_, index) => <div key={index} className="h-24 w-[17.5rem] max-w-[85%] shrink-0 animate-pulse rounded-2xl border border-border bg-card/70" />)}
        </div>
      ) : error ? (
        <p className="mt-5 rounded-2xl border border-destructive/20 bg-card px-4 py-4 text-sm text-muted-foreground">{error}</p>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-5">
          <p className="text-sm font-medium">{needsCv ? "Adam cần CV để bắt đầu gợi ý việc làm." : "Adam chưa tìm thấy việc phù hợp cho bạn."}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {notice || (needsCv
              ? "Hoàn thiện hoặc chọn CV mặc định để Adam phân tích và đề xuất những cơ hội phù hợp hơn."
              : "Chưa có tin tuyển dụng nào đủ điểm khớp với kỹ năng trong CV của bạn.")}
          </p>
          {needsCv && <Link href="/CV" className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4">Hoàn thiện CV</Link>}
        </div>
      ) : !collapsed && (
        <div className="relative mt-5">
          {edges.left && (
            <button type="button" aria-label="Gợi ý trước" onClick={() => scrollByPage(-1)} className="absolute left-1 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-workspace-ai/10">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          )}
          <div
            id={railId}
            ref={trackRef}
            onScroll={updateEdges}
            className="flex snap-x snap-proximity gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.slice(0, count).map((item) => (
             <Link key={item.tinTuyenDungId} href={`/viec-lam/${item.tinTuyenDungId}`} className="w-[17.5rem] max-w-[85%] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 transition hover:border-workspace-ai/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{item.tieuDe}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.tenDoanhNghiep} · {item.diaDiemLamViec || "Linh hoạt"}</p>
                </div>
                 <span className="shrink-0 rounded-full bg-workspace-ai-soft px-2 py-1 text-xs font-semibold text-workspace-ai">{Math.round(item.diemPhuHop)}%</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{money(item.luongToiThieu)} - {money(item.luongToiDa)}</p>
              {item.kyNangThieu?.length > 0 && <p className="mt-2 truncate text-xs text-workspace-warning">Còn thiếu: {item.kyNangThieu.slice(0, 3).join(", ")}</p>}
              {item.lyDoGoiY && <p className="mt-2 line-clamp-2 text-xs text-workspace-ai">{item.lyDoGoiY}</p>}
            </Link>
            ))}
          </div>
          {edges.right && (
            <button type="button" aria-label="Gợi ý sau" onClick={() => scrollByPage(1)} className="absolute right-1 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-workspace-ai/10">
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
