"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Eye, Search, Tag, X } from "lucide-react";
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

type SortMode = "recommended" | "name";

/** Nhãn chip theo wireframe: "Chuẩn ATS", "IT / Dev" (registry giữ nhãn gốc). */
const CHIP_LABELS: Partial<Record<TemplateCategory | "all", string>> = {
  ats: "Chuẩn ATS",
  developer: "IT / Dev",
};

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
  if (!first) return "Mẫu CV";
  return CHIP_LABELS[first.id] ?? first.label;
}

/**
 * Thư viện mẫu CV: header gọn + chip lọc vuốt ngang + card ngang
 * (thumbnail trái, nội dung phải, 2 nút hành động luôn hiện).
 * Renderer, modal, goUseTemplate, overlay DB và fallback offline giữ nguyên.
 */
export function MauCvGallery() {
  const router = useRouter();
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
  const [sort, setSort] = useState<SortMode>("recommended");
  const [page, setPage] = useState(1);

  // Reset về trang 1 mỗi khi filter đổi.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [query, category, sort]);

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
      if (category === "ats") {
        // Chip "Chuẩn ATS": ưu tiên cột atsFriendly từ DB, fallback categories.
        const friendly = t.atsFriendly ?? (t.categories ?? []).includes("ats");
        if (!friendly) return false;
      } else if (category === "one-column" || category === "two-column") {
        if (String(t.columns ?? 1) !== (category === "one-column" ? "1" : "2")) return false;
      } else if (category !== "all" && !(t.categories ?? []).includes(category)) return false;
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
    // Đề xuất: theme Studio mới nhất (Id DB lớn nhất) lên đầu để thu hút
    // dùng thử, sau đó tới mẫu tĩnh theo Thứ tự admin đặt.
    return [...list].sort(
      (a, b) =>
        (a.isStudio ? 0 : 1) - (b.isStudio ? 0 : 1) ||
        (a.isStudio && b.isStudio ? (b.sourceId ?? 0) - (a.sourceId ?? 0) : 0) ||
        (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) ||
        a.name.localeCompare(b.name, "vi"),
    );
  }, [templates, query, category, sort]);

  // 3 theme Studio mới nhất (Id lớn nhất) gắn nhãn MỚI.
  const newestStudioIds = useMemo(
    () =>
      new Set(
        templates
          .filter(
            (t) => t.isStudio && t.isActive !== false && typeof t.sourceId === "number",
          )
          .sort((a, b) => (b.sourceId ?? 0) - (a.sourceId ?? 0))
          .slice(0, 3)
          .map((t) => t.id),
      ),
    [templates],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setSort("recommended");
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-7">
      {/* Header: quay lại + tiêu đề; phải là sắp xếp + tổng số mẫu */}
      <div className="flex h-14 items-center justify-between gap-3 border-b border-border/40 px-1 sm:px-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Quay lại"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">Chọn mẫu CV</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label="Sắp xếp mẫu"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="h-9 rounded-full border border-input bg-background px-3 text-xs font-medium"
          >
            <option value="recommended">Đề xuất</option>
            <option value="name">Tên A–Z</option>
          </select>
          <span
            className="whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground"
            aria-live="polite"
          >
            {loading ? "…" : `${filtered.length} mẫu`}
          </span>
        </div>
      </div>

      {/* Chip lọc: vuốt ngang */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Vuốt ngang để lọc:</p>
        <div className="relative">
          <div
            role="group"
            aria-label="Lọc mẫu theo nhóm"
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TEMPLATE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "min-h-9 shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  category === c.id
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-card text-muted-foreground hover:border-navy/40 hover:text-foreground",
                )}
              >
                {CHIP_LABELS[c.id] ?? c.label}
              </button>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center bg-gradient-to-l from-background to-transparent"
          >
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mẫu theo tên, slug, thẻ..."
          aria-label="Tìm mẫu CV"
          className="h-10 rounded-full pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label="Đang tải mẫu CV">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
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
          <div className="grid gap-4 md:grid-cols-2">
            {pageItems.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isNew={newestStudioIds.has(template.id)}
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
  isNew,
  onPreview,
}: {
  template: ResumeTemplateMeta;
  isNew?: boolean;
  onPreview: () => void;
}) {
  const { Component } = template;
  const [imgBroken, setImgBroken] = useState(false);
  const showImg = Boolean(template.previewImageUrl) && !imgBroken;
  const columns = template.columns ?? 1;
  return (
    <article className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:border-navy/30 hover:shadow-md sm:gap-4 sm:p-4">
      {/* Thumbnail: A4 thu nhỏ, bấm để xem thử */}
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Xem thử mẫu ${template.name}`}
        className="relative h-44 w-28 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:h-56 sm:w-36"
      >
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.previewImageUrl}
            alt=""
            className="h-full w-full object-cover object-top"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div
            aria-hidden="true"
            className="origin-top-left [transform:scale(0.175)] sm:[transform:scale(0.225)]"
            style={{ width: "640px", pointerEvents: "none" }}
          >
            <Component data={SAMPLE_RESUME} />
          </div>
        )}
      </button>

      {/* Nội dung: tên + mô tả ngắn + thẻ + 2 nút hành động */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base" title={template.name}>
            {template.name}
          </h3>
          {isNew && (
            <Badge className="shrink-0 rounded-full bg-teal/15 text-[10px] font-semibold text-teal hover:bg-teal/15">
              MỚI
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Mẫu CV {columns} cột</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-soft-sage px-2 py-0.5 text-[11px] font-medium text-primary">
            <Tag className="size-3" aria-hidden="true" />
            {categoryLabel(template)} • {columns} cột
          </span>
          {template.atsFriendly === true && categoryLabel(template) !== "Chuẩn ATS" && (
            <Badge variant="outline" className="rounded-full text-[10px]">
              ATS
            </Badge>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{template.description}</p>
        <div className="mt-auto flex gap-2 pt-2.5">
          <Button type="button" variant="outline" size="sm" className="min-h-9 flex-1 rounded-full" onClick={onPreview}>
            <Eye className="mr-1 size-3.5" aria-hidden="true" /> Xem thử
          </Button>
          <Button type="button" size="sm" className="min-h-9 flex-1 rounded-full" onClick={() => goUseTemplate(template.id)}>
            Dùng mẫu này
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
          <DialogPrimitive.Popup className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
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
