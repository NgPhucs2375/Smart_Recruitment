"use client";

// Frontend luôn gọi Runtime nội bộ; Runtime sẽ adapter request sang AG-UI .NET.
import {
  CopilotKit,
  CopilotPopup,
  useConfigureSuggestions,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import React, { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useGlobalCvAssistant } from "@/hooks/use-global-cv-assistant";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

const CHAT_SUGGESTIONS = [
  { title: "Tạo CV từ đầu", message: "Hãy giúp tôi tạo một CV mới. Hỏi tôi các thông tin còn thiếu theo từng bước." },
  { title: "Điền liên hệ", message: "Hãy hỏi tôi các thông tin liên hệ còn thiếu và điền trực tiếp vào CV." },
  { title: "Tối ưu ATS", message: "Hãy kiểm tra CV hiện tại và áp dụng các cải thiện giúp CV thân thiện với ATS." },
  { title: "Viết lại kinh nghiệm", message: "Hãy viết lại phần kinh nghiệm hiện tại theo hướng định lượng thành tích, không bịa thông tin." },
];

function GlobalCvAssistantMount() {
  useGlobalCvAssistant({ enabled: true });
  useConfigureSuggestions({
    suggestions: CHAT_SUGGESTIONS,
    available: "before-first-message",
    consumerAgentId: "default",
  });
  return null;
}

function InitialPopupState() {
  const configuration = useCopilotChatConfiguration();
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current || !configuration) return;
    initialized.current = true;
    configuration.setModalOpen(false);
  }, [configuration]);

  return null;
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  // Key chuẩn của app là "access_token" (auth-provider.ts TOKEN_KEY) —
  // đọc sai key trước đây khiến header Authorization luôn rỗng.
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("access_token"),
  );
  const pathname = usePathname();
  const identity = useStoredIdentity();
  const adamRoles = identity?.roles?.join(",") ?? "";

  // BE-first: LLM + tool backend (hồ sơ, CV) chạy ở .NET smart-agent.
  // FE chỉ expose action client-side (useCopilotAction ghi nháp vào form) để BE gọi ngược qua AG-UI.
  // Đi qua Next proxy cùng origin để giữ SSE streaming, sanitize event hỏng
  // và không phụ thuộc browser -> BE direct (hết CORS/localhost staging).
  const runtimeUrl = "/api/copilotkit";
  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      useSingleEndpoint={false}
      headers={{
        Authorization: token ? `Bearer ${token}` : "",
        "X-Adam-Route": pathname ?? "",
        "X-Adam-Roles": adamRoles,
      }}
      onError={(event) => {
        console.error(`[CopilotKit ${event.type}]`, event.error, event.context);
      }}
    >
      {children}
      <InitialPopupState />
      <GlobalCvAssistantMount />
      <CopilotPopup
        defaultOpen={false}
        width="min(92vw, 550px)"
        height="min(72vh, 750px)"
        clickOutsideToClose
        toggleButton={{
          className: "adam-chat-toggle",
        }}
        header={{
          className: "adam-chat-header",
        }}
        labels={{
          modalHeaderTitle: "Adam - Trợ lý thông minh",
          chatToggleOpenLabel: "Trò chuyện với Adam",
          chatToggleCloseLabel: "Tạm biệt Adam",
          welcomeMessageText: "Xin chào, tôi là Adam. Tôi có thể giúp gì cho bạn?",
          chatInputPlaceholder: "Nhắn cho Adam...",
        }}
      />
    </CopilotKit>
  );
}
