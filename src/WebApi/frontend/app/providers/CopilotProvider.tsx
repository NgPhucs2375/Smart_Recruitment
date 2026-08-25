"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import React from "react";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return (
    <CopilotKit 
      runtimeUrl="/api/copilotkit"
      agent="smart-agent"
      headers={{
        Authorization: token ? `Bearer ${token}` : "",
      }}
    >
      <CopilotSidebar
        defaultOpen={true}
        instructions="Hỗ trợ tối ưu hóa nội dung CV và tự động cập nhật thông tin."
        labels={{
          title: "CV Optimizer Assistant",
          initial: "Chào bạn! Tôi có thể giúp bạn xem xét và tối ưu hóa nội dung CV.",
        }}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}