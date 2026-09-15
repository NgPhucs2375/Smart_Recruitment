"use client";

import { useMemo, useState } from "react";
import { Sparkles, ArrowRight, CircleCheck, TriangleAlert, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CvFormData } from "@/features/tao-cv/types";

interface AiAgentProps {
  data: CvFormData;
}

type Severity = "missing" | "improve" | "done";

type AssistantItem = {
  id: string;
  severity: Severity;
  message: string;
  target?: string;
};

/* Section anchors rendered by CvForm. Clicking "Đi tới mục" scrolls there. */
const SECTION_IDS = {
  lienHe: "cv-section-lien-he",
  kinhNghiem: "cv-section-kinh-nghiem",
  hocVan: "cv-section-hoc-van",
  kyNang: "cv-section-ky-nang",
  duAn: "cv-section-du-an",
} as const;

function buildChecklist(data: CvFormData): AssistantItem[] {
  const lh = data.thongTinLienHe;
  const items: AssistantItem[] = [];

  if (!lh.hoTen || !lh.email || !lh.sdt) {
    items.push({
      id: "contact",
      severity: "missing",
      message: "Thiếu thông tin liên hệ bắt buộc (họ tên, email, SĐT). Nhà tuyển dụng không thể liên lạc nếu thiếu mục này.",
      target: SECTION_IDS.lienHe,
    });
  }
  if (!lh.gioiThieuBanThan) {
    items.push({
      id: "intro-empty",
      severity: "missing",
      message: "Chưa có giới thiệu bản thân. Viết 3 đến 4 câu về mục tiêu và điểm mạnh nổi bật nhất.",
      target: SECTION_IDS.lienHe,
    });
  } else if (lh.gioiThieuBanThan.trim().length < 50) {
    items.push({
      id: "intro-short",
      severity: "improve",
      message: "Giới thiệu hơi ngắn. Mở rộng thêm kinh nghiệm và mục tiêu để tạo ấn tượng đầu.",
      target: SECTION_IDS.lienHe,
    });
  }
  if (data.kinhNghiemLamViec.length === 0 && data.hocVan.length === 0) {
    items.push({
      id: "empty-body",
      severity: "missing",
      message: "CV cần ít nhất một mục kinh nghiệm làm việc hoặc học vấn.",
      target: SECTION_IDS.kinhNghiem,
    });
  }
  if (data.kinhNghiemLamViec.length > 0 && !data.kinhNghiemLamViec.some((e) => e.moTa?.trim())) {
    items.push({
      id: "exp-desc",
      severity: "improve",
      message: "Mô tả chi tiết công việc và thành tựu trong mỗi vị trí. Con số cụ thể luôn thuyết phục hơn tính từ chung chung.",
      target: SECTION_IDS.kinhNghiem,
    });
  }
  if (data.kyNang.length > 0 && data.kyNang.length < 3) {
    items.push({
      id: "skills-few",
      severity: "improve",
      message: "Mới có ít kỹ năng. Bổ sung đủ 3 kỹ năng trở lên để tăng khả năng được chú ý.",
      target: SECTION_IDS.kyNang,
    });
  }
  if (data.kyNang.length === 0) {
    items.push({
      id: "skills-empty",
      severity: "missing",
      message: "Chưa có kỹ năng nào. Liệt kê kỹ năng khớp với vị trí đang ứng tuyển.",
      target: SECTION_IDS.kyNang,
    });
  }
  if (data.duAn.length === 0) {
    items.push({
      id: "projects",
      severity: "improve",
      message: "Thêm dự án đã làm để CV nổi bật hơn, nhất là với ngành IT.",
      target: SECTION_IDS.duAn,
    });
  }
  return items;
}

const severityStyle: Record<Severity, { icon: typeof CircleCheck; box: string; iconColor: string; label: string; pill: string }> = {
  missing: {
    icon: TriangleAlert,
    box: "border-destructive/30 bg-destructive/[0.04]",
    iconColor: "text-destructive",
    label: "Cần bổ sung",
    pill: "bg-destructive/10 text-destructive",
  },
  improve: {
    icon: Lightbulb,
    box: "border-sand/60 bg-sandsoft",
    iconColor: "text-bronze",
    label: "Nên cải thiện",
    pill: "bg-sand/25 text-bronze",
  },
  done: {
    icon: CircleCheck,
    box: "border-teal/30 bg-teal/[0.06]",
    iconColor: "text-teal",
    label: "Hoàn tất",
    pill: "bg-teal/15 text-navy",
  },
};

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function AiAgent({ data }: AiAgentProps) {
  const [scanned, setScanned] = useState(false);
  const items = useMemo(() => (scanned ? buildChecklist(data) : []), [scanned, data]);
  const missingCount = items.filter((i) => i.severity === "missing").length;

  return (
    <section aria-label="Trợ lý CV" className="overflow-hidden rounded-3xl border border-linen bg-card shadow-sm">
      <div className="bg-navy px-5 py-4 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-sand" /> Trợ lý CV
        </p>
        <p className="mt-1 text-xs leading-5 text-white/70">
          Quét nhanh các mục còn thiếu và gợi ý cách cải thiện. Kết quả cập nhật theo nội dung bạn đang nhập.
        </p>
      </div>

      <div className="space-y-2.5 p-5">
        {!scanned ? (
          <div>
            <p className="text-sm leading-6 text-charcoal/60">
              Bấm quét để xem CV còn thiếu gì và nên sửa ở đâu. Mỗi gợi ý đều dẫn thẳng tới đúng mục trong form.
            </p>
            <Button size="sm" className="mt-3 w-full rounded-full" onClick={() => setScanned(true)}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Quét CV ngay
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-teal/30 bg-teal/[0.06] p-3.5">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-teal" />
            <div>
              <p className="text-sm font-semibold text-charcoal">CV đã đầy đủ các mục quan trọng</p>
              <p className="mt-0.5 text-xs leading-5 text-charcoal/60">
                Kiểm tra lại chính tả rồi bấm Lưu CV. Tiếp tục cập nhật mỗi khi có kinh nghiệm mới.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5" role="list" aria-label="Gợi ý cải thiện CV">
            <p className="text-xs font-semibold text-charcoal/60">
              Tìm thấy {items.length} điểm{missingCount > 0 ? `, trong đó ${missingCount} mục bắt buộc` : ""}:
            </p>
            {items.map((item) => {
              const style = severityStyle[item.severity];
              const Icon = style.icon;
              return (
                <div key={item.id} role="listitem" className={cn("rounded-2xl border p-3.5", style.box)}>
                  <div className="flex items-start gap-2.5">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", style.iconColor)} />
                    <div className="min-w-0 flex-1">
                      <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", style.pill)}>
                        {style.label}
                      </span>
                      <p className="mt-1.5 text-sm leading-6 text-charcoal/80">{item.message}</p>
                      {item.target && (
                        <button
                          type="button"
                          onClick={() => scrollToSection(item.target!)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-marine underline underline-offset-4 hover:text-navy"
                        >
                          Đi tới mục này <ArrowRight className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" size="sm" className="w-full rounded-full" onClick={() => setScanned(false)}>
              Ẩn gợi ý
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
