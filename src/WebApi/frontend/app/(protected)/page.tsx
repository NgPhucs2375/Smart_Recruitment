// Trang chính (Dashboard) "/"
"use client";

import { CVEditor } from "@/components/cv-editor";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CVEditor />
    </div>
  );
}
