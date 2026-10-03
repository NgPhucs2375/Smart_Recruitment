"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Eye, ArrowRight, X, FileText, Check, Search, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cvThemesApi } from "@/lib/api/cv-themes-api";

const PAGE_SIZE = 12;

type AtsFilter = "all" | "yes" | "no";
type LayoutFilter = "all" | "1" | "2";
type SortMode = "recommended" | "name";

/**
 * Mở trình tạo CV với mẫu đã chọn. Nếu gallery được mở từ trình soạn đang
 * sửa CV (?cv=...), giữ lại param đó để bên /tao-cv tải đúng CV rồi áp mẫu
 * mới — nội dung đã nhập không bị mất. Dùng full navigation để state cũ
 * không lẫn sang (loadAll bên kia tự xử lý giữ liệu).
 */
function goUseTemplate(templateId: string) {
  const cv = new URLSearchParams(window.location.search).get("cv");
  window.location.assign(
    cv
      ? `/tao-cv?template=${templateId}&cv=${encodeURIComponent(cv)}`
      : `/tao-cv?template=${templateId}`,
  );
}

function categoryLabel(meta: ResumeTemplateMeta): string {
  const cats = meta.categories ?? [];
  const first = TEMPLATE_CATEGORIES.find((c) => c.id !== "all" && cats.includes(c.id));
  return first?.label ?? "Mẫu CV";
}

/**
 * Compact CV template marketplace — A4 live preview là trọng tâm,
 * chỉ render đúng 12 cards của trang hiện tại. Renderer, modal,
 * goUseTemplate, overlay DB và fallback offline giữ nguyên.
 */
export function MauCvGallery() {
  // DB overlay: metadata mới từ bảng cv_themes phủ lên registry tĩnh.
  // Thất bại (chưa migrate/offline) thì gallery vẫn chạy với metadata tĩnh.
  const [dbTick, setDbTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const templates = useMemo(() => {
    void dbTick; // re-read registry after DB overlay hydrates (mutates entries in place)
    return Object.values(TEMPLATE_REGISTRY);
  }, [dbTick]);
  useEffect(() => {
    let live = true;
    cvThemesApi
      .active()
      .then((list) => {
        if (!live) return;
        hydrateTemplateRegistry(list);
        setDbTick((t) => t + 1);
      })
      .catch(() => {})
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [ats, setAts] = useState<AtsFilter>("all");
  const [layout, setLayout] = useState<LayoutFilter>("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [page, setPage] = useState(1);

  // Reset về trang 1 mỗi khi filter đổi.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [query, category, ats, layout, sort]);

  const preview: ResumeTemplateMeta | null = previewId
    ? (TEMPLATE_REGISTRY[resolveTemplateId(previewId)] ?? null)
    : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = templates.filter((t) => {
      // Theme bị admin tắt (IsActive=false) ẩn khỏi gallery ứng viên.
      // Static entries (isActive undefined) luôn hiển thị; editor vẫn
      // render mọi slug trong registry nên CV cũ không bao giờ vỡ.
      if (t.isActive === false) return false;
      if (category !== "all" && !(t.categories ?? []).includes(category)) return false;
      if (layout !== "all" && String(t.columns ?? 1) !== layout) return false;
      if (ats === "yes") {
        const friendly = t.atsFriendly ?? (t.categories ?? []).includes("ats");
        if (!friendly) return false;
      }
      if (ats === "no" && t.atsFriendly === true) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
    const byName = [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    if (sort === "name") return byName;
    return [...list].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.name.localeCompare(b.name, "vi"));
  }, [templates, query, category, ats, layout, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );
  const rangeFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setAts("all");
    setLayout("all");
    setSort("recommended");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2">
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <FileText className="size-3.5" /> Mẫu CV
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Chọn mẫu cho CV của bạn
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Xem trước bố cục thật với dữ liệu mẫu. Chọn “Dùng mẫu này” để mở trình tạo CV với mẫu đã chọn —
          bạn nhập dữ liệu thật của mình ở bước tiếp theo.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mẫu theo tên, slug, thẻ..."
              aria-label="Tìm mẫu CV"
              className="rounded-full pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc thân thiện ATS"
              value={ats}
              onChange={(e) => setAts(e.target.value as AtsFilter)}
              className="h-9 rounded-full border border-input bg-background px-3 text-xs font-medium"
            >
              <option value="all">ATS: tất cả</option>
              <option value="yes">Thân thiện ATS</option>
              <option value="no">Không ATS</option>
            </select>
            <select
              aria-label="Lọc số cột bố cục"
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutFilter)}
              className="h-9 rounded-full border border-input bg-background px-3 text-xs font-medium"
            >
              <option value="all">Bố cục: tất cả</option>
              <option value="1">1 cột</option>
              <option value="2">2 cột</option>
            </select>
            <select
              aria-label="Sắp xếp mẫu"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-9 rounded-full border border-input bg-background px-3 text-xs font-medium"
            >
              <option value="recommended">Đề xuất</option>
              <option value="name">Tên A–Z</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc mẫu theo nhóm">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                category === c.id
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-muted-foreground hover:border-navy/40 hover:text-foreground",
              )}
            >
              {c.id === "all" && <LayoutGrid className="size-3.5" />}
              {c.label}
            </button>
          ))}
          <p className="ml-auto shrink-0 text-xs font-medium text-muted-foreground" aria-live="polite">
            {filtered.length === 0 ? "0" : `${rangeFrom}–${rangeTo}`} / {filtered.length} mẫu
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Đang tải mẫu CV">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-semibold text-foreground">Không tìm thấy mẫu phù hợp</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thử từ khóa khác hoặc nới bộ lọc để xem toàn bộ thư viện {templates.length} mẫu.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2 rounded-full"
            onClick={resetFilters}
          >
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setPreviewId(template.id)}
              />
            ))}
          </div>
          {pageCount > 1 && (
            <nav aria-label="Phân trang mẫu CV" className="flex items-center justify-center gap-1.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: pageCount }).map((_, i) => (
                <Button
                  key={i + 1}
                  type="button"
                  variant={safePage === i + 1 ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setPage(i + 1)}
                  aria-label={`Trang ${i + 1}`}
                  aria-current={safePage === i + 1 ? "page" : undefined}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                aria-label="Trang tiếp"
              >
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </>
      )}

      <TemplatePreviewModal template={preview} onClose={() => setPreviewId(null)} />
    </div>
  );
}

