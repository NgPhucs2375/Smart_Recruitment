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
  badgeVariants,
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
} from "lucide-react";

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

export function CVEditorV2() {
  const { cvData, updateField, addSkill, removeSkill, isReady, resetCV } = useCVData();
  const [newSkill, setNewSkill] = React.useState("");
  const [skillCategory, setSkillCategory] = React.useState<typeof skillCategories[number]>("Programming");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>("personal");

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
    },
    {
      id: "summary",
      title: "Tóm tắt chuyên nghiệp",
      icon: Target,
      description: "Mục tiêu nghề nghiệp, điểm mạnh",
    },
    {
      id: "experience",
      title: "Kinh nghiệm làm việc",
      icon: Briefcase,
      description: "Các vị trí, dự án, thành tựu",
    },
    {
      id: "skills",
      title: "Kỹ năng",
      icon: Brain,
      description: "Kỹ năng kỹ thuật & mềm",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trình Biên Tập CV</h1>
          <p className="text-muted-foreground mt-1">
            Xây dựng CV chuyên nghiệp với hỗ trợ AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetCV}>
            <Download className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
          <Button size="sm">
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

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1" aria-label="CV Sections">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={activeSection === section.id ? "true" : "false"}
              >
                <section.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">
          <section id="personal" aria-labelledby="personal-heading">
            <Card className={cn(activeSection === "personal" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
                <CardDescription>Họ tên và thông tin cơ bản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={cvData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Nguyễn Văn An"
                    className="text-lg"
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
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="summary" aria-labelledby="summary-heading">
            <Card className={cn(activeSection === "summary" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Tóm tắt chuyên nghiệp
                  </CardTitle>
                  <CardDescription>Mô tả ngắn gọn về mục tiêu nghề nghiệp và giá trị cốt lõi</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsGenerating(true)}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Viết bằng AI
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="summary"
                  value={cvData.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  placeholder="Tôi là một lập trình viên Fullstack với 5+ năm kinh nghiệm..."
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {cvData.summary.length} / 500 ký tự
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="experience" aria-labelledby="experience-heading">
            <Card className={cn(activeSection === "experience" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Kinh nghiệm làm việc
                </CardTitle>
                <CardDescription>Các vị trí, dự án và thành tựu nổi bật</CardDescription>
              </CardHeader>
              <CardContent>
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
                  className="resize-none font-mono text-sm"
                />
              </CardContent>
            </Card>
          </section>

          <section id="skills" aria-labelledby="skills-heading">
            <Card className={cn(activeSection === "skills" ? "ring-2 ring-primary/20" : "")}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Kỹ năng
                  </CardTitle>
                  <CardDescription>Kỹ năng kỹ thuật, công cụ và kỹ năng mềm</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Gợi ý AI
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value as typeof skillCategories[number])}
                    className="flex h-10 w-auto items-center rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    />
                    <Button onClick={handleAddSkill} disabled={!newSkill.trim()}>
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
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button size="lg" className="gap-2">
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