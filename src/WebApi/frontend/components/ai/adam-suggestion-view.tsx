"use client";

import { forwardRef, type ComponentProps } from "react";
import { CopilotChatSuggestionView } from "@copilotkit/react-core/v2";
import {
  BriefcaseBusiness,
  FilePenLine,
  LayoutTemplate,
  PencilLine,
  ScanSearch,
  Sparkles,
  Target,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export const STARTER_META: Record<string, { description: string; icon: LucideIcon }> = {
  "Chọn mẫu CV": { description: "Gợi ý mẫu phù hợp với ngành của bạn", icon: LayoutTemplate },
  "Tạo CV từ đầu": { description: "Adam hướng dẫn và điền từng bước", icon: WandSparkles },
  "Cải thiện nội dung": { description: "Viết lại nội dung chuyên nghiệp hơn", icon: PencilLine },
  "Tối ưu theo JD": { description: "Điều chỉnh CV theo công việc mục tiêu", icon: Target },
  "Kiểm tra ATS": { description: "Phân tích khả năng vượt hệ thống ATS", icon: ScanSearch },
};

export const CONTEXT_META: Record<string, { icon: LucideIcon }> = {
  "Rút gọn giới thiệu": { icon: FilePenLine },
  "Viết lại kinh nghiệm": { icon: PencilLine },
  "Thêm kỹ năng": { icon: Sparkles },
  "Kiểm tra ATS": { icon: ScanSearch },
  "So sánh với JD": { icon: BriefcaseBusiness },
};

/** Một kiểu thẻ gợi ý cho cả workspace CV và popup Adam — popup dùng chung
 *  thay vì pill mặc định của CopilotKit (pill neo ở đỉnh khung chat trống). */
export const AgentSuggestionView = forwardRef<HTMLDivElement, ComponentProps<typeof CopilotChatSuggestionView>>(function AgentSuggestionView(
  props,
  ref,
) {
  const { suggestions, onSelectSuggestion, loadingIndexes } = props;
  const contextual = suggestions.some((suggestion) => suggestion.title in CONTEXT_META && !(suggestion.title in STARTER_META));
  return (
    <div ref={ref} className={contextual ? "adam-suggestions adam-suggestions--context" : "adam-suggestions"} aria-label={contextual ? "Gợi ý tiếp theo" : "Cách bắt đầu"}>
      <span className="adam-suggestions__label">{contextual ? "Gợi ý tiếp theo" : "Bắt đầu nhanh"}</span>
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
