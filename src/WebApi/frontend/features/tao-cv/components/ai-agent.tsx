"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Wand2,
  Check,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CvFormData } from "../types";
import {
  summaryTemplates,
  experienceStarTemplate,
  popularSkills,
} from "../content-templates";

interface AiAgentProps {
  data: CvFormData;
  onUpdate: (data: CvFormData) => void;
}

type AiSuggestion = {
  id: string;
  type: "improvement" | "warning" | "tip";
  message: string;
};

const STEPS = ["Chọn vị trí", "AI gợi ý nội dung", "Chèn vào CV", "Xem trước & xuất PDF"] as const;

export function AiAgent({ data, onUpdate }: AiAgentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);

  const analyzeCv = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const lh = data.thongTinLienHe;
      const newSuggestions: AiSuggestion[] = [];

      if (!lh.hoTen || !lh.email || !lh.sdt) {
        newSuggestions.push({
          id: "1",
          type: "warning",
          message: "Thiếu thông tin liên hệ bắt buộc (họ tên, email, SĐT).",
        });
      }

      if (!lh.gioiThieuBanThan) {
        newSuggestions.push({
          id: "2",
          type: "warning",
          message: "CV chưa có phần giới thiệu bản thân. Hãy viết 3-4 câu về mục tiêu và điểm mạnh.",
        });
      } else if (lh.gioiThieuBanThan.length < 50) {
        newSuggestions.push({
          id: "3",
          type: "improvement",
          message: "Giới thiệu quá ngắn. Hãy mở rộng thêm về kinh nghiệm và mục tiêu.",
        });
      }

      if (data.kinhNghiemLamViec.length === 0 && data.hocVan.length === 0) {
        newSuggestions.push({
          id: "4",
          type: "warning",
          message: "CV cần ít nhất một mục kinh nghiệm làm việc hoặc học vấn.",
        });
      }

      if (data.kinhNghiemLamViec.length > 0 && !data.kinhNghiemLamViec.some((e) => e.moTa)) {
        newSuggestions.push({
          id: "5",
          type: "tip",
          message: "Hãy mô tả chi tiết công việc và thành tựu trong mỗi vị trí.",
        });
      }

      if (data.kyNang.length < 3) {
        newSuggestions.push({
          id: "6",
          type: "tip",
          message: "Nên có ít nhất 3 kỹ năng để tăng khả năng được chú ý.",
        });
      }

      if (data.duAn.length === 0) {
        newSuggestions.push({
          id: "7",
          type: "tip",
          message: "Thêm dự án đã làm sẽ giúp CV nổi bật hơn, nhất là với IT.",
        });
      }

      if (newSuggestions.length === 0) {
        newSuggestions.push({
          id: "8",
          type: "tip",
          message: "CV của bạn đã khá đầy đủ! Hãy kiểm tra lại chính tả trước khi lưu.",
        });
      }

      setSuggestions(newSuggestions);
      setIsAnalyzing(false);
    }, 800);
  };

  const stepIndex = useMemo(() => {
    if (!data.thongTinLienHe.viTriUngTuyen.trim()) return 0;
    if (suggestions.length === 0) return 1;
    const hasContent =
      data.thongTinLienHe.gioiThieuBanThan.trim() !== "" ||
      data.kinhNghiemLamViec.length > 0;
    if (!hasContent) return 2;
    return 3;
  }, [data, suggestions.length]);

  function fillIfEmpty(get: (d: CvFormData) => string, set: (d: CvFormData, v: string) => CvFormData, template: string, label: string) {
    if (get(data).trim() !== "") {
      toast.info("Mục đã có nội dung — xóa trước khi chèn mẫu mới.");
      return;
    }
    onUpdate(set(data, template));
    toast.success(`Đã chèn mẫu ${label}.`);
  }

  function insertSummary(template: string, label: string) {
    fillIfEmpty(
      (d) => d.thongTinLienHe.gioiThieuBanThan,
      (d, v) => ({ ...d, thongTinLienHe: { ...d.thongTinLienHe, gioiThieuBanThan: v } }),
      template,
      label
    );
  }

  function insertExperienceTemplate() {
    const first = data.kinhNghiemLamViec[0];
    if (!first) {
      toast.info("Hãy thêm một mục kinh nghiệm trước.");
      return;
    }
    if (first.moTa.trim() !== "") {
      toast.info("Mục kinh nghiệm đã có mô tả.");
      return;
    }
    onUpdate({
      ...data,
      kinhNghiemLamViec: data.kinhNghiemLamViec.map((k, i) =>
        i === 0 ? { ...k, moTa: experienceStarTemplate } : k
      ),
    });
    toast.success("Đã chèn khung mô tả STAR.");
  }

  function addPopularSkills(skills: string[], label: string) {
    const existing = new Set(data.kyNang.map((k) => k.tenKyNang.trim().toLowerCase()));
    const fresh = skills.filter((s) => !existing.has(s.toLowerCase()));
    if (fresh.length === 0) {
      toast.info(`Đã có đủ kỹ năng ${label}.`);
      return;
    }
    onUpdate({
      ...data,
      kyNang: [
        ...data.kyNang,
        ...fresh.map((s) => ({
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          tenKyNang: s,
          mucDoThanhThao: "",
          soNamKinhNghiem: "",
        })),
      ],
    });
    toast.success(`Đã thêm ${fresh.length} kỹ năng ${label}.`);
  }

  const typeConfig = {
    improvement: { color: "bg-blue-100 text-blue-700", label: "Cải thiện" },
    warning: { color: "bg-yellow-100 text-yellow-700", label: "Cảnh báo" },
    tip: { color: "bg-green-100 text-green-700", label: "Gợi ý" },
  };

  return (
    <Card className="overflow-hidden border-teal/25">
      <CardHeader className="bg-teal/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-navy text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base">AI hỗ trợ viết CV</CardTitle>
            <CardDescription>Tối ưu nội dung bằng gợi ý và mẫu có sẵn</CardDescription>
          </div>
        </div>
        <ol className="mt-3 flex items-center gap-1" aria-label="Tiến trình">
          {STEPS.map((step, i) => (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                className={
                  i < stepIndex
                    ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white"
                    : i === stepIndex
                      ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white"
                      : "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
                }
              >
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden truncate text-[11px] text-muted-foreground min-[420px]:block">
                {step}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
            </li>
          ))}
        </ol>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Gợi ý nhanh — bấm để chèn mẫu:</p>
          <div className="flex flex-wrap gap-1.5">
            {summaryTemplates.map((t) => (
              <Button
                key={t.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full text-xs"
                onClick={() => insertSummary(t.text, `tóm tắt ${t.label}`)}
              >
                <FileText className="mr-1 h-3 w-3" />
                Tóm tắt {t.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full text-xs"
              onClick={insertExperienceTemplate}
            >
              <Wand2 className="mr-1 h-3 w-3" />
              Khung STAR
            </Button>
            {popularSkills.map((g) => (
              <Button
                key={g.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full text-xs"
                onClick={() => addPopularSkills(g.skills, g.label)}
              >
                <FileText className="mr-1 h-3 w-3" />
                Kỹ năng {g.label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={analyzeCv}
          disabled={isAnalyzing}
          className="w-full rounded-xl"
          variant={suggestions.length > 0 ? "outline" : "default"}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {suggestions.length > 0 ? "Phân tích lại" : "Đánh giá CV"}
            </>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s) => {
              const config = typeConfig[s.type];
              return (
                <div
                  key={s.id}
                  className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <Badge variant="secondary" className={`text-xs mb-1 ${config.color}`}>
                      {config.label}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{s.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
