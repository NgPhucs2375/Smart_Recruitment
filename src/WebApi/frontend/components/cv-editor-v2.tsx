"use client";

import React from "react";
import { useCVData } from "@/hooks/useCVData";
import { useCopilotAction } from "@copilotkit/react-core";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  User,
  Briefcase,
  Brain,
  Target,
  Save,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { summaryTemplates, experienceStarTemplate } from "@/features/tao-cv/content-templates";

const skillCategories = [
  "Programming",
  "Frameworks",
  "Tools",
  "Languages",
  "Soft Skills",
  "Databases",
  "Cloud/DevOps",
  "Other",
] as const;

const DRAFT_KEY = "hireai.cv-draft";

export function CVEditorV2() {
  const { cvData, updateField, addSkill, removeSkill, resetCV } = useCVData();
  const [newSkill, setNewSkill] = React.useState("");
  const [skillCategory, setSkillCategory] = React.useState<typeof skillCategories[number]>("Programming");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>("personal");
  const [previewZoom, setPreviewZoom] = React.useState(1);

  // Draft persistence is local-only (no backend endpoint for /CV drafts).
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof cvData>;
      if (typeof parsed.fullName === "string" && parsed.fullName) updateField("fullName", parsed.fullName);
      if (typeof parsed.summary === "string" && parsed.summary) updateField("summary", parsed.summary);
      if (typeof parsed.experience === "string" && parsed.experience) updateField("experience", parsed.experience);
      if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        for (const s of parsed.skills) {
          if (typeof s === "string" && s.trim()) addSkill(s);
        }
      }
    } catch {
      // ignore corrupt drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(cvData));
      toast.success("Đã lưu nháp trên thiết bị này.");
    } catch {
      toast.error("Không lưu được nháp (bộ nhớ đầy).");
    }
  }

  function insertTemplate(current: string, template: string): string {
    if (!current.trim()) return template;
    return `${current.trimEnd()}\n${template}`;
  }

  useCopilotAction({
    name: "updateCVSection",
    description: "Cập nhật một phần của CV",
    parameters: [
      {
        name: "section",
        type: "string",
        description: "Tên phần: fullName, summary, experience, skills",
        required: true,
      },
      {
        name: "value",
        type: "string",
        description: "Giá trị mới cho phần đó",
        required: true,
      },
    ],
    handler: async ({ section, value }) => {
      if (section in cvData) {
        updateField(section as keyof typeof cvData, value);
      }
    },
  });

  useCopilotAction({
    name: "addSkillToCV",
    description: "Thêm kỹ năng mới vào CV",
    parameters: [
      {
        name: "skill",
        type: "string",
        description: "Kỹ năng cần thêm",
        required: true,
      },
    ],
    handler: async ({ skill }) => {
      addSkill(skill);
    },
  });

  useCopilotAction({
    name: "generateCVSummary",
    description: "Tự động tạo tóm tắt CV dựa trên thông tin hiện có",
    parameters: [],
    handler: async () => {
      setIsGenerating(true);
      try {
        const prompt = `Dựa trên thông tin sau, hãy viết một tóm tắt CV chuyên nghiệp, súc tích (3-4 câu):
        - Họ tên: ${cvData.fullName || "Chưa cung cấp"}
        - Kinh nghiệm: ${cvData.experience || "Chưa cung cấp"}
        - Kỹ năng: ${cvData.skills.join(", ") || "Chưa cung cấp"}`;

        // The agent will handle this via the chat
        return `Đã yêu cầu AI tạo tóm tắt. Prompt: ${prompt}`;
      } finally {
        setIsGenerating(false);
      }
    },
  });

  const sections = [
    {
      id: "personal",
      title: "Thông tin cá nhân",
      icon: User,
      description: "Họ tên, thông tin liên hệ",
      done: cvData.fullName.trim() !== "",
    },
    {
      id: "summary",
      title: "Tóm tắt chuyên nghiệp",
      icon: Target,
      description: "Mục tiêu nghề nghiệp, điểm mạnh",
      done: cvData.summary.trim() !== "",
    },
    {
      id: "experience",
      title: "Kinh nghiệm làm việc",
      icon: Briefcase,
      description: "Các vị trí, dự án, thành tựu",
      done: cvData.experience.trim() !== "",
    },
    {
      id: "skills",
      title: "Kỹ năng",
      icon: Brain,
      description: "Kỹ năng kỹ thuật & mềm",
      done: cvData.skills.length > 0,
    },
  ];

  const completedCount = sections.filter((s) => s.done).length;
  const hasPreviewContent =
    cvData.fullName.trim() !== "" ||
    cvData.summary.trim() !== "" ||
    cvData.experience.trim() !== "" ||
    cvData.skills.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Tạo CV với AI</h1>
            <Badge variant="secondary">Bản nháp</Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-teal" />
              ATS-friendly
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Xây dựng CV chuyên nghiệp với hỗ trợ AI — {completedCount}/{sections.length} mục đã hoàn thành
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
          <Button variant="outline" size="sm" onClick={resetCV}>
            <Trash2 className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button size="sm" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Lưu nháp
          </Button>
        </div>
      </div>

      {isGenerating && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
          <Badge variant="secondary" className="gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang tạo nội dung với AI...
          </Badge>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 rounded-2xl border border-border bg-card p-2" aria-label="CV Sections">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Các mục CV
            </p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={activeSection === section.id ? "true" : "false"}
              >
                <section.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{section.title}</span>
                  <span className={cn("block truncate text-[11px] font-normal", activeSection === section.id ? "text-primary-foreground/70" : "text-muted-foreground/80")}>
                    {section.description}
                  </span>
                </span>
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    section.done ? "bg-teal" : activeSection === section.id ? "bg-primary-foreground/40" : "bg-muted-foreground/25"
                  )}
                  aria-label={section.done ? "Đã hoàn thành" : "Chưa hoàn thành"}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-6">
          <section id="personal" aria-labelledby="personal-heading" className="scroll-mt-24">
            <Card className={cn("overflow-hidden", activeSection === "personal" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader className="bg-muted/40 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-frost text-marine">
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
                    <CardDescription>Họ tên và thông tin cơ bản</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div>
                  <Label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={cvData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Nguyễn Văn An"
                    className="h-11 rounded-xl text-base"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium mb-1.5">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                      Số điện thoại
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="090 123 4567"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location" className="block text-sm font-medium mb-1.5">
                    Địa chỉ
                  </Label>
                  <Input
                    id="location"
                    placeholder="Hà Nội, Việt Nam"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin" className="block text-sm font-medium mb-1.5">
                    LinkedIn / Portfolio
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourname"
                    className="h-11 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="summary" aria-labelledby="summary-heading" className="scroll-mt-24">
            <Card className={cn("overflow-hidden", activeSection === "summary" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader className="bg-muted/40 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-frost text-marine">
                      <Target className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Tóm tắt chuyên nghiệp</CardTitle>
                      <CardDescription>Mục tiêu nghề nghiệp và giá trị cốt lõi</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsGenerating(true)}>
                    <Sparkles className="h-4 w-4 mr-1 text-teal" />
                    Viết bằng AI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Mẫu nhanh — bấm để chèn:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summaryTemplates.map((t) => (
                      <Button
                        key={t.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-full text-xs"
                        onClick={() => {
                          updateField("summary", insertTemplate(cvData.summary, t.text));
                          toast.success(`Đã chèn mẫu ${t.label}.`);
                        }}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="summary"
                  value={cvData.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  placeholder="Tôi là một lập trình viên Fullstack với 5+ năm kinh nghiệm..."
                  rows={5}
                  className="resize-none rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  {cvData.summary.length} / 500 ký tự
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="experience" aria-labelledby="experience-heading" className="scroll-mt-24">
            <Card className={cn("overflow-hidden", activeSection === "experience" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader className="bg-muted/40 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-frost text-marine">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Kinh nghiệm làm việc</CardTitle>
                      <CardDescription>Các vị trí, dự án và thành tựu nổi bật</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      updateField("experience", insertTemplate(cvData.experience, experienceStarTemplate));
                      toast.success("Đã chèn khung mô tả STAR.");
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-1 text-teal" />
                    Khung STAR
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap gap-1.5">
                  {["Mạnh hơn", "Ngắn gọn hơn", "Chuyên nghiệp hơn", "Tối ưu ATS"].map((chip) => (
                    <span key={chip} className="rounded-full border border-teal/25 bg-teal/10 px-2.5 py-1 text-[11px] font-medium text-navy">
                      {chip}
                    </span>
                  ))}
                </div>
                <Textarea
                  id="experience"
                  value={cvData.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  placeholder={[
                    "CÔNG TY ABC - Senior Developer (2022 - Nay)",
                    "• Lãnh đạo team 5 người phát triển nền tảng e-commerce",
                    "• Tối ưu hiệu suất API giảm 40% thời gian phản hồi",
                    "• Triển khai CI/CD pipeline tự động hóa",
                    "",
                    "CÔNG TY XYZ - Developer (2020 - 2022)",
                    "• Phát triển các tính năng core cho ứng dụng SaaS",
                    "• Viết unit test coverage > 85%",
                  ].join("\n")}
                  rows={10}
                  className="resize-none rounded-xl font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Mẹo: dùng số liệu cụ thể, hoặc hỏi AI trong khung chat để viết lại.
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="skills" aria-labelledby="skills-heading" className="scroll-mt-24">
            <Card className={cn("overflow-hidden", activeSection === "skills" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader className="bg-muted/40 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-frost text-marine">
                      <Brain className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Kỹ năng</CardTitle>
                      <CardDescription>Kỹ năng kỹ thuật, công cụ và kỹ năng mềm</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Sparkles className="h-4 w-4 mr-1 text-teal" />
                    Gợi ý AI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value as typeof skillCategories[number])}
                    className="flex h-11 w-auto items-center rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Nhóm kỹ năng"
                  >
                    {skillCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="flex-1 flex gap-2 min-w-[200px]">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                      placeholder="Thêm kỹ năng mới..."
                      className="h-11 rounded-xl"
                    />
                    <Button onClick={handleAddSkill} disabled={!newSkill.trim()} className="h-11 rounded-xl" aria-label="Thêm kỹ năng">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cvData.skills?.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full">
                      Chưa có kỹ năng nào. Hãy thêm kỹ năng đầu tiên của bạn!
                    </p>
                  ) : (
                    cvData.skills?.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="gap-1.5 px-3 py-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill}
                        <Trash2 className="h-3 w-3 opacity-60 hover:opacity-100 cursor-pointer" />
                      </Badge>
                    ))
                  )}
                </div>

                {cvData.skills && cvData.skills.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Tổng cộng: <span className="font-medium text-foreground">{cvData.skills.length}</span> kỹ năng
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileText className="h-3.5 w-3.5 text-marine" />
                  Xem trước
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Thu nhỏ"
                    disabled={previewZoom <= 0.8}
                    onClick={() => setPreviewZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-9 text-center font-mono text-[11px] text-muted-foreground">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Phóng to"
                    disabled={previewZoom >= 1.2}
                    onClick={() => setPreviewZoom((z) => Math.min(1.2, +(z + 0.1).toFixed(2)))}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="In CV"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="max-h-[560px] overflow-auto bg-ivory p-4">
                {hasPreviewContent ? (
                  <div
                    className="origin-top rounded-lg border border-linen bg-white p-5 shadow-[0_8px_24px_rgba(53,92,140,0.10)]"
                    style={{ transform: `scale(${previewZoom})`, width: `${100 / previewZoom}%` }}
                  >
                    <p className="text-lg font-bold tracking-tight text-navy">
                      {cvData.fullName || "Họ và tên"}
                    </p>
                    {cvData.summary.trim() !== "" && (
                      <p className="mt-2 whitespace-pre-line text-xs leading-5 text-charcoal/75">
                        {cvData.summary}
                      </p>
                    )}
                    {cvData.experience.trim() !== "" && (
                      <div className="mt-3 border-t border-linen/70 pt-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-marine">
                          Kinh nghiệm
                        </p>
                        <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-charcoal/75">
                          {cvData.experience}
                        </p>
                      </div>
                    )}
                    {cvData.skills.length > 0 && (
                      <div className="mt-3 border-t border-linen/70 pt-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-marine">
                          Kỹ năng
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {cvData.skills.map((s) => (
                            <span key={s} className="rounded-full bg-frost px-2 py-0.5 text-[11px] font-medium text-navy">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-linen bg-white/70 p-6 text-center">
                    <FileText className="mx-auto h-6 w-6 text-mist" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Nhập thông tin bên trái để xem trước CV tại đây.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-teal/25 bg-teal/10 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
                <Sparkles className="h-3.5 w-3.5 text-teal" />
                Gợi ý nhanh từ AI
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-charcoal/70">
                <li>• Viết tóm tắt 3–4 câu, tránh chung chung.</li>
                <li>• Mỗi kinh nghiệm nên có con số kết quả.</li>
                <li>• Giữ 5–10 kỹ năng sát với vị trí ứng tuyển.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button size="lg" className="gap-2 rounded-full">
          <CheckCircle2 className="h-4 w-4" />
          Hoàn tất CV
        </Button>
      </div>
    </div>
  );

  function handleAddSkill() {
    if (newSkill.trim()) {
      addSkill(`${skillCategory}: ${newSkill.trim()}`);
      setNewSkill("");
    }
  }
}
