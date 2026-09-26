"use client";

import {
  useEffect,
  forwardRef,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type HTMLAttributes,
  type ReactElement,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  CopilotChat,
  CopilotChatSuggestionView,
  useAgent,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileDown,
  FilePenLine,
  FilePlus2,
  FileText,
  PencilLine,
  Save,
  ScanSearch,
  Sparkles,
  Target,
  WandSparkles,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
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

const STARTER_META: Record<string, { description: string; icon: LucideIcon }> = {
  "Tạo CV từ đầu": { description: "Adam hướng dẫn và điền từng bước", icon: WandSparkles },
  "Cải thiện nội dung": { description: "Viết lại nội dung chuyên nghiệp hơn", icon: PencilLine },
  "Tối ưu theo JD": { description: "Điều chỉnh CV theo công việc mục tiêu", icon: Target },
  "Kiểm tra ATS": { description: "Phân tích khả năng vượt hệ thống ATS", icon: ScanSearch },
};

const CONTEXT_META: Record<string, { icon: LucideIcon }> = {
  "Rút gọn giới thiệu": { icon: FilePenLine },
  "Viết lại kinh nghiệm": { icon: PencilLine },
  "Thêm kỹ năng": { icon: Sparkles },
  "Kiểm tra ATS": { icon: ScanSearch },
  "So sánh với JD": { icon: BriefcaseBusiness },
};

function contextualSuggestions(data: CvFormData) {
  const suggestions: Array<{ title: string; message: string }> = [];
  if (data.thongTinLienHe.gioiThieuBanThan.trim()) {
    suggestions.push({
      title: "Rút gọn giới thiệu",
      message: "Hãy rút gọn phần giới thiệu hiện tại, giữ đúng thông tin và làm nổi bật giá trị nghề nghiệp.",
    });
  }
  if (data.kinhNghiemLamViec.length > 0) {
    suggestions.push({
      title: "Viết lại kinh nghiệm",
      message: "Hãy viết lại phần kinh nghiệm hiện tại ngắn gọn, chuyên nghiệp hơn và không bịa số liệu.",
    });
  }
  suggestions.push(
    { title: "Thêm kỹ năng", message: "Hãy xem CV hiện tại và hỏi tôi những kỹ năng còn thiếu trước khi thêm vào CV." },
    { title: "Kiểm tra ATS", message: "Hãy kiểm tra CV hiện tại về khả năng đọc bởi ATS và đề xuất thay đổi cụ thể." },
    { title: "So sánh với JD", message: "Tôi muốn so sánh CV với một JD. Hãy yêu cầu tôi cung cấp mô tả công việc." },
  );
  return suggestions.slice(0, 4);
}

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
          <ChatPanel data={cvData} />
        </aside>
        <PreviewPanel data={cvData} zoom={zoom} setZoom={setZoom} documentRef={documentRef} onTemplateChange={(templateId) => { setCvData((current) => ({ ...current, templateId })); setDirty(true); }} />
      </div>
    </main>
  );
}

