"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TEMPLATE_REGISTRY, SAMPLE_RESUME } from "@/features/tao-cv/template-registry";
import { loadPendingCvPatch, savePendingCvPatch } from "@/features/ai-cv/cv-assistant-state";
import { ensureActiveTemplate, requestEditorTemplate, type ThemeRecommendation } from "@/features/ai-cv/theme-recommendations";

export default function CvThemeRecommendations({ items, message }: { items: ThemeRecommendation[]; message: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter(); const pathname = usePathname();
  const template = preview ? TEMPLATE_REGISTRY[preview] : null;
  const apply = async (slug: string) => {
    setBusy(slug);
    try {
      if (pathname === "/CV" || pathname === "/tao-cv") {
        const result = await requestEditorTemplate(slug);
        if (!result.success) throw new Error(result.message);
        toast.success(result.message);
      } else {
        await ensureActiveTemplate(slug);
        const pending = loadPendingCvPatch();
        savePendingCvPatch({ contact: pending?.contact, sections: pending?.sections, tenFile: pending?.tenFile, templateId: slug });
        router.push("/CV");
        toast.success("Đang mở mẫu trong bản nháp; chưa lưu CV.");
      }
      setPreview(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không áp dụng được mẫu."); }
    finally { setBusy(null); }
  };
  const supported = items.filter(item => TEMPLATE_REGISTRY[item.slug]);
  return <section className="space-y-3 rounded-xl border border-border bg-card p-3" aria-label="Mẫu CV được đề xuất">
    <h3 className="text-sm font-semibold">{supported.length ? `${supported.length} mẫu theo mục tiêu của bạn` : "Chưa có mẫu khớp yêu cầu"}</h3>
    {!supported.length && <p role="status" className="text-sm text-muted-foreground">{message || "Thử cung cấp ngành, cấp độ hoặc nới điều kiện bố cục."}</p>}
    {supported.map((item, index) => <article key={item.slug} className="space-y-2 border-t border-border pt-3">
      <div className="flex items-start justify-between gap-2"><strong className="text-sm">{index + 1}. {item.name}</strong><Badge variant="secondary">{Math.round(item.score * 100)} điểm</Badge></div>
      <p className="text-sm">{item.reason || item.description}</p>
      <div className="flex flex-wrap gap-1"><Badge variant="outline">{item.columns} cột</Badge>{item.level && <Badge variant="outline">{item.level}</Badge>}{item.ats && <Badge variant="outline">Nhãn ATS</Badge>}</div>
      {item.warnings.length > 0 && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Điểm cần cân nhắc</summary><ul className="mt-1 list-disc space-y-1 pl-4">{item.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></details>}
      <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPreview(item.slug)}>Xem trước</Button><Button size="sm" disabled={busy !== null} onClick={() => void apply(item.slug)}>{busy === item.slug ? "Đang áp dụng..." : "Dùng mẫu"}</Button></div>
    </article>)}
    <p className="text-xs text-muted-foreground">Điểm xếp hạng mẫu, không phải xác suất được tuyển. Nhãn ATS dựa trên metadata. Áp dụng chỉ đổi bố cục bản nháp.</p>
    <DialogPrimitive.Root open={template !== null} onOpenChange={open => { if (!open) setPreview(null); }}>
      <DialogPrimitive.Portal><DialogPrimitive.Backdrop className="fixed inset-0 z-[10000] bg-black/50" /><div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <DialogPrimitive.Popup className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3"><div><DialogPrimitive.Title className="font-semibold">{template?.name ?? "Xem trước"}</DialogPrimitive.Title><DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">Minh họa bằng dữ liệu mẫu, không phải nội dung CV của bạn.</DialogPrimitive.Description></div><DialogPrimitive.Close className="rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring">Đóng</DialogPrimitive.Close></div>
        {template && <div className="overflow-hidden rounded-lg border bg-white text-black"><template.Component data={SAMPLE_RESUME} /></div>}
        {template && <Button disabled={busy !== null} onClick={() => void apply(template.id)}>Dùng mẫu trong bản nháp</Button>}
      </DialogPrimitive.Popup></div></DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  </section>;
}
