// Trang chính (Dashboard) "/dashboard"
"use client";

import { CVEditorV2 } from "@/components/cv-editor-v2";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <CVEditorV2 />
    </div>
  );
}
