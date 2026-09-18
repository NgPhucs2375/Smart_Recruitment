"use client";

// Frontend luôn gọi Runtime nội bộ; Runtime sẽ adapter request sang AG-UI .NET.
import { CopilotKit } from "@copilotkit/react-core/v2";
import { CopilotPopup } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import React, { useState } from "react";
import { useGlobalCvAssistant } from "@/hooks/use-global-cv-assistant";

function GlobalCvAssistantMount() {
  useGlobalCvAssistant({ enabled: true });
  return null;
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  // Key chuẩn của app là "access_token" (auth-provider.ts TOKEN_KEY) —
  // đọc sai key trước đây khiến header Authorization luôn rỗng.
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("access_token"),
  );

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
