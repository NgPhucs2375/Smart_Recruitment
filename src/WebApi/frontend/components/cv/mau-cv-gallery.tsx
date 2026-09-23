"use client";

import { useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Eye, ArrowRight, X, FileText, Check, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SAMPLE_RESUME,
  TEMPLATE_CATEGORIES,
  TEMPLATE_REGISTRY,
  resolveTemplateId,
  type ResumeTemplateMeta,
  type TemplateCategory,
} from "@/features/tao-cv/template-registry";

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

/**
 * Template gallery — renders the ACTUAL registered template components with
 * a fixed SAMPLE ResumeData, scaled into thumbnails. No screenshots, no
 * colored-rectangle placeholders. Search + category facets keep the
 * 18-template library browsable. Registry contract untouched.
 */
export function MauCvGallery() {
  const templates = useMemo(() => Object.values(TEMPLATE_REGISTRY), []);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");

  const preview: ResumeTemplateMeta | null = previewId
    ? (TEMPLATE_REGISTRY[resolveTemplateId(previewId)] ?? null)
    : null;

  const filtered = templates.filter((t) => {
    if (category !== "all" && !(t.categories ?? []).includes(category)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
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

      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mẫu theo tên, thẻ: senior, ats, 2 cột…"
            aria-label="Tìm mẫu CV"
            className="rounded-full pl-9"
          />
        </div>
        <p className="shrink-0 text-xs font-medium text-muted-foreground" aria-live="polite">
          {filtered.length}/{templates.length} mẫu
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc mẫu theo nhóm">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              category === c.id
                ? "border-navy bg-navy text-white"
                : "border-border bg-card text-muted-foreground hover:border-navy/40 hover:text-foreground",
            )}
          >
            {c.id === "all" && <LayoutGrid className="size-3.5" />}
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-semibold text-foreground">Không tìm thấy mẫu phù hợp</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thử từ khóa khác hoặc chọn nhóm khác để xem toàn bộ thư viện {templates.length} mẫu.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2 rounded-full"
            onClick={() => { setQuery(""); setCategory("all"); }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewId(template.id)}
            />
          ))}
        </div>
      )}

      <TemplatePreviewModal template={preview} onClose={() => setPreviewId(null)} />
    </div>
  );
}

function TemplateCard({
  template,
  onPreview,
}: {
  template: ResumeTemplateMeta;
  onPreview: () => void;
}) {
  const { Component } = template;
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Xem trước mẫu ${template.name}`}
        className="group relative block h-64 w-full cursor-pointer overflow-hidden bg-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div aria-hidden="true" className="origin-top-left" style={{ width: "640px", transform: "scale(0.5)", pointerEvents: "none" }}>
          <Component data={SAMPLE_RESUME} />
        </div>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-charcoal/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Eye className="size-3.5" /> Xem trước
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{template.name}</h2>
          <Check className="mt-1 size-4 shrink-0 text-teal" aria-label="Mẫu khả dụng" />
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Thẻ phù hợp">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{template.description}</p>
        <div className="mt-auto flex gap-2 pt-2">
          <Button type="button" variant="outline" className="h-10 flex-1 rounded-xl" onClick={onPreview}>
            <Eye className="mr-2 size-4" />
            Xem trước
          </Button>
          <Button type="button" className="h-10 flex-1 rounded-xl" onClick={() => goUseTemplate(template.id)}>
            Dùng mẫu này
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

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
