"use client";

// Workspace AI dùng cùng CvDocument với trình tạo CV để preview và export đồng nhất.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCopilotAction, useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";
import {
  Sparkles,
  Loader2,
  RotateCcw,
  Check,
  Pencil,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  Save,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CvDocument } from "@/components/cv/cv-document";
import { TEMPLATE_REGISTRY, DEFAULT_TEMPLATE_ID } from "@/features/tao-cv/template-registry";
import { defaultCvData } from "@/features/tao-cv/constants";
import type { CvFormData } from "@/lib/types";
import { createManualCvPayload, createManualCvPdfBlob, manualCvPdfFileName } from "@/features/tao-cv/manual";
import { cvApi } from "@/lib/api/cv-api";
import {
  emptyAiDraft,
  draftHasContent,
  draftSections,
  aiDraftToCvFormData,
  type AiDraftCv,
} from "@/features/ai-cv/ai-draft";

const PROMPT_CHIPS: { label: string; prompt: string }[] = [
  {
    label: "Fresher / Sinh viên mới ra trường",
    prompt:
      "Tôi là sinh viên năm cuối ngành CNTT, biết Java OOP và SQL cơ bản, muốn ứng tuyển Fresher Backend. Hãy hỏi tôi thêm để hoàn thiện CV.",
  },
  {
    label: "Frontend Developer",
    prompt:
      "Tôi có 1 năm kinh nghiệm React và TypeScript, muốn ứng tuyển Frontend Developer. Hãy tạo bản nháp CV cho tôi.",
  },
  {
    label: "Backend Developer",
    prompt:
      "Tôi có 2 năm kinh nghiệm .NET và SQL Server, muốn ứng tuyển Backend Developer. Hãy tạo bản nháp CV cho tôi.",
  },
  {
    label: "Data / AI",
    prompt:
      "Tôi học phân tích dữ liệu, biết Python và SQL, muốn ứng tuyển Data Analyst. Hãy tạo bản nháp CV cho tôi.",
  },
  {
    label: "Business Analyst",
    prompt:
      "Tôi muốn ứng tuyển Business Analyst, có kỹ năng phân tích yêu cầu và viết tài liệu. Hãy tạo bản nháp CV cho tôi.",
  },
  {
    label: "Product / Project",
    prompt:
      "Tôi muốn ứng tuyển Product Owner, có kinh nghiệm quản lý backlog Agile. Hãy tạo bản nháp CV cho tôi.",
  },
];

/**
 * 50/50 AI-assisted CV generation workspace.
 * Left: prompt + agent transcript + draft review. Right: live CvPreview
 * through the existing Template Registry. AI tool calls write to a DRAFT
 * only — live CvFormData changes solely via "Áp dụng vào CV".
 */
