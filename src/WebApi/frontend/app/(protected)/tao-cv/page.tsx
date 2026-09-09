"use client";

import { useMemo, useState } from "react";
import { Check, Download, Eye, FileText, LockKeyhole, Pencil, Save, Sparkles } from "lucide-react";
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
  const [saved, setSaved] = useState(false);

  const completion = useMemo(() => {
    const fields = [cvData.fullName, cvData.email, cvData.phone, cvData.roleTitle, cvData.summary];
    const sections = [fields.filter(Boolean).length >= 3, cvData.experiences.length > 0, cvData.education.length > 0, cvData.skills.length > 0];
    return Math.round((sections.filter(Boolean).length / sections.length) * 100);
  }, [cvData]);

  const updateData = (next: CvFormData) => {
    setCvData(next);
    setSaved(false);
  };

  const publishPdf = () => {
    window.print();
  };

  return (
    <main className="cv-builder-shell">
      <div className="cv-builder-topline">
        <div className="cv-breadcrumb"><span>ỨNG VIÊN</span><span>/</span><strong>TẠO CV</strong></div>
        <div className="cv-save-state"><span className="cv-live-dot" />{saved ? "Đã lưu thay đổi" : "Tự động lưu bản nháp"}<LockKeyhole className="h-3.5 w-3.5" /></div>
      </div>

      <header className="cv-builder-header">
        <div>
          <p className="cv-eyebrow">PROFILE STUDIO / 2026</p>
          <h1>Tạo CV <em>có tín hiệu.</em></h1>
          <p className="cv-builder-subtitle">Điền thông tin một lần. Tạo hồ sơ nổi bật cho đúng cơ hội bạn đang tìm.</p>
        </div>
        <div className="cv-header-actions">
          <Button variant="outline" onClick={() => setSaved(true)}><Save className="mr-2 h-4 w-4" />Lưu bản nháp</Button>
          <Button onClick={publishPdf}><Download className="mr-2 h-4 w-4" />Xuất bản PDF</Button>
        </div>
      </header>

      <div className="cv-progress-row">
        <div className="cv-progress-label"><span>ĐỘ HOÀN THÀNH</span><strong>{completion}%</strong></div>
        <div className="cv-progress-track"><div style={{ width: `${Math.max(completion, 8)}%` }} /></div>
        <span className="cv-progress-note">{completion === 100 ? "Hồ sơ đã sẵn sàng" : "Tiếp tục để hồ sơ nổi bật hơn"}</span>
      </div>

      <div className="lg:hidden cv-mobile-tabs">
        <Tabs defaultValue="form">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="form"><Pencil className="mr-2 h-4 w-4" />Nhập thông tin</TabsTrigger><TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" />Xem trước</TabsTrigger></TabsList>
          <TabsContent value="form" className="mt-5 space-y-5"><CvForm data={cvData} onChange={updateData} /><AiAgent data={cvData} onUpdate={updateData} /></TabsContent>
          <TabsContent value="preview" className="mt-5"><CvPreview data={cvData} /></TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:grid cv-builder-grid">
        <section className="cv-editor-column">
          <div className="cv-section-heading"><div><p className="cv-eyebrow">01 / NỘI DUNG</p><h2>Thông tin của bạn</h2></div><span>{completion === 100 ? <><Check className="inline h-4 w-4" /> Hoàn tất</> : "Cập nhật realtime"}</span></div>
          <CvForm data={cvData} onChange={updateData} />
          <AiAgent data={cvData} onUpdate={updateData} />
        </section>
        <aside className="cv-preview-column">
          <div className="cv-preview-toolbar"><div><p className="cv-eyebrow">02 / LIVE PREVIEW</p><h2>CV của bạn</h2></div><div className="cv-preview-status"><Sparkles className="h-4 w-4" /> Live</div></div>
          <TemplateSelector selectedId={cvData.templateId} onSelect={(id) => updateData({ ...cvData, templateId: id })} />
          <div className="cv-preview-frame"><CvPreview data={cvData} /></div>
          <p className="cv-preview-hint"><FileText className="h-4 w-4" /> Mỗi thay đổi được hiển thị ngay trên mẫu CV</p>
        </aside>
      </div>
    </main>
  );
}
