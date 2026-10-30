"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  Check,
  Copy,
  FilePlus2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AdminGate } from "@/features/admin/AdminGate";
import { cvThemesApi, type CvThemeVm } from "@/lib/api/cv-themes-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeCanvas } from "@/features/tao-cv/components/theme-canvas";
import {
  deleteDbThemeBySlug,
  fetchDbThemeBySlugOrId,
  parseDbTheme,
  syncThemeToDb,
} from "@/features/tao-cv/services/theme-db-sync";
import {
  cloneThemeConfig,
  deleteTheme,
  newThemeDraft,
  saveTheme,
} from "@/features/tao-cv/services/theme-storage";
import {
  createDefaultLayoutConfig,
  type ResumeData,
} from "@/features/tao-cv/resume-data";
import type {
  CvThemeConfig,
  ThemeCategory,
  ThemeLevel,
} from "@/features/tao-cv/types/theme-studio";
import {
  THEME_CATEGORIES,
  THEME_LEVELS,
  slugifyThemeName,
} from "@/features/tao-cv/types/theme-studio";
import {
  THEME_STUDIO_TAB_ITEMS,
  ThemeStudioControls,
} from "@/features/tao-cv/components/theme-studio-controls";

/* ── Dummy resume: full data để soi 100% thay đổi ─────────── */

function dummyResume(): ResumeData {
  return {
    name: "Nguyễn Văn An",
    title: "Fullstack Developer",
    avatarUrl: "/avatar-placeholder.svg",
    summary: "Lập trình viên 3 năm kinh nghiệm React, Node.js và PostgreSQL.",
    contacts: [
      { label: "Email", value: "an.nguyen@email.com" },
      { label: "Điện thoại", value: "0901 234 567" },
    ],
    experience: [
      {
        id: "dummy-exp-1",
        role: "Backend Developer",
        company: "Cohota",
        range: { start: "06/2021", end: "Hiện tại", current: true },
        isCurrent: true,
        description: "Xây dựng LMS và hệ thống thi trực tuyến.",
        skills: ["Node.js", "PostgreSQL"],
      },
    ],
    education: [
      {
        id: "dummy-edu-1",
        school: "Đại học Công Thương TP. Hồ Chí Minh",
        degree: "Công nghệ Phần mềm",
        range: { start: "2018", end: "2022" },
      },
    ],
    skills: [
      { id: "dummy-sk-1", name: "TypeScript" },
      { id: "dummy-sk-2", name: "React" },
      { id: "dummy-sk-3", name: "Docker" },
    ],
    projects: [
      {
        id: "dummy-pr-1",
        name: "Bookom",
        role: "Lead Backend",
        description: "Sàn thương mại điện tử multi-vendor.",
        tech: ["Spring Boot", "PostgreSQL"],
        range: { start: "01/2023", end: "06/2023" },
      },
    ],
    certificates: [{ id: "dummy-ce-1", name: "AWS Basics", issuer: "Amazon" }],
    hasContent: true,
    layout: createDefaultLayoutConfig(),
  };
}