export function AiCvWorkspace() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<AiDraftCv>(emptyAiDraft);
  const [liveCv, setLiveCv] = useState<CvFormData>(() =>
    JSON.parse(JSON.stringify(defaultCvData)) as CvFormData
  );
  const [previewZoom, setPreviewZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const { visibleMessages: rawVisibleMessages, appendMessage, isLoading } = useCopilotChat();
  // v1 hook yields undefined before chat state initializes — normalize once
  // so every .length/.map below is safe without scattering guards.
  const visibleMessages = rawVisibleMessages ?? [];

  // Client-side actions cho BE smart-agent gọi ngược qua AG-UI.
  // AI tool calls land in the DRAFT — never in live CV state.
  useCopilotAction({
    name: "updateAiDraftSection",
    description: "Ghi một phần CV (họ tên, tóm tắt, kinh nghiệm, kỹ năng) vào bản nháp AI",
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
        description: "Nội dung (kỹ năng cách nhau bằng dấu phẩy hoặc xuống dòng)",
        required: true,
      },
    ],
    handler: async ({ section, value }) => {
      const v = typeof value === "string" ? value : "";
      setDraft((prev) => {
        if (section === "fullName") return { ...prev, fullName: v };
        if (section === "summary") return { ...prev, summary: v };
        if (section === "experience") return { ...prev, experience: v };
        if (section === "skills") {
          const skills = v
            .split(/[\n,;]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          return { ...prev, skills };
        }
        return prev;
      });
    },
  });

  useCopilotAction({
    name: "addSkillToAiDraft",
    description: "Thêm một kỹ năng vào bản nháp AI",
    parameters: [
      { name: "skill", type: "string", description: "Kỹ năng cần thêm", required: true },
    ],
    handler: async ({ skill }) => {
      const s = typeof skill === "string" ? skill.trim() : "";
      if (!s) return;
      setDraft((prev) =>
        prev.skills.some((x) => x.toLowerCase() === s.toLowerCase())
          ? prev
          : { ...prev, skills: [...prev.skills, s] }
      );
    },
  });

  async function handleGenerate() {
    const text = prompt.trim();
    if (!text || isLoading) return;
    try {
      await appendMessage(
        new TextMessage({ id: `user-${Date.now()}`, role: MessageRole.User, content: text })
      );
    } catch {
      toast.error("Không gửi được yêu cầu tới AI. Hãy thử lại.");
    }
  }

  function handleApply() {
    setLiveCv((prev) => aiDraftToCvFormData(draft, prev));
    toast.success("Đã áp dụng bản nháp vào CV. Xem trước bên phải.");
  }

  function handleRegenerate() {
    setDraft(emptyAiDraft);
    toast.info("Đã xóa bản nháp. Sửa prompt rồi bấm Tạo lại.");
    promptRef.current?.focus();
  }

  async function persistAndGo(edit: boolean) {
    setSaving(true);
    try {
      const hs = await cvApi.getMyHoSo();
      const preview = documentRef.current;
      if (!preview) throw new Error("Không tìm thấy bản xem trước để lưu PDF.");
      const fileName = manualCvPdfFileName(liveCv.tenFile, liveCv.thongTinLienHe.hoTen);
      const pdf = await createManualCvPdfBlob(preview);
      const result = await cvApi.saveVersion({
        ...createManualCvPayload(hs.id, liveCv, true),
        phuongThucTao: 3,
      }, pdf, fileName);
      toast.success("Đã lưu CV.");
      if (edit) router.push(`/tao-cv?cv=${result.cvUngVienId}`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Lưu CV thất bại. Hãy tạo hồ sơ ứng viên trước."
      );
    } finally {
      setSaving(false);
    }
  }

  const hasDraft = draftHasContent(draft);
  const sections = draftSections(draft);
  const templates = Object.values(TEMPLATE_REGISTRY);
  const hasPreviewContent =
    liveCv.thongTinLienHe.hoTen.trim() !== "" ||
    liveCv.thongTinLienHe.gioiThieuBanThan.trim() !== "" ||
    liveCv.kinhNghiemLamViec.length > 0 ||
    liveCv.kyNang.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">
          <Sparkles className="size-3.5 text-teal" /> AI Assistant
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          Tạo CV với AI
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">
          Mô tả hồ sơ, kinh nghiệm và vị trí bạn muốn ứng tuyển. AI sẽ tạo bản nháp CV để bạn xem trước.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — AI generation workspace */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-3xl border border-linen bg-card p-5 shadow-sm">
            <label htmlFor="ai-prompt" className="text-sm font-semibold text-charcoal">
              Mô tả của bạn
            </label>
            <Textarea
              id="ai-prompt"
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Ví dụ: Tôi là sinh viên năm cuối ngành CNTT, có kinh nghiệm React, .NET và muốn ứng tuyển Backend Developer..."
              className="mt-2 rounded-2xl border-input bg-white text-sm"
            />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PROMPT_CHIPS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setPrompt(c.prompt)}
                  className="rounded-full border border-linen bg-ivory px-2.5 py-1 text-[11px] font-medium text-charcoal/70 transition hover:border-marine/40 hover:text-navy"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={prompt.trim() === "" || isLoading}
              className="mt-3 h-11 w-full rounded-xl bg-primary text-white hover:bg-primary-hover"
            >
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {isLoading ? "AI đang tạo..." : "Tạo CV bằng AI"}
            </Button>
          </div>

          <div className="rounded-3xl border border-linen bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-charcoal">Hội thoại với AI</p>
            <div className="mt-3 max-h-64 space-y-2.5 overflow-y-auto" aria-live="polite">
              {visibleMessages.length === 0 && (
                <p className="rounded-2xl bg-muted/50 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                  Câu trả lời của AI sẽ hiện ở đây. AI có thể hỏi thêm để hoàn thiện bản nháp.
                </p>
              )}
              {visibleMessages.map((m) => {
                if (!("content" in m) || typeof m.content !== "string" || !m.content.trim()) {
                  return null;
                }
                const role = "role" in m ? String(m.role) : "";
                const isUser = role === "user";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <p
                      className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-xs leading-5 ${
                        isUser ? "bg-navy text-white" : "bg-muted/60 text-charcoal"
                      }`}
                    >
                      {m.content}
                    </p>
                  </div>
                );
              })}
              {isLoading && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> AI đang trả lời...
                </p>
              )}
            </div>
          </div>

          {hasDraft && (
            <div className="rounded-3xl border border-teal/30 bg-teal/[0.07] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                  <FileText className="size-4 text-teal" />
                  Bản nháp AI
                </p>
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  Chưa áp dụng
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Đã tạo: {sections.join(" · ")}
              </p>
              <div className="mt-3 space-y-1.5 rounded-2xl border border-linen bg-white p-3 text-xs leading-5 text-charcoal/75">
                {draft.fullName.trim() !== "" && (
                  <p><span className="font-semibold">Họ tên:</span> {draft.fullName}</p>
                )}
                {draft.summary.trim() !== "" && (
                  <p className="line-clamp-3"><span className="font-semibold">Tóm tắt:</span> {draft.summary}</p>
                )}
                {draft.experience.trim() !== "" && (
                  <p className="line-clamp-3"><span className="font-semibold">Kinh nghiệm:</span> {draft.experience}</p>
                )}
                {draft.skills.length > 0 && (
                  <p><span className="font-semibold">Kỹ năng:</span> {draft.skills.join(", ")}</p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" className="rounded-full" onClick={handleApply}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Áp dụng vào CV
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={handleRegenerate}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Tạo lại
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => promptRef.current?.focus()}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Chỉnh prompt
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — live CV preview (existing Registry, no separate renderer) */}
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="mr-auto flex items-center gap-2 text-sm font-semibold text-charcoal">
              <FileText className="size-4 text-marine" />
              Xem trước trực tiếp
            </p>
            <select
              value={liveCv.templateId}
              onChange={(e) => setLiveCv((prev) => ({ ...prev, templateId: e.target.value }))}
              aria-label="Chọn mẫu CV"
              className="h-9 rounded-xl border border-input bg-white px-2.5 text-xs font-medium text-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-0.5 rounded-xl border border-input bg-white px-1">
              <button
                type="button"
                aria-label="Thu nhỏ"
                disabled={previewZoom <= 0.8}
                onClick={() => setPreviewZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}
                className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-muted disabled:opacity-40"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="w-9 text-center font-mono text-[11px] text-muted-foreground">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                type="button"
                aria-label="Phóng to"
                disabled={previewZoom >= 1.2}
                onClick={() => setPreviewZoom((z) => Math.min(1.2, +(z + 0.1).toFixed(2)))}
                className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-muted disabled:opacity-40"
              >
                <ZoomIn className="size-3.5" />
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl"
              onClick={() => window.print()}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Xuất PDF
            </Button>
          </div>

          <div className="rounded-3xl border border-linen bg-frost p-4 shadow-sm sm:p-6">
            {hasPreviewContent ? (
              <div
                className="origin-top overflow-hidden rounded-2xl border border-linen bg-white shadow-[0_12px_32px_rgba(53,92,140,0.10)]"
                style={{ transform: `scale(${previewZoom})`, width: `${100 / previewZoom}%` }}
              >
                <CvDocument data={liveCv} documentRef={documentRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-linen bg-white/70 px-4 py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileText className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-medium text-foreground">Chưa có nội dung xem trước</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Mô tả hồ sơ bên trái và bấm Tạo CV bằng AI, rồi Áp dụng bản nháp để xem tại đây.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              disabled={!hasPreviewContent || saving}
              onClick={() => persistAndGo(false)}
            >
              <Save className="mr-2 size-4" />
              {saving ? "Đang lưu..." : "Lưu nháp"}
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-xl bg-primary text-white hover:bg-primary-hover"
              disabled={!hasPreviewContent || saving}
              onClick={() => persistAndGo(true)}
            >
              Chỉnh sửa chi tiết
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Mẫu đang dùng: {TEMPLATE_REGISTRY[liveCv.templateId]?.name ?? DEFAULT_TEMPLATE_ID} — AI chỉ tạo nội dung, không đổi mẫu của bạn.
          </p>
        </div>
      </div>
    </div>
  );
}
