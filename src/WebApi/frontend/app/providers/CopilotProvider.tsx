"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "@copilotkit/react-core/v2/styles.css";
import React from "react";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint={false}
      headers={{
        Authorization: token ? `Bearer ${token}` : "",
      }}
    >
      <CopilotSidebar
        defaultOpen={true}
        instructions="Bạn là trợ lý phỏng vấn và hoàn thiện CV. Hãy đồng hành cùng người dùng qua từng câu hỏi để hoàn thành hồ sơ chuyên nghiệp."
        labels={{
          title: "CV Consultant AI",
          initial: "Xin chào! Tôi sẽ đồng hành cùng bạn xây dựng một bộ CV chuẩn doanh nghiệp. Để bắt đầu, bạn có thể cho tôi biết họ tên và vị trí công việc bạn đang hướng tới không?.",
        }}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
