"use client";

import {
  forwardRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import {
  CopilotChat,
  CopilotChatSuggestionView,
  useAgent,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import {
  BriefcaseBusiness,
  FilePenLine,
  MessageSquareText,
  PencilLine,
  ScanSearch,
  Sparkles,
  Target,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import type { CvFormData } from "@/lib/types";
import { adamMessageView } from "@/components/ai/adam-markdown";

const STARTER_META: Record<string, { description: string; icon: LucideIcon }> = {
  "Tạo CV từ đầu": { description: "Adam hướng dẫn và điền CV từng bước", icon: WandSparkles },
  "Cải thiện nội dung": { description: "Viết lại câu từ chuyên nghiệp hơn", icon: PencilLine },
  "Tối ưu theo JD": { description: "Điều chỉnh CV theo mô tả công việc mục tiêu", icon: Target },
  "Kiểm tra ATS": { description: "Kiểm tra độ tương thích với hệ thống ATS", icon: ScanSearch },
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

/**
 * Tab "Cùng Adam" trong trình tạo CV: chat agent realtime ghi thẳng vào
 * form (preview cập nhật ngay). Dùng lại CSS cv-chat/adam-* của AI CV Studio.
 */
export function AdamCvTab({ data }: { data: CvFormData }) {
  const [composerValue, setComposerValue] = useState("");
  const { agent } = useAgent({ agentId: "default" });
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
    setComposerValue((current) => (current.trim() ? `${current.trim()}\n\n${value}` : value));
  };

  return (
    <section
      aria-label="Trợ lý AI Adam"
      className="flex min-h-[26rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:h-[calc(100vh-140px)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft-sage text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              Trợ lý AI Adam{" "}
              <span className="font-normal text-muted-foreground">(Cập nhật tự động)</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Gõ yêu cầu hoặc chọn cách bắt đầu bên dưới
            </p>
          </div>
        </div>
        <span
          role="status"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            agent.isRunning ? "bg-primary/10 text-primary" : "bg-teal/10 text-teal"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${agent.isRunning ? "bg-primary" : "bg-teal"}`}
            aria-hidden="true"
          />
          {agent.isRunning ? "Đang làm việc" : "Sẵn sàng"}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <CopilotChat
          className="cv-chat__copilot"
          messageView={adamMessageView}
          welcomeScreen={({ input, suggestionView }) => (
            <AdamWelcomeScreen input={input} suggestionView={suggestionView} />
          )}
          suggestionView={AdamSuggestionView}
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
            disclaimer: AdamDisclaimer,
            toolsMenu: [
              { label: "Thêm mô tả công việc", action: () => addContext("Mô tả công việc mục tiêu:\n") },
              { label: "Thêm yêu cầu chỉnh sửa", action: () => addContext("Yêu cầu chỉnh sửa CV:\n") },
              { label: "Bổ sung thông tin cá nhân", action: () => addContext("Thông tin cần bổ sung:\n") },
            ],
          }}
          labels={{
            welcomeMessageText: "",
            chatInputPlaceholder: "Nhập yêu cầu cho Adam...",
            chatInputToolbarAddButtonLabel: "Thêm ngữ cảnh",
            chatDisclaimerText: "Adam có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.",
          }}
        />
      </div>
    </section>
  );
}

type AdamWelcomeScreenProps = {
  input: ReactElement;
  suggestionView: ReactElement;
};

function AdamWelcomeScreen({ input, suggestionView }: AdamWelcomeScreenProps) {
  return (
    <div className="adam-welcome">
      <div className="adam-welcome__body">
        <span className="adam-welcome__avatar" aria-hidden="true">
          <MessageSquareText className="size-5" />
        </span>
        <div className="adam-welcome__copy">
          <h2>Bạn muốn xây dựng CV như thế nào?</h2>
          <p>Chọn cách bắt đầu bên dưới hoặc nhập yêu cầu cho Adam — nội dung cập nhật realtime vào CV.</p>
        </div>
        {suggestionView}
      </div>
      {input}
    </div>
  );
}

const AdamSuggestionView = forwardRef<HTMLDivElement, ComponentProps<typeof CopilotChatSuggestionView>>(
  function AdamSuggestionView(props, ref) {
    const { suggestions, onSelectSuggestion, loadingIndexes } = props;
    const contextual = suggestions.some(
      (suggestion) => suggestion.title in CONTEXT_META && !(suggestion.title in STARTER_META),
    );
    return (
      <div
        ref={ref}
        className={contextual ? "adam-suggestions adam-suggestions--context" : "adam-suggestions"}
        aria-label={contextual ? "Gợi ý tiếp theo" : "Cách bắt đầu"}
      >
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
                <span className="adam-suggestion__icon" aria-hidden="true">
                  <Icon className="size-4" />
                </span>
                <span className="adam-suggestion__copy">
                  <strong>{suggestion.title}</strong>
                  {!contextual && (
                    <small>{STARTER_META[suggestion.title]?.description ?? "Gửi yêu cầu cho Adam"}</small>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);

function AdamDisclaimer(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className="adam-composer__disclaimer">
      Adam có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
    </div>
  );
}
