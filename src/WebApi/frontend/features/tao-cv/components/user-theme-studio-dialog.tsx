"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Check, Info, RotateCcw, SlidersHorizontal, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CvPreview } from "@/components/cv/cv-preview";
import type { CvFormData } from "@/lib/types";
import type { CvSectionId } from "../resume-data";
import { fetchDbThemes } from "../services/theme-db-sync";
import {
  applyThemeCustomization,
  diffThemeCustomization,
  findPublishedTheme,
  getPublishedThemes,
} from "../services/theme-storage";
import { hydrateThemeFromTemplate } from "../services/theme-hydrate";
import type { CvThemeConfig, CvThemeCustomization } from "../types/theme-studio";
import {
  THEME_STUDIO_TAB_ITEMS,
  ThemeStudioControls,
} from "./theme-studio-controls";

type StudioTab = (typeof THEME_STUDIO_TAB_ITEMS)[number]["value"];

/** Vùng được click → tab chứa control liên quan (click-to-select). */
function tabForSection(section: CvSectionId): StudioTab {
  switch (section) {
    case "skills":
    case "experience":
      return "layout";
    default:
      return "type";
  }
}

interface UserThemeStudioDialogProps {
  templateId: string;
  cvData: CvFormData;
  value?: CvThemeCustomization;
  onChange: (next: CvThemeCustomization | undefined) => void;
  /** Báo cho parent biết template hiện tại có theme Studio nền hay không. */
  onAvailabilityChange?: (available: boolean) => void;
}

/**
 * Studio tùy biến giao diện cho ỨNG VIÊN: mở toàn màn hình với đầy đủ control
 * thiết kế (Bố cục / Màu sắc / Chữ) GIỐNG Admin Studio nhưng KHÔNG có tab Xuất
 * bản (không ghi DB tổng). Kết quả lưu thành delta `giaoDien` trên CV.
 *
 * Mở khóa cho MỌI mẫu: nếu mẫu chưa có theme Studio (chưa publish), tự dựng base
 * từ `hydrateThemeFromTemplate` để ứng viên vẫn tùy biến được (kèm banner báo).
 */
