"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CvThemeLibrary } from "@/components/admin/cv-theme-library";
import { CvThemesTable } from "@/components/admin/cv-themes-table";

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
