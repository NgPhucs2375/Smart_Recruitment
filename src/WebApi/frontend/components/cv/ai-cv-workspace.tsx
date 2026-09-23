"use client";

import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { CopilotChat, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { useRouter } from "next/navigation";
import { FileDown, FilePlus2, FileText, LayoutTemplate, Save, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

import { CvDocument } from "@/components/cv/cv-document";
import { defaultCvData } from "@/features/tao-cv/constants";
import { createManualCvPayload } from "@/features/tao-cv/manual";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_REGISTRY } from "@/features/tao-cv/template-registry";
import { useCvAssistant } from "@/hooks/use-cv-assistant";
import { cvApi } from "@/lib/api/cv-api";
import type { CvFormData } from "@/lib/types";

const CHAT_SUGGESTIONS = [
  { title: "Tạo CV từ đầu", message: "Hãy giúp tôi tạo một CV mới. Hỏi tôi các thông tin còn thiếu theo từng bước." },
  { title: "Điền liên hệ", message: "Hãy hỏi tôi các thông tin liên hệ còn thiếu và điền trực tiếp vào CV." },
  { title: "Tối ưu ATS", message: "Hãy kiểm tra CV hiện tại và áp dụng các cải thiện giúp CV thân thiện với ATS." },
  { title: "Viết lại kinh nghiệm", message: "Hãy viết lại phần kinh nghiệm hiện tại theo hướng định lượng thành tích, không bịa thông tin." },
];

const cloneDefaultCv = (): CvFormData => JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;

export function AiCvWorkspace() {
  const router = useRouter();
  const documentRef = useRef<HTMLDivElement>(null);
  const [cvData, setCvData] = useState<CvFormData>(cloneDefaultCv);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

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
          <span className="cv-workspace__eyebrow"><Sparkles size={14} /> AI CV WORKSPACE</span>
          <h1>Tạo CV cùng Adam</h1>
        </div>
        <div className="cv-workspace__actions">
          <span className={dirty ? "cv-status cv-status--dirty" : "cv-status"}>{dirty ? "Chưa lưu" : "Sẵn sàng"}</span>
          <button type="button" className="cv-button cv-button--quiet" onClick={resetCv}><FilePlus2 size={15} /> CV mới</button>
          <button type="button" className="cv-button cv-button--primary" disabled={saving} onClick={saveCv}><Save size={15} /> {saving ? "Đang lưu" : "Lưu CV"}</button>
        </div>
      </header>

      <div className="cv-workspace__body">
        <aside className="cv-assistant-column">
          <AssistantGuide router={router} />
          <ChatPanel />
        </aside>
        <PreviewPanel data={cvData} zoom={zoom} setZoom={setZoom} documentRef={documentRef} onTemplateChange={(templateId) => { setCvData((current) => ({ ...current, templateId })); setDirty(true); }} />
      </div>
    </main>
  );
}

function AssistantGuide({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <section className="cv-guide">
      <div className="cv-guide__heading"><span className="cv-avatar"><Sparkles size={16} /></span><div><strong>Adam</strong><span>Trợ lý CV của bạn</span></div></div>
      <p className="cv-guide__description">Nói cho Adam biết mục tiêu của bạn. Tôi sẽ cập nhật nội dung và preview ngay trong workspace.</p>
      <div className="cv-guide__steps"><span><b>1</b> Nói yêu cầu</span><span><b>2</b> Kiểm tra preview</span><span><b>3</b> Tự quyết định lưu</span></div>
      <button type="button" className="cv-link-button" onClick={() => router.push("/mau-cv")}><LayoutTemplate size={14} /> Xem thư viện mẫu</button>
    </section>
  );
}

function ChatPanel() {
  useConfigureSuggestions({ suggestions: CHAT_SUGGESTIONS, available: "before-first-message", consumerAgentId: "default" });
  return (
    <section className="cv-chat">
      <div className="cv-chat__bar"><div><strong>Trò chuyện với Adam</strong><span>Thay đổi CV realtime</span></div><span className="cv-online"><i /> Online</span></div>
      <div className="cv-chat__content">
        <CopilotChat
          className="cv-chat__copilot"
          labels={{ welcomeMessageText: "Bạn muốn bắt đầu với phần nào của CV?", chatInputPlaceholder: "Nhập yêu cầu cho Adam..." }}
        />
      </div>
    </section>
  );
}

function PreviewPanel({ data, zoom, setZoom, documentRef, onTemplateChange }: { data: CvFormData; zoom: number; setZoom: Dispatch<SetStateAction<number>>; documentRef: RefObject<HTMLDivElement | null>; onTemplateChange: (templateId: string) => void }) {
  const template = TEMPLATE_REGISTRY[data.templateId];
  return (
    <section className="cv-preview">
      <div className="cv-preview__bar">
        <div className="cv-preview__label"><FileText size={16} /><strong>Preview CV</strong><span>Realtime</span></div>
        <select value={data.templateId} onChange={(event) => onTemplateChange(event.target.value)} aria-label="Chọn mẫu CV"><option value="">Chọn mẫu</option>{Object.values(TEMPLATE_REGISTRY).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <div className="cv-zoom"><button type="button" aria-label="Thu nhỏ" disabled={zoom <= 0.8} onClick={() => setZoom((value) => Math.max(0.8, +(value - 0.1).toFixed(2)))}><ZoomOut size={14} /></button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="Phóng to" disabled={zoom >= 1.2} onClick={() => setZoom((value) => Math.min(1.2, +(value + 0.1).toFixed(2)))}><ZoomIn size={14} /></button></div>
        <button type="button" className="cv-button cv-button--quiet" onClick={() => window.print()}><FileDown size={15} /> PDF</button>
      </div>
      <div className="cv-preview__canvas">
        {hasPreviewContent(data) ? <div className="cv-document" style={{ width: `${100 / zoom}%`, transform: `scale(${zoom})` }}><CvDocument data={data} documentRef={documentRef} /></div> : <EmptyPreview />}
      </div>
      <div className="cv-preview__footer"><span>{template?.name ?? DEFAULT_TEMPLATE_ID}</span><span>Chỉ lưu khi bạn bấm Lưu CV</span></div>
    </section>
  );
}

function EmptyPreview() {
  return <div className="cv-empty"><FileText size={28} /><strong>Preview sẽ xuất hiện ở đây</strong><span>Hãy trò chuyện với Adam để bắt đầu điền CV.</span></div>;
}

function hasPreviewContent(data: CvFormData) {
  return Boolean(data.thongTinLienHe.hoTen.trim() || data.thongTinLienHe.gioiThieuBanThan.trim() || data.hocVan.length || data.kinhNghiemLamViec.length || data.duAn.length || data.kyNang.length || data.chungChi.length);
}