export function UserThemeStudioDialog({
  templateId,
  cvData,
  value,
  onChange,
  onAvailabilityChange,
}: UserThemeStudioDialogProps) {
  const [publishedBase, setPublishedBase] = useState<CvThemeConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CvThemeConfig | null>(null);
  const [freeDesign, setFreeDesign] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Chưa chỉnh gì -> preview dùng template gốc tĩnh (giống /tao-cv); chỉ khi
  // đổi control (hoặc bật Thiết kế tự do) mới chuyển sang renderer generic.
  const [touched, setTouched] = useState(false);
  const [tab, setTab] = useState<StudioTab>("layout");
  const [selectedSection, setSelectedSection] = useState<CvSectionId | null>(null);
  const [hoverSection, setHoverSection] = useState<CvSectionId | null>(null);
  const controlsColRef = useRef<HTMLDivElement>(null);

  const hydrated = useMemo(
    () => hydrateThemeFromTemplate(templateId),
    [templateId],
  );

  useEffect(() => {
    let alive = true;
    const local = findPublishedTheme(getPublishedThemes(), templateId);
    setPublishedBase(local);
    fetchDbThemes()
      .then((db) => {
        if (!alive) return;
        setPublishedBase(findPublishedTheme(db, templateId) ?? local);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [templateId]);

  // Studio luôn khả dụng (mẫu tĩnh fallback về base hydrate) → LayoutManager ẩn.
  useEffect(() => {
    onAvailabilityChange?.(true);
  }, [onAvailabilityChange]);

  const base = freeDesign || !publishedBase ? hydrated : publishedBase;
  const usingHydratedBase = !publishedBase || freeDesign;
  // Preview generic chỉ bật khi người dùng thực sự thay đổi thiết kế.
  const showGeneric = touched || freeDesign;

  const delta =
    value && value.themeId === (base.slug || base.id) ? value : undefined;

  const openStudio = () => {
    setDraft(applyThemeCustomization(base, delta));
    setSelectedSection(null);
    setTouched(false);
    setOpen(true);
  };

  const apply = () => {
    if (draft) onChange(diffThemeCustomization(base, draft));
    setOpen(false);
  };

  const reset = () => {
    setDraft(applyThemeCustomization(base, undefined));
    setSelectedSection(null);
    setTouched(false);
  };

  // Click-to-select: preview là DOM clone phân trang → dùng event delegation.
  const onPreviewClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const zone = target?.closest<HTMLElement>("[data-cv-section]");
    const id = zone?.getAttribute("data-cv-section");
    if (!id) return;
    setSelectedSection(id as CvSectionId);
    setTab(tabForSection(id as CvSectionId));
    controlsColRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPreviewHover = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const zone = target?.closest<HTMLElement>("[data-cv-section]");
    const id = (zone?.getAttribute("data-cv-section") ?? null) as CvSectionId | null;
    setHoverSection((prev) => (prev === id ? prev : id));
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openStudio}>
        <SlidersHorizontal className="mr-1.5 h-4 w-4" />
        Tùy biến giao diện
      </Button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <DialogPrimitive.Popup className="flex h-[92vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl outline-none">
              <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <SlidersHorizontal className="size-5" />
                </span>
                <div className="min-w-0">
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                    Tùy biến giao diện CV
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                    Chỉnh bố cục, màu sắc và chữ cho riêng CV của bạn — không ảnh
                    hưởng mẫu gốc.
                  </DialogPrimitive.Description>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wand2 className="size-3.5" />
                    Thiết kế tự do
                    <Switch
                      checked={freeDesign}
                      onCheckedChange={(v) => setFreeDesign(v === true)}
                      aria-label="Chế độ thiết kế tự do"
                    />
                  </label>
                  <DialogPrimitive.Close
                    aria-label="Đóng"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </DialogPrimitive.Close>
                </div>
              </div>

              {usingHydratedBase && showGeneric && !bannerDismissed && (
                <div className="flex items-center gap-2 border-b border-border/60 bg-amber-50 px-5 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <Info className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    Mẫu chưa có bản thiết kế Studio — đang chỉnh trên bản dựng
                    tự động từ mẫu gốc (có thể khác đôi chút).
                  </span>
                  <button
                    type="button"
                    onClick={() => setBannerDismissed(true)}
                    aria-label="Ẩn thông báo"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full transition hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              <div className="grid min-h-0 flex-1 lg:grid-cols-[460px_minmax(0,1fr)]">
                <div
                  ref={controlsColRef}
                  className="min-h-0 overflow-y-auto rounded-none border-b border-border/60 p-5 lg:border-b-0 lg:border-r"
                >
                  <Tabs
                    defaultValue="layout"
                    value={tab}
                    onValueChange={(v) => setTab(v as StudioTab)}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      {THEME_STUDIO_TAB_ITEMS.map((t) => (
                        <TabsTrigger
                          key={t.value}
                          value={t.value}
                          className="px-2 text-xs"
                        >
                          {t.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {draft && (
                      <ThemeStudioControls
                        theme={draft}
                        onChange={(next) => {
                          setDraft(next);
                          setTouched(true);
                        }}
                        highlightSection={selectedSection ?? hoverSection}
                      />
                    )}
                  </Tabs>
                </div>

                <div className="min-h-0 overflow-y-auto bg-slate-200/70 p-4 dark:bg-zinc-900">
                  <p className="mx-auto mb-2 w-full max-w-[210mm] text-center text-[11px] text-muted-foreground">
                    Bấm vào một mục trên CV để chỉnh nhanh
                    {selectedSection ? ` — đang chọn: ${selectedSection}` : ""}
                  </p>
                  <div
                    className="cv-studio-picking mx-auto w-full max-w-[210mm]"
                    onClick={onPreviewClick}
                    onMouseMove={onPreviewHover}
                    onMouseLeave={() => setHoverSection(null)}
                  >
                    {draft &&
                      (showGeneric ? (
                        <CvPreview data={cvData} themeOverride={draft} />
                      ) : (
                        <CvPreview data={cvData} />
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                >
                  <RotateCcw className="mr-1.5 size-4" />
                  Đặt lại
                </Button>
                <div className="flex items-center gap-2">
                  <DialogPrimitive.Close
                    render={
                      <Button type="button" variant="outline" size="sm">
                        Hủy
                      </Button>
                    }
                  />
                  <Button type="button" size="sm" onClick={apply}>
                    <Check className="mr-1.5 size-4" />
                    Áp dụng
                  </Button>
                </div>
              </div>
            </DialogPrimitive.Popup>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