const TemplateCard = memo(function TemplateCard({
  template,
  onPreview,
}: {
  template: ResumeTemplateMeta;
  onPreview: () => void;
}) {
  const { Component } = template;
  const [imgBroken, setImgBroken] = useState(false);
  const showImg = Boolean(template.previewImageUrl) && !imgBroken;
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="group relative">
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Xem trước mẫu ${template.name}`}
          className="block h-64 w-full cursor-pointer overflow-hidden bg-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          <div aria-hidden="true" className="origin-top-left" style={{ width: "640px", transform: "scale(0.5)", pointerEvents: "none" }}>
            {showImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={template.previewImageUrl}
                alt=""
                className="h-auto w-full object-cover object-top"
                onError={() => setImgBroken(true)}
              />
            ) : (
              <Component data={SAMPLE_RESUME} />
            )}
          </div>
        </button>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex gap-2 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            type="button"
            size="sm"
            className="pointer-events-auto flex-1 rounded-full shadow-lg"
            onClick={onPreview}
          >
            <Eye className="mr-1.5 size-3.5" /> Xem trước
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="pointer-events-auto flex-1 rounded-full shadow-lg"
            onClick={() => goUseTemplate(template.id)}
          >
            Dùng mẫu này <ArrowRight className="ml-1.5 size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-4 pb-3 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground" title={template.name}>
            {template.name}
          </h2>
          <Check className="size-3.5 shrink-0 text-teal" aria-label="Mẫu khả dụng" />
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="rounded-full text-[10px]">
            {categoryLabel(template)}
          </Badge>
          {template.atsFriendly === true && (
            <Badge variant="outline" className="rounded-full text-[10px]">
              ATS
            </Badge>
          )}
        </div>
        <div className="mt-1 flex gap-1.5 sm:hidden">
          <Button type="button" variant="outline" size="sm" className="flex-1 rounded-full" onClick={onPreview}>
            <Eye className="mr-1 size-3.5" /> Xem
          </Button>
          <Button type="button" size="sm" className="flex-1 rounded-full" onClick={() => goUseTemplate(template.id)}>
            Dùng <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
});

function TemplatePreviewModal({
  template,
  onClose,
}: {
  template: ResumeTemplateMeta | null;
  onClose: () => void;
}) {
  const open = template !== null;
  const { Component } = template ?? {};
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                  {template?.name ?? "Xem trước mẫu"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                  {template?.description ?? ""}
                </DialogPrimitive.Description>
                {template && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {template.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full text-[11px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng xem trước"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted p-5">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {Component && template && <Component data={SAMPLE_RESUME} />}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Minh họa bằng dữ liệu mẫu. Khi dùng mẫu, bạn sẽ nhập thông tin thật của mình trong trình tạo CV.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border/60 p-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onClose}>
                Đóng
              </Button>
              {template && (
                <Button
                  type="button"
                  className="h-10 w-full rounded-xl bg-primary text-white hover:bg-primary-hover sm:w-auto"
                  onClick={() => goUseTemplate(template.id)}
                >
                  Dùng mẫu này
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
