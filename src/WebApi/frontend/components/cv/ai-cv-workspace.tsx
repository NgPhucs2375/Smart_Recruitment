"use client";

import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { CopilotChat } from "@copilotkit/react-core/v2";
import { CheckCircle2, FileDown, FilePlus2, FileText, Save, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

import { CvDocument } from "@/components/cv/cv-document";
import { defaultCvData } from "@/features/tao-cv/constants";
import { createManualCvPayload } from "@/features/tao-cv/manual";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_REGISTRY } from "@/features/tao-cv/template-registry";
import { useCvAssistant } from "@/hooks/use-cv-assistant";
import { cvApi } from "@/lib/api/cv-api";
import type { CvFormData } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adamMessageView } from "@/components/ai/adam-markdown";
import { focusCvSectionInDom, getCvFocusEventName, type CvFocusSection } from "@/features/ai-cv/cv-focus";

const cloneDefaultCv = (): CvFormData => JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;

export function AiCvWorkspace() {
  const documentRef = useRef<HTMLDivElement>(null);
  const [cvData, setCvData] = useState<CvFormData>(cloneDefaultCv);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const onFocus = (event: Event) => {
      const section = (event as CustomEvent<{ section?: unknown }>).detail?.section;
      if (typeof section === "string") focusCvSectionInDom(section as CvFocusSection);
    };
    window.addEventListener(getCvFocusEventName(), onFocus);
    return () => window.removeEventListener(getCvFocusEventName(), onFocus);
  }, []);

  useCvAssistant({
    data: cvData,
    onChange: (next) => { setCvData(next); setDirty(true); },
    ready: true,
    enabled: true,
  });

  const saveCv = async () => {
    if (!hasPreviewContent(cvData)) {
      toast.info("Hãy điền ít nhất họ tên hoặc một phần nội dung trước khi lưu.");
      return;
    }
    setSaving(true);
    try {
      const profile = await cvApi.getMyHoSo();
      await cvApi.saveVersion({ ...createManualCvPayload(profile.id, cvData, true), phuongThucTao: 3 });
      setDirty(false);
      toast.success("Đã lưu CV vào hồ sơ của bạn.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu CV.");
    } finally {
      setSaving(false);
    }
  };

  const resetCv = () => {
    setCvData(cloneDefaultCv());
    setDirty(true);
  };

  return (
    <main className="cv-workspace">
      <header className="cv-workspace__topbar">
        <div className="cv-workspace__title">
          <div className="cv-workspace__brandmark"><Sparkles className="size-4" /></div>
          <div>
            <span className="cv-workspace__eyebrow">AI CV STUDIO</span>
            <h1>Tạo CV cùng Adam</h1>
          </div>
        </div>
        <div className="cv-workspace__actions">
          <Badge variant={dirty ? "secondary" : "outline"} className="cv-status">
            <span className={dirty ? "cv-status__dot cv-status__dot--dirty" : "cv-status__dot"} />
            {dirty ? "Chưa lưu thay đổi" : "Đã sẵn sàng"}
          </Badge>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <Button type="button" variant="outline" size="sm" onClick={resetCv}><FilePlus2 className="size-4" /> <span className="hidden sm:inline">CV mới</span></Button>
          <Button type="button" size="sm" disabled={saving} onClick={saveCv}><Save className="size-4" /> {saving ? "Đang lưu" : "Lưu CV"}</Button>
        </div>
      </header>

      <div className="cv-workspace__body">
        <aside className="cv-assistant-column">
          <ChatPanel />
        </aside>
        <PreviewPanel data={cvData} zoom={zoom} setZoom={setZoom} documentRef={documentRef} onTemplateChange={(templateId) => { setCvData((current) => ({ ...current, templateId })); setDirty(true); }} />
      </div>
    </main>
  );
}

function ChatPanel() {
  return (
    <section className="cv-chat">
      <div className="cv-chat__bar">
        <div className="cv-chat__identity"><span className="cv-avatar"><Sparkles className="size-4" /></span><div><strong>Adam</strong><span>Trợ lý tạo CV · Realtime</span></div></div>
        <span className="cv-online"><i /> Online</span>
      </div>
      <div className="cv-chat__content">
        <CopilotChat
          className="cv-chat__copilot"
          messageView={adamMessageView}
          labels={{ welcomeMessageText: "Bạn muốn bắt đầu với phần nào của CV?", chatInputPlaceholder: "Nhập yêu cầu cho Adam..." }}
        />
      </div>
    </section>
  );
}

function PreviewPanel({ data, zoom, setZoom, documentRef, onTemplateChange }: { data: CvFormData; zoom: number; setZoom: Dispatch<SetStateAction<number>>; documentRef: RefObject<HTMLDivElement | null>; onTemplateChange: (templateId: string) => void }) {
  const template = TEMPLATE_REGISTRY[data.templateId];
  return (
    <Card className="cv-preview">
      <div className="cv-preview__bar">
        <div className="cv-preview__label"><FileText size={16} /><strong>Preview CV</strong><span>Realtime</span></div>
         <Select value={data.templateId} onValueChange={(value) => { if (value !== null) onTemplateChange(value); }}>
           <SelectTrigger className="h-9 w-44" aria-label="Chọn mẫu CV"><SelectValue placeholder="Chọn mẫu" /></SelectTrigger>
           <SelectContent>
             {Object.values(TEMPLATE_REGISTRY).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
           </SelectContent>
         </Select>
         <div className="cv-zoom"><Button variant="ghost" size="icon-sm" type="button" aria-label="Thu nhỏ" disabled={zoom <= 0.8} onClick={() => setZoom((value) => Math.max(0.8, +(value - 0.1).toFixed(2)))}><ZoomOut className="size-4" /></Button><span>{Math.round(zoom * 100)}%</span><Button variant="ghost" size="icon-sm" type="button" aria-label="Phóng to" disabled={zoom >= 1.2} onClick={() => setZoom((value) => Math.min(1.2, +(value + 0.1).toFixed(2)))}><ZoomIn className="size-4" /></Button></div>
         <Button variant="outline" size="sm" type="button" onClick={() => window.print()}><FileDown className="size-4" /> PDF</Button>
      </div>
      <div className="cv-preview__canvas">
        {hasPreviewContent(data) ? <div className="cv-document" style={{ width: `${100 / zoom}%`, transform: `scale(${zoom})` }}><CvDocument data={data} documentRef={documentRef} /></div> : <EmptyPreview />}
      </div>
      <div className="cv-preview__footer"><span>{template?.name ?? DEFAULT_TEMPLATE_ID}</span><span>Chỉ lưu khi bạn bấm Lưu CV</span></div>
    </Card>
  );
}

function EmptyPreview() {
  return <div className="cv-empty"><span className="cv-empty__icon"><FileText className="size-7" /></span><strong>Preview sẽ xuất hiện ở đây</strong><span>Hãy trò chuyện với Adam hoặc chọn mẫu để bắt đầu.</span><div className="cv-empty__hint"><CheckCircle2 className="size-4" /> Nội dung được cập nhật realtime</div></div>;
}

function hasPreviewContent(data: CvFormData) {
  return Boolean(data.thongTinLienHe.hoTen.trim() || data.thongTinLienHe.gioiThieuBanThan.trim() || data.hocVan.length || data.kinhNghiemLamViec.length || data.duAn.length || data.kyNang.length || data.chungChi.length);
}
