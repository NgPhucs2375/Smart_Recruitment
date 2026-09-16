"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { CopilotPopup } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import React, { useState } from "react";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("accessToken"),
  );

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={{
        Authorization: token ? `Bearer ${token}` : "",
      }}
      onError={(event) => {
        console.error(`[CopilotKit ${event.type}]`, event.error, event.context);
      }}
    >
      {children}
      <CopilotPopup
        defaultOpen={false}
        width="min(92vw, 420px)"
        height="min(72vh, 650px)"
        clickOutsideToClose
        toggleButton={{
          className: "adam-chat-toggle",
        }}
        header={{
          className: "adam-chat-header",
        }}
        labels={{
          modalHeaderTitle: "Adam - Trợ lý nghề nghiệp",
          chatToggleOpenLabel: "Mở Adam",
          chatToggleCloseLabel: "Đóng Adam",
          welcomeMessageText: "Xin chào, tôi là Adam. Tôi có thể giúp bạn hoàn thiện CV, tìm việc phù hợp và luyện phỏng vấn.",
          chatInputPlaceholder: "Nhắn cho Adam...",
        }}
      />
    </CopilotKit>
  );
}
