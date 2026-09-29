"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Cô lập các khối nặng khỏi bundle trang Admin: không nạp đồng loạt
// template-registry (~50 templates) + bảng CRUD vào lần compile đầu,
// tránh phình RAM Node (OOM -> ERR_EMPTY_RESPONSE).
const CvThemeLibrary = dynamic(
  () => import("@/components/admin/cv-theme-library").then((m) => m.CvThemeLibrary),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 p-6" aria-busy="true" aria-label="Đang tải thư viện mẫu">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);

const CvThemesTable = dynamic(
  () => import("@/components/admin/cv-themes-table").then((m) => m.CvThemesTable),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 p-6" aria-busy="true" aria-label="Đang tải bảng metadata">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-48 w-full" />
      </div>
    ),
  },
);

/** Tab Thư viện dùng renderer thật + tab Metadata & AI reuse CRUD hiện có. */
export default function AdminCvThemesPage() {
  const [tab, setTab] = useState<"library" | "metadata">("library");

  return (
    <div className="pb-6">
      <Tabs value={tab} defaultValue="library" onValueChange={(v) => setTab(v as "library" | "metadata")}>
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="library">Thư viện mẫu</TabsTrigger>
            <TabsTrigger value="metadata">Metadata & AI</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="library" className="mt-0">
          <CvThemeLibrary onEdit={() => setTab("metadata")} />
        </TabsContent>
        <TabsContent value="metadata" className="mt-0">
          <CvThemesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
