"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CvFormData } from "../types";

interface AiAgentProps {
  data: CvFormData;
  onUpdate: (data: CvFormData) => void;
}

type AiSuggestion = {
  id: string;
  type: "improvement" | "warning" | "tip";
  message: string;
};

export function AiAgent({ data }: AiAgentProps) {
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

  const typeConfig = {
    improvement: { color: "bg-blue-100 text-blue-700", label: "Cải thiện" },
    warning: { color: "bg-yellow-100 text-yellow-700", label: "Cảnh báo" },
    tip: { color: "bg-green-100 text-green-700", label: "Gợi ý" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Đánh giá CV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={analyzeCv}
          disabled={isAnalyzing}
          className="w-full"
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
                  className="flex items-start gap-2 rounded-lg border border-border p-3"
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