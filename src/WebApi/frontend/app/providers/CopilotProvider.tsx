"use client";

// Frontend luôn gọi Runtime nội bộ; Runtime sẽ adapter request sang AG-UI .NET.
import {
  CopilotKit,
  CopilotPopup,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useGlobalCvAssistant } from "@/hooks/use-global-cv-assistant";

function GlobalCvAssistantMount() {
  useGlobalCvAssistant({ enabled: true });
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
