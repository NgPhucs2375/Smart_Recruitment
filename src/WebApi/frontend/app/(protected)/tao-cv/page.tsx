"use client";

import { useState } from "react";
import { FileText, Download, Save, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CvForm } from "./cv-form";
import { CvPreview } from "./cv-preview";
import { TemplateSelector } from "./template-selector";
import { AiAgent } from "./ai-agent";
import { defaultCvData } from "./constants";
import type { CvFormData } from "./types";

export default function TaoCvPage() {
  const [cvData, setCvData] = useState<CvFormData>(defaultCvData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tạo CV</h1>
            <p className="text-sm text-muted-foreground">
              Xây dựng CV chuyên nghiệp với hỗ trợ AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Lưu nháp
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
        </div>
      </div>

      {/* Mobile: Tabs layout */}
      <div className="lg:hidden">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="gap-2">
              <Pencil className="h-4 w-4" />
              Nhập liệu
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Xem trước
            </TabsTrigger>
          </TabsList>
          <TabsContent value="form" className="mt-4 space-y-4">
            <TemplateSelector
              selectedId={cvData.templateId}
              onSelect={(id) => setCvData({ ...cvData, templateId: id })}
            />
            <CvForm data={cvData} onChange={setCvData} />
            <AiAgent data={cvData} onUpdate={setCvData} />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <div className="sticky top-20">
              <CvPreview data={cvData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
          <CvForm data={cvData} onChange={setCvData} />
          <AiAgent data={cvData} onUpdate={setCvData} />
        </div>
        <div className="space-y-4">
          <TemplateSelector
            selectedId={cvData.templateId}
            onSelect={(id) => setCvData({ ...cvData, templateId: id })}
          />
          <div className="sticky top-20">
            <CvPreview data={cvData} />
          </div>
        </div>
      </div>
    </div>
  );
}
