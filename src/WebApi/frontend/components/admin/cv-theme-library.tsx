"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Eye, Pencil, Search, Upload, X, Check, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SAMPLE_RESUME,
  TEMPLATE_CATEGORIES,
  TEMPLATE_REGISTRY,
  hydrateTemplateRegistry,
  resolveTemplateId,
  type ResumeTemplateMeta,
  type TemplateCategory,
} from "@/features/tao-cv/template-registry";
import { cvThemesApi, type CvThemeVm } from "@/lib/api/cv-themes-api";

type AtsFilter = "all" | "yes" | "no";
type ActiveFilter = "all" | "on" | "off";
type ColFilter = "all" | "1" | "2";

function toInput(row: CvThemeVm) {
  return {
    Id: row.Id,
    Slug: row.Slug,
    Ten: row.Ten,
    MoTa: row.MoTa ?? "",
    MoTaNgan: row.MoTaNgan ?? "",
    DanhMuc: row.DanhMuc ?? "",
    NganhPhuHop: row.NganhPhuHop ?? "",
    ViTriMucTieu: row.ViTriMucTieu ?? "",
    CapBac: row.CapBac ?? "",
    Tags: row.Tags ?? "",
    PhongCachThietKe: row.PhongCachThietKe ?? "",
    SoCot: row.SoCot,
    ThanThienATS: row.ThanThienATS,
    MauSacChuDao: row.MauSacChuDao ?? "",
    TamLyMauSac: row.TamLyMauSac ?? "",
    KhuyenNghiSuDung: row.KhuyenNghiSuDung ?? "",
    TranhSuDungKhi: row.TranhSuDungKhi ?? "",
    GoiYAI: row.GoiYAI ?? "",
    LaMacDinh: row.LaMacDinh,
    IsActive: row.IsActive,
    ThuTu: row.ThuTu,
  };
}

/**
 * Admin theme library — visual gallery reusing the SAME live renderer as
 * the candidate gallery. Activation toggle hides themes from candidates
 * + AI but never breaks existing CVs (editor renders by registry slug,
 * independent of IsActive; no component is deleted).
 */
