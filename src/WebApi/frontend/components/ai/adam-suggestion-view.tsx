"use client";

import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { CopilotChatSuggestionView } from "@copilotkit/react-core/v2";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
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

/** Một kiểu thẻ gợi ý cho cả workspace CV, popup Adam và trang việc làm:
 *  một hàng ngang cuộn được, có nút ‹ › và thu gọn/mở rộng thay vì lưới thẻ
 *  chiếm gần hết khung chat trống. */
export const AgentSuggestionView = forwardRef<HTMLDivElement, ComponentProps<typeof CopilotChatSuggestionView>>(function AgentSuggestionView(
  props,
  ref,
) {
  const { suggestions, onSelectSuggestion, loadingIndexes } = props;
  const contextual = suggestions.some((suggestion) => suggestion.title in CONTEXT_META && !(suggestion.title in STARTER_META));
  const listId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const next = { left: el.scrollLeft > 4, right: maxScroll - el.scrollLeft > 4 };
    setEdges((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // rAF/ResizeObserver đều bất đồng bộ nên không setState đồng bộ trong effect.
    const frame = window.requestAnimationFrame(updateEdges);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateEdges);
    observer?.observe(el);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [updateEdges, collapsed, suggestions.length]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 220), behavior: "smooth" });
  };

  const setRootRef = (node: HTMLDivElement | null) => {
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const label = contextual ? "Gợi ý tiếp theo" : "Bắt đầu nhanh";
  return (
    <div
      ref={setRootRef}
      className={contextual ? "adam-suggestions adam-suggestions--context" : "adam-suggestions"}
      aria-label={label}
    >
      <div className="adam-suggestions__head">
        <span className="adam-suggestions__label">{label}</span>
        <button
          type="button"
          className="adam-suggestions__toggle"
          aria-expanded={!collapsed}
          aria-controls={listId}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronDown className="size-3.5" aria-hidden="true" /> : <ChevronUp className="size-3.5" aria-hidden="true" />}
          {collapsed ? "Mở rộng" : "Thu gọn"}
        </button>
      </div>
      {!collapsed && (
        <div className="adam-suggestions__rail">
          {edges.left && (
            <button type="button" className="adam-suggestions__arrow adam-suggestions__arrow--prev" aria-label="Gợi ý trước" onClick={() => scrollByPage(-1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          )}
          <div id={listId} ref={listRef} className="adam-suggestions__list" onScroll={updateEdges}>
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
          {edges.right && (
            <button type="button" className="adam-suggestions__arrow adam-suggestions__arrow--next" aria-label="Gợi ý sau" onClick={() => scrollByPage(1)}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