/* ── WCAG contrast ───────────────────────────────────────── */

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const rgb = [0, 2, 4].map((i) => {
    const v = Number.parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const STRUCTURE_LABELS: Record<string, string> = {
  single: "1 cột",
  "sidebar-left": "Sidebar trái",
  "sidebar-right": "Sidebar phải",
  "banner-top": "Banner ngang",
};

/* ── Workbench ───────────────────────────────────────────── */

function StudioWorkbench() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editKey = searchParams.get("slug") ?? searchParams.get("id") ?? "";
  const [theme, setTheme] = useState<CvThemeConfig>(() => newThemeDraft());
  const [loadingTheme, setLoadingTheme] = useState(editKey !== "");
  const [saving, setSaving] = useState(false);
  // Slug DB đang sửa (chế độ edit); null = tạo mới.
  const [loadedDbSlug, setLoadedDbSlug] = useState<string | null>(null);
  // Slug đã chạm tay -> ngừng auto-gen theo tên.
  const [slugTouched, setSlugTouched] = useState(false);
  const initialRef = useRef<CvThemeConfig | null>(null);
  const [fitMode, setFitMode] = useState(true);
  const [fitScale, setFitScale] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dummy = useMemo(() => dummyResume(), []);

  // Modal "Khởi tạo từ mẫu có sẵn": liệt kê theme Studio đã lưu trên DB.
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneRows, setCloneRows] = useState<CvThemeVm[]>([]);
  const [cloneQuery, setCloneQuery] = useState("");

  const cloneFiltered = useMemo(() => {
    const q = cloneQuery.trim().toLowerCase();
    if (!q) return cloneRows;
    return cloneRows.filter(
      (t) =>
        (t.Ten ?? "").toLowerCase().includes(q) ||
        (t.Slug ?? "").toLowerCase().includes(q),
    );
  }, [cloneRows, cloneQuery]);

  // Card thumbnail cho modal clone: parse config để lấy gradient + palette.
  const cloneCards = useMemo(
    () => cloneFiltered.map((row) => ({ row, theme: parseDbTheme(row) })),
    [cloneFiltered],
  );

  /** Nạp thẳng 1 bản clone (không đè mẫu gốc) và chuyển sang chế độ tạo mới. */
  const adoptClone = (draft: CvThemeConfig) => {
    initialRef.current = draft;
    setTheme(draft);
    setLoadedDbSlug(null);
    setSlugTouched(false);
  };

  const openClonePicker = async () => {
    setCloneOpen(true);
    setCloneQuery("");
    setCloneLoading(true);
    try {
      const list = await cvThemesApi.list();
      // Chỉ theme có CauHinhJson mới dựng lại được trong Studio.
      setCloneRows(list.filter((t) => !!t.CauHinhJson));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh mục theme");
      setCloneRows([]);
    } finally {
      setCloneLoading(false);
    }
  };

  const cloneFromRow = (row: CvThemeVm) => {
    const parsed = parseDbTheme(row);
    if (!parsed) {
      toast.error("Theme này chưa có cấu hình Studio để nhân bản");
      return;
    }
    adoptClone(cloneThemeConfig(parsed, `${parsed.name} (bản sao)`));
    setCloneOpen(false);
    toast.success("Đã nhân bản mẫu — sửa tên/slug rồi Lưu để tạo theme mới");
  };

  /** Tách theme đang sửa thành bản mới (sinh id/slug mới, KHÔNG đè bản gốc). */
  const handleSaveAsNew = () => {
    adoptClone(cloneThemeConfig(theme, `${theme.name} (bản sao)`));
    toast.info("Đã tách thành mẫu mới — đổi tên/slug rồi bấm Lưu");
  };

  const patch = (p: Partial<CvThemeConfig>) =>
    setTheme((t) => ({ ...t, ...p }));

  // Chế độ sửa (?slug= / ?id=): nạp config từ DB (source of truth bảng admin).
  useEffect(() => {
    if (!editKey) {
      const draft = newThemeDraft();
      initialRef.current = draft;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(draft);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingTheme(true);
      try {
        const found = await fetchDbThemeBySlugOrId(editKey);
        if (cancelled) return;
        if (found) {
          initialRef.current = found;
          setTheme(found);
          setLoadedDbSlug(found.slug);
          setSlugTouched(true);
        } else {
          toast.error(`Không tìm thấy theme "${editKey}" — tạo mới thay thế`);
          const draft = newThemeDraft();
          initialRef.current = draft;
          setTheme(draft);
        }
      } catch (e) {
        if (!cancelled)
          toast.error(e instanceof Error ? e.message : "Không nạp được theme");
      } finally {
        if (!cancelled) setLoadingTheme(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editKey]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let timer = 0;
    let prev = 0;
    const apply = (w: number) => {
      if (Math.abs(w - prev) <= 12 || w <= 0) return;
      prev = w;
      setFitScale(Math.min((w - 48) / 794, 1));
    };
    apply(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w == null) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => apply(w), 150);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  const visibleCount = theme.layout.sectionOrder.filter(
    (id) => theme.layout.sections[id]?.isVisible !== false,
  ).length;
  const ratio = contrastRatio(
    theme.colors.textPrimary,
    theme.colors.paperBackground,
  );
  const auditName = theme.name.trim().length >= 4;
  const auditSections = visibleCount >= 3;
  const auditContrast = ratio >= 4.5;
  const isAuditPassed = auditName && auditSections && auditContrast;

  const handleSave = async () => {
    const slug = (theme.slug.trim() || slugifyThemeName(theme.name)).trim();
    if (!auditName || !slug || saving) return;
    setSaving(true);
    try {
      const next: CvThemeConfig = {
        ...theme,
        slug,
        name: theme.name.trim(),
        policy: {
          ...theme.policy,
          approvedAt: theme.policy.policyApproved
            ? new Date().toISOString()
            : theme.policy.approvedAt,
        },
      };
      // Ghi DB trước (source of truth bảng admin); rớt thì ở lại + toast đỏ.
      const synced = await syncThemeToDb(next);
      if (synced.mode === "local-only") {
        saveTheme(next);
        setTheme(next);
        toast.error(`Lưu local, chưa vào bảng quản trị (DB: ${synced.error})`);
        return;
      }
      saveTheme(next);
      setTheme(next);
      toast.success("Đã lưu theme vào danh mục quản trị");
      router.push("/admin/cv/themes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (theme.isDefault) return;
    deleteTheme(theme.id);
    const slug = theme.slug.trim() || theme.id;
    const removed = await deleteDbThemeBySlug(slug);
    if (!removed) {
      toast.error("Đã xóa bản local, nhưng chưa xóa được dòng trên DB");
      return;
    }
    toast.success("Đã xóa theme");
    router.push("/admin/cv/themes");
  };

  const handleReset = () => {
    if (initialRef.current) {
      setTheme({ ...initialRef.current });
      setSlugTouched(loadedDbSlug !== null);
    } else {
      setTheme(newThemeDraft());
      setSlugTouched(false);
    }
  };

  const previewData: ResumeData = useMemo(
    () => ({ ...dummy, layout: theme.layout }),
    [dummy, theme.layout],
  );
  const zoomPct = fitMode ? Math.max(10, Math.round(100 * fitScale)) : 100;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Quản trị / Theme Studio
          </p>
          <h1 className="text-lg font-semibold tracking-tight">
            {loadedDbSlug ? "Sửa theme CV" : "Tạo theme CV"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/cv/themes")}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Quay lại danh sách
          </Button>
          <Button variant="outline" size="sm" onClick={() => void openClonePicker()}>
            <Copy className="mr-1.5 size-4" />
            Tạo từ mẫu có sẵn
          </Button>
          {loadedDbSlug && (
            <Button variant="outline" size="sm" onClick={handleSaveAsNew}>
              <FilePlus2 className="mr-1.5 size-4" />
              Lưu thành mẫu mới
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 size-4" />
            Hủy / Làm mới
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={!auditName || saving}>
            <Save className="mr-1.5 size-4" />
            {saving ? "Đang lưu…" : "Lưu Theme"}
          </Button>
        </div>
      </div>
      {loadingTheme && (
        <p className="mb-3 text-sm text-muted-foreground" role="status">
          Đang nạp theme từ danh mục quản trị…
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[460px_minmax(0,1fr)]">
        {/* Dock trái */}
        <div className="min-w-0 rounded-xl border border-border/50 bg-card">
          <Tabs defaultValue="layout" className="p-5">
            <TabsList className="grid w-full grid-cols-4 overflow-x-auto">
              {THEME_STUDIO_TAB_ITEMS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="px-2 text-xs"
                >
                  {t.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="publish" className="px-2 text-xs">
                Xuất bản
              </TabsTrigger>
            </TabsList>

            <ThemeStudioControls theme={theme} onChange={setTheme} />

            <TabsContent value="publish" className="mt-4 space-y-3">
              <div>
                <Label htmlFor="theme-name">Tên theme *</Label>
                <Input
                  id="theme-name"
                  value={theme.name}
                  maxLength={80}
                  onChange={(e) => {
                    const v = e.target.value;
                    patch(
                      slugTouched
                        ? { name: v }
                        : { name: v, slug: slugifyThemeName(v) },
                    );
                  }}
                  placeholder="VD: Fullstack Dev Theme 2026"
                  className="mt-1.5"
                  aria-describedby="theme-name-hint"
                />
                <p
                  id="theme-name-hint"
                  className={
                    theme.name.trim().length >= 4
                      ? "mt-1 text-[11px] text-teal"
                      : "mt-1 text-[11px] font-medium text-destructive"
                  }
                >
                  {theme.name.trim().length >= 4
                    ? "Tên hợp lệ — đủ điều kiện lưu theme."
                    : `Tên cần tối thiểu 4 ký tự mới lưu được (đang ${theme.name.trim().length}).`}
                </p>
              </div>
              <div>
                <Label htmlFor="theme-desc">Mô tả</Label>
                <Textarea
                  id="theme-desc"
                  value={theme.description ?? ""}
                  maxLength={220}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Ngắn gọn cách dùng theme này…"
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              {/* Metadata hiển thị trên bảng Quản lý CV/mẫu CV */}
              <div>
                <Label htmlFor="theme-slug">Slug / Mã định danh</Label>
                <Input
                  id="theme-slug"
                  value={theme.slug}
                  maxLength={60}
                  onChange={(e) => {
                    setSlugTouched(true);
                    patch({ slug: slugifyThemeName(e.target.value) });
                  }}
                  placeholder="vd: dev-emerald-pro (tự gen theo tên)"
                  className="mt-1.5 font-mono text-xs"
                />
                {loadedDbSlug && theme.slug !== loadedDbSlug && (
                  <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                    Đổi slug sẽ tạo dòng mới trên bảng quản trị (dòng cũ giữ nguyên).
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="theme-category">Danh mục</Label>
                  <Select
                    value={theme.category}
                    onValueChange={(v) => patch({ category: v as ThemeCategory })}
                  >
                    <SelectTrigger id="theme-category" className="mt-1.5">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="theme-level">Cấp bậc</Label>
                  <Select
                    value={theme.level}
                    onValueChange={(v) => patch({ level: v as ThemeLevel })}
                  >
                    <SelectTrigger id="theme-level" className="mt-1.5">
                      <SelectValue placeholder="Chọn cấp bậc" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_LEVELS.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="text-sm">
                  <p className="font-medium">Chuẩn ATS</p>
                  <p className="text-xs text-muted-foreground">
                    Bật = 1 cột, máy quét CV đọc được
                  </p>
                </div>
                <Switch
                  id="theme-ats"
                  checked={theme.atsFriendly}
                  onCheckedChange={(v) => patch({ atsFriendly: v === true })}
                  aria-label="Chuẩn ATS"
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="text-sm">
                  <p className="font-medium">Hiển thị</p>
                  <p className="text-xs text-muted-foreground">
                    Hiện dòng này trên bảng quản trị
                  </p>
                </div>
                <Switch
                  id="theme-published"
                  checked={theme.policy.isPublished}
                  onCheckedChange={(v) =>
                    patch({
                      policy: { ...theme.policy, isPublished: v === true },
                    })
                  }
                  aria-label="Hiển thị theme"
                />
              </div>

              <ul className="space-y-2 rounded-lg border border-dashed border-input bg-muted/40 px-3 py-2.5 text-xs leading-5">
                <li className="flex gap-1.5">
                  <span
                    className={
                      auditName ? "text-teal" : "text-muted-foreground"
                    }
                  >
                    {auditName ? <Check className="size-3.5" /> : "○"}
                  </span>
                  <span>Tên theme định danh hợp lệ (≥ 4 ký tự)</span>
                </li>
                <li className="flex gap-1.5">
                  <span
                    className={
                      auditSections ? "text-teal" : "text-muted-foreground"
                    }
                  >
                    {auditSections ? <Check className="size-3.5" /> : "○"}
                  </span>
                  <span>
                    Section hiển thị tối thiểu ≥ 3 mục (đang {visibleCount})
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span
                    className={
                      auditContrast ? "text-teal" : "text-muted-foreground"
                    }
                  >
                    {auditContrast ? <Check className="size-3.5" /> : "○"}
                  </span>
                  <span>
                    Tương phản chữ/nền đạt chuẩn đọc (tỉ lệ {ratio.toFixed(1)}
                    :1)
                  </span>
                </li>
              </ul>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <div className="text-sm">
                  <p className="font-medium">Kích hoạt chính sách phát hành</p>
                  <p className="text-xs text-muted-foreground">
                    Bật thì ứng viên ở /tao-cv mới thấy theme này
                  </p>
                </div>
                <Switch
                  id="policy-toggle"
                  disabled={!isAuditPassed}
                  checked={theme.policy.policyApproved}
                  onCheckedChange={(v) =>
                    patch({
                      policy: {
                        ...theme.policy,
                        policyApproved: v,
                        approvedAt: v ? new Date().toISOString() : undefined,
                      },
                    })
                  }
                  aria-label="Kích hoạt chính sách phát hành"
                />
              </div>
              <div>
                <Label htmlFor="policy-notes">Ghi chú phiên bản</Label>
                <Textarea
                  id="policy-notes"
                  value={theme.policy.notes ?? ""}
                  maxLength={220}
                  onChange={(e) =>
                    patch({
                      policy: { ...theme.policy, notes: e.target.value },
                    })
                  }
                  rows={2}
                  className="mt-1.5"
                  placeholder="VD: v1.0 — palette emerald cho IT…"
                />
              </div>
              <Button
                size="lg"
                className="mt-4 w-full"
                onClick={() => void handleSave()}
                disabled={!auditName || saving}
              >
                <Save className="mr-1.5 size-4" />
                {saving ? "Đang lưu…" : "Lưu Theme & Cập nhật Bảng"}
              </Button>
              {!theme.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive"
                  onClick={() => void handleDelete()}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Xóa theme này
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview phải */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Xem trước trực tiếp</h2>
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center rounded-full border border-border bg-card"
                role="group"
                aria-label="Zoom preview"
              >
                <button
                  type="button"
                  onClick={() => setFitMode(true)}
                  aria-pressed={fitMode}
                  className={`flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold transition ${fitMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setFitMode(false)}
                  aria-pressed={!fitMode}
                  className={`flex h-7 items-center rounded-full px-2.5 font-mono text-[11px] font-semibold transition ${fitMode ? "text-muted-foreground hover:bg-muted" : "bg-primary text-primary-foreground"}`}
                >
                  100%
                </button>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {zoomPct}%
              </span>
            </div>
          </div>
          <div
            ref={scrollerRef}
            style={{ scrollbarGutter: "stable" }}
            className="flex max-h-[calc(100vh-160px)] min-h-[60vh] flex-col items-center gap-8 overflow-y-auto overflow-x-hidden rounded-xl bg-slate-200/70 p-6 dark:bg-zinc-900"
          >
            <div
              className="w-full max-w-[210mm]"
              style={{ zoom: `${zoomPct}%` } as React.CSSProperties}
            >
              <ThemeCanvas theme={theme} data={previewData} />
              <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
                Live preview — theme “{theme.name || "chưa đặt tên"}”
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Button
              onClick={() => adoptClone(newThemeDraft())}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <Plus className="mr-1.5 size-3.5" />
              Theme mới từ mẫu trắng
            </Button>
          </div>
        </div>
      </div>

      <DialogPrimitive.Root open={cloneOpen} onOpenChange={setCloneOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Popup className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card p-5 shadow-xl outline-none">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Copy className="size-5" />
                </span>
                <div className="min-w-0">
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                    Khởi tạo từ mẫu có sẵn
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                    Nhân bản một theme Studio thành bản mới rồi tùy biến sâu.
                    Mẫu gốc không bị thay đổi.
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  aria-label="Đóng"
                  className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={cloneQuery}
                  onChange={(e) => setCloneQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc slug…"
                  className="pl-9"
                  aria-label="Tìm theme mẫu"
                />
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                {cloneLoading ? (
                  <p
                    className="flex items-center gap-2 py-8 text-sm text-muted-foreground"
                    role="status"
                  >
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải danh mục theme…
                  </p>
                ) : cloneFiltered.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {cloneRows.length === 0
                      ? "Chưa có theme Studio nào để nhân bản."
                      : "Không có theme khớp từ khóa."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cloneCards.map(({ row, theme }) => (
                      <button
                        key={row.Id}
                        type="button"
                        onClick={() => cloneFromRow(row)}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/50 hover:shadow-sm"
                      >
                        <span
                          className="relative block h-24 w-full overflow-hidden"
                          style={{
                            background:
                              theme?.thumbnailGradient ??
                              "linear-gradient(135deg,#1e293b,#0ea5e9)",
                          }}
                        >
                          <span className="absolute inset-x-4 bottom-0 top-4 rounded-t-md bg-white/95 shadow-sm" />
                          <span
                            className="absolute left-6 right-6 top-6 h-1.5 rounded-full"
                            style={{
                              background:
                                theme?.colors.primary ?? "#1e293b",
                            }}
                          />
                          <span
                            className="absolute left-6 top-9 h-1 w-16 rounded-full"
                            style={{
                              background:
                                theme?.colors.secondary ?? "#475569",
                            }}
                          />
                          <span
                            className={cn(
                              "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium",
                              row.IsActive
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-white/80 text-muted-foreground",
                            )}
                          >
                            {row.IsActive ? "Đang hiển thị" : "Bản nháp"}
                          </span>
                        </span>
                        <span className="flex flex-1 flex-col gap-1 p-3">
                          <span className="truncate text-sm font-medium text-foreground">
                            {row.Ten || row.Slug}
                          </span>
                          <span className="truncate font-mono text-[11px] text-muted-foreground">
                            {row.Slug}
                          </span>
                          <span className="mt-1 flex items-center gap-1">
                            {[
                              theme?.colors.primary,
                              theme?.colors.secondary,
                              theme?.colors.paperBackground,
                            ].map((c, i) => (
                              <span
                                key={i}
                                className="size-4 rounded-full border border-border"
                                style={{ background: c ?? "#e2e8f0" }}
                              />
                            ))}
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {STRUCTURE_LABELS[theme?.structure ?? "single"] ??
                                "1 cột"}
                            </span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </DialogPrimitive.Popup>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

export default function ThemeStudioPage() {
  return (
    <AdminGate>
      <Suspense
        fallback={
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Đang tải Theme Studio…
          </p>
        }
      >
        <StudioWorkbench />
      </Suspense>
    </AdminGate>
  );
}