export function CvThemeLibrary({ onEdit }: { onEdit: () => void }) {
  const [rows, setRows] = useState<CvThemeVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [ats, setAts] = useState<AtsFilter>("all");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [cols, setCols] = useState<ColFilter>("all");
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cvThemesApi.list();
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      hydrateTemplateRegistry(list);
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách theme");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRows();
  }, [fetchRows]);

  const cards = useMemo(() => {
    void tick;
    const q = query.trim().toLowerCase();
    return rows
      .map((row) => {
        const slug = (row.Slug ?? "").trim().toLowerCase();
        const meta = TEMPLATE_REGISTRY[resolveTemplateId(slug)] ?? null;
        return { row, meta };
      })
      .filter(({ row, meta }) => {
        if (!meta) return true; // vẫn hiện để báo thiếu renderer
        if (category !== "all" && !(meta.categories ?? []).includes(category)) return false;
        if (ats === "yes" && !row.ThanThienATS) return false;
        if (ats === "no" && row.ThanThienATS) return false;
        if (active === "on" && !row.IsActive) return false;
        if (active === "off" && row.IsActive) return false;
        if (cols !== "all" && String(meta.columns ?? 1) !== cols) return false;
        if (!q) return true;
        return (
          row.Ten.toLowerCase().includes(q) ||
          row.Slug.toLowerCase().includes(q) ||
          (row.MoTa ?? "").toLowerCase().includes(q) ||
          (row.Tags ?? "").toLowerCase().includes(q)
        );
      });
  }, [rows, tick, query, category, ats, active, cols]);

  const previewMeta: ResumeTemplateMeta | null = previewSlug
    ? (TEMPLATE_REGISTRY[resolveTemplateId(previewSlug)] ?? null)
    : null;

  const handleToggle = async (row: CvThemeVm) => {
    setToggling(row.Id);
    try {
      await cvThemesApi.update(row.Id, { ...toInput(row), IsActive: !row.IsActive });
      toast.success(row.IsActive ? `Đã ẩn "${row.Ten}" khỏi gallery + AI` : `Đã bật "${row.Ten}"`);
      await fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đổi trạng thái thất bại");
    } finally {
      setToggling(null);
    }
  };

  const handleUpload = async (row: CvThemeVm, file: File | undefined) => {
    if (!file) return;
    try {
      await cvThemesApi.uploadPreview(row.Id, file);
      toast.success("Tải ảnh preview thành công");
      await fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải ảnh thất bại");
    }
  };

  return (
    <div className="space-y-4 px-6 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-52 flex-1 items-center gap-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, slug, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                category === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Lọc ATS"
          value={ats}
          onChange={(e) => setAts(e.target.value as AtsFilter)}
          className="h-9 rounded-xl border border-input bg-card px-2 text-xs"
        >
          <option value="all">ATS: tất cả</option>
          <option value="yes">Thân thiện ATS</option>
          <option value="no">Không ATS</option>
        </select>
        <select
          aria-label="Lọc hiển thị"
          value={active}
          onChange={(e) => setActive(e.target.value as ActiveFilter)}
          className="h-9 rounded-xl border border-input bg-card px-2 text-xs"
        >
          <option value="all">Hiển thị: tất cả</option>
          <option value="on">Đang bật</option>
          <option value="off">Đang ẩn</option>
        </select>
        <select
          aria-label="Lọc số cột"
          value={cols}
          onChange={(e) => setCols(e.target.value as ColFilter)}
          className="h-9 rounded-xl border border-input bg-card px-2 text-xs"
        >
          <option value="all">Cột: tất cả</option>
          <option value="1">1 cột</option>
          <option value="2">2 cột</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-3xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-semibold text-foreground">Không tìm thấy mẫu phù hợp</p>
          <p className="mt-1 text-sm text-muted-foreground">Thử từ khóa hoặc bộ lọc khác.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ row, meta }) => (
            <LibraryCard
              key={row.Id}
              row={row}
              meta={meta}
              toggling={toggling === row.Id}
              onPreview={() => setPreviewSlug(row.Slug)}
              onToggle={() => void handleToggle(row)}
              onEdit={onEdit}
              onUpload={(f) => void handleUpload(row, f)}
            />
          ))}
        </div>
      )}

      <DialogPrimitive.Root open={previewMeta !== null} onOpenChange={(next) => { if (!next) setPreviewSlug(null); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <DialogPrimitive.Popup className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
                <div>
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                    {previewMeta?.name ?? "Xem trước mẫu"}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                    {previewMeta?.description ?? ""}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  aria-label="Đóng xem trước"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-muted p-5">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  {previewMeta && <previewMeta.Component data={SAMPLE_RESUME} />}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Render thật bằng dữ liệu mẫu — đúng giao diện ứng viên thấy ở gallery và PDF.
                </p>
              </div>
            </DialogPrimitive.Popup>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

function LibraryCard({
  row,
  meta,
  toggling,
  onPreview,
  onToggle,
  onEdit,
  onUpload,
}: {
  row: CvThemeVm;
  meta: ResumeTemplateMeta | null;
  toggling: boolean;
  onPreview: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onUpload: (f: File | undefined) => void;
}) {
  const { Component } = meta ?? {};
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm", !row.IsActive && "opacity-75")}>
      <button
        type="button"
        onClick={onPreview}
        disabled={!Component}
        aria-label={`Xem trước mẫu ${row.Ten}`}
        className="group relative block h-56 w-full cursor-pointer overflow-hidden bg-muted/40 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
      >
        <div aria-hidden="true" className="origin-top-left" style={{ width: "640px", transform: "scale(0.5)", pointerEvents: "none" }}>
          {Component ? (
            <Component data={SAMPLE_RESUME} />
          ) : (
            <div className="flex h-64 items-center justify-center gap-2 bg-muted px-6 text-center text-xs text-muted-foreground">
              <TriangleAlert className="size-4 shrink-0" />
              Chưa có component render cho slug “{row.Slug}” — không công bố cho ứng viên
            </div>
          )}
        </div>
        {Component && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-charcoal/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <Eye className="size-3.5" /> Xem trước
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground">{row.Ten}</h2>
            <p className="truncate font-mono text-[11px] text-muted-foreground">{row.Slug}</p>
          </div>
          {row.IsActive ? (
            <Check className="mt-1 size-4 shrink-0 text-teal" aria-label="Đang hiển thị" />
          ) : (
            <Badge variant="secondary" className="shrink-0 rounded-full text-[10px]">Đang ẩn</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-full text-[10px]">{row.DanhMuc ?? "—"}</Badge>
          <Badge variant={row.ThanThienATS ? "secondary" : "outline"} className="rounded-full text-[10px]">
            {row.ThanThienATS ? "ATS" : "Không ATS"}
          </Badge>
          <Badge variant="outline" className="rounded-full text-[10px]">{row.CapBac ?? "all"}</Badge>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onPreview} disabled={!Component}>
            <Eye className="mr-1.5 size-3.5" /> Xem
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onToggle} disabled={toggling}>
            {row.IsActive ? "Ẩn" : "Bật"}
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil className="mr-1.5 size-3.5" /> Sửa
          </Button>
          <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2 text-xs font-medium transition hover:bg-muted">
            <Upload className="size-3.5" /> Ảnh
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                onUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
    </article>
  );
}
