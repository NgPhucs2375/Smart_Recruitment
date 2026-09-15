"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Eye, ArrowRight, X, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SAMPLE_RESUME,
  TEMPLATE_REGISTRY,
  resolveTemplateId,
  type ResumeTemplateMeta,
} from "@/features/tao-cv/templates/registry";

/**
 * Template gallery — renders the ACTUAL registered template components with
 * a fixed SAMPLE ResumeData, scaled into thumbnails. No screenshots, no
 * colored-rectangle placeholders. Registry contract untouched.
 */
export function MauCvGallery() {
  const templates = Object.values(TEMPLATE_REGISTRY);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview: ResumeTemplateMeta | null = previewId
    ? (TEMPLATE_REGISTRY[resolveTemplateId(previewId)] ?? null)
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2">
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">
          <FileText className="size-3.5" /> Mẫu CV
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          Chọn mẫu cho CV của bạn
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-charcoal/60">
          Xem trước bố cục thật với dữ liệu mẫu. Chọn “Dùng mẫu này” để mở trình tạo CV với mẫu đã chọn —
          bạn nhập dữ liệu thật của mình ở bước tiếp theo.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreview={() => setPreviewId(template.id)}
          />
        ))}
      </div>

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
    <article className="flex flex-col overflow-hidden rounded-3xl border border-linen bg-card shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Xem trước mẫu ${template.name}`}
        className="group relative block h-64 w-full cursor-pointer overflow-hidden bg-white text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
          <h2 className="text-lg font-semibold tracking-tight text-charcoal">{template.name}</h2>
          <Check className="mt-1 size-4 shrink-0 text-teal" aria-label="Mẫu khả dụng" />
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Thẻ phù hợp">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-sm leading-6 text-charcoal/60">{template.description}</p>
        <div className="mt-auto flex gap-2 pt-2">
          <Button type="button" variant="outline" className="h-10 flex-1 rounded-xl" onClick={onPreview}>
            <Eye className="mr-2 size-4" />
            Xem trước
          </Button>
          <Link href={`/tao-cv?template=${template.id}`} className="flex-1">
            <Button type="button" className="h-10 w-full rounded-xl bg-primary text-white hover:bg-primary-hover">
              Dùng mẫu này
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
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
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-[2px]" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-linen bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-charcoal">
                  {template?.name ?? "Xem trước mẫu"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-charcoal/60">
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
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-charcoal/60 transition hover:bg-ivory hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-ivory p-5">
              <div className="overflow-hidden rounded-2xl border border-linen bg-white shadow-sm">
                {Component && template && <Component data={SAMPLE_RESUME} />}
              </div>
              <p className="mt-3 text-xs text-charcoal/50">
                Minh họa bằng dữ liệu mẫu. Khi dùng mẫu, bạn sẽ nhập thông tin thật của mình trong trình tạo CV.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border/60 p-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onClose}>
                Đóng
              </Button>
              {template && (
                <Link href={`/tao-cv?template=${template.id}`}>
                  <Button type="button" className="h-10 w-full rounded-xl bg-primary text-white hover:bg-primary-hover sm:w-auto">
                    Dùng mẫu này
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              )}
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