function ChatPanel({ data }: { data: CvFormData }) {
  const [composerValue, setComposerValue] = useState("");
  const { agent } = useAgent({ agentId: "default" });
  const hasContent = hasPreviewContent(data);
  const hasSummary = Boolean(data.thongTinLienHe.gioiThieuBanThan.trim());
  const experienceCount = data.kinhNghiemLamViec.length;
  const suggestions = contextualSuggestions(data);

  useConfigureSuggestions(
    {
      suggestions,
      available: "after-first-message",
      consumerAgentId: "default",
    },
    [hasSummary, experienceCount],
  );

  const addContext = (value: string) => {
    setComposerValue((current) => current.trim() ? `${current.trim()}\n\n${value}` : value);
  };

  return (
    <section className="cv-chat">
      <div className="cv-chat__bar">
        <div className="cv-chat__identity"><span className="cv-avatar"><Sparkles className="size-4" /></span><div><strong>Adam</strong><span>Trợ lý tạo CV · Realtime</span></div></div>
        <span className={`cv-online${agent.isRunning ? " is-working" : ""}`} role="status">
          <i /> {agent.isRunning ? "Đang làm việc" : "Sẵn sàng"}
        </span>
      </div>
      <div className="cv-chat__content">
        <CopilotChat
          className="cv-chat__copilot"
          messageView={adamMessageView}
          welcomeScreen={({ input, suggestionView }) => <AgentWelcomeScreen input={input} suggestionView={suggestionView} />}
          suggestionView={AgentSuggestionView}
          inputValue={composerValue}
          onInputChange={setComposerValue}
          autoScroll="pin-to-send"
          input={{
            className: "adam-composer",
            positioning: "absolute",
            showDisclaimer: true,
            textArea: { className: "adam-composer__textarea", rows: 1 },
            sendButton: { className: "adam-composer__send" },
            addMenuButton: { className: "adam-composer__add" },
            disclaimer: AgentDisclaimer,
            toolsMenu: [
              { label: "Thêm mô tả công việc", action: () => addContext("Mô tả công việc mục tiêu:\n") },
              { label: "Thêm yêu cầu chỉnh sửa", action: () => addContext("Yêu cầu chỉnh sửa CV:\n") },
              { label: "Bổ sung thông tin cá nhân", action: () => addContext("Thông tin cần bổ sung:\n") },
            ],
          }}
          labels={{
            welcomeMessageText: "",
            chatInputPlaceholder: hasContent
              ? "Ví dụ: Viết lại phần kinh nghiệm ngắn gọn hơn..."
              : "Hỏi Adam hoặc yêu cầu chỉnh CV...",
            chatInputToolbarAddButtonLabel: "Thêm ngữ cảnh",
            chatDisclaimerText: "Adam có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.",
          }}
        />
      </div>
    </section>
  );
}

type AgentWelcomeScreenProps = {
  input: ReactElement;
  suggestionView: ReactElement;
};

function AgentWelcomeScreen({ input, suggestionView }: AgentWelcomeScreenProps) {
  return (
    <div className="adam-welcome">
      <div className="adam-welcome__body">
        <span className="adam-welcome__avatar" aria-hidden="true"><Sparkles className="size-5" /></span>
        <div className="adam-welcome__copy">
          <h2>Bạn muốn xây dựng CV như thế nào?</h2>
          <p>Mô tả công việc bạn muốn ứng tuyển hoặc để Adam giúp bạn xây dựng CV từng bước.</p>
        </div>
        {suggestionView}
      </div>
      {input}
    </div>
  );
}

const AgentSuggestionView = forwardRef<HTMLDivElement, ComponentProps<typeof CopilotChatSuggestionView>>(function AgentSuggestionView(
  props,
  ref,
) {
  const { suggestions, onSelectSuggestion, loadingIndexes } = props;
  const contextual = suggestions.some((suggestion) => suggestion.title in CONTEXT_META && !(suggestion.title in STARTER_META));
  return (
    <div ref={ref} className={contextual ? "adam-suggestions adam-suggestions--context" : "adam-suggestions"} aria-label={contextual ? "Gợi ý tiếp theo" : "Cách bắt đầu"}>
      {contextual && <span className="adam-suggestions__label">Gợi ý tiếp theo</span>}
      <div className="adam-suggestions__list">
        {suggestions.map((suggestion, index) => {
          const meta = STARTER_META[suggestion.title] ?? CONTEXT_META[suggestion.title];
          const Icon = meta?.icon ?? Sparkles;
          const isLoading = loadingIndexes?.includes(index) ?? false;
          return (
            <button
              key={`${suggestion.title}-${index}`}
              type="button"
              className={contextual ? "adam-context-action" : "adam-starter-action"}
              onClick={() => onSelectSuggestion?.(suggestion, index)}
              disabled={isLoading}
            >
              <span className="adam-suggestion__icon" aria-hidden="true"><Icon className="size-4" /></span>
              <span className="adam-suggestion__copy">
                <strong>{suggestion.title}</strong>
                {!contextual && <small>{STARTER_META[suggestion.title]?.description ?? "Gửi yêu cầu cho Adam"}</small>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

function AgentDisclaimer(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className="adam-composer__disclaimer">Adam có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.</div>;
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
