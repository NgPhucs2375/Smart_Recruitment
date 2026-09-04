"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { CopilotPopup } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import React, { useState, useEffect } from "react";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("accessToken"));
  }, []);

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={{
        Authorization: token ? `Bearer ${token}` : "",
      }}
      onError={(event: { code: string; error: Error; context: Record<string, unknown> }) => {
        console.error(`[CopilotKit Error] Code: ${event.code}`, event.error.message, event.context);
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
        instructions="Bạn là trợ lý phỏng vấn và hoàn thiện CV. Hãy đồng hành cùng người dùng qua từng câu hỏi để hoàn thành hồ sơ chuyên nghiệp."
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
