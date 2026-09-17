"use client";

import { useEffect, useRef } from "react";
import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { toast } from "sonner";
import type { CvFormData } from "@/lib/types";
import {
  CV_CONTACT_FIELDS,
  CV_SECTION_KEYS,
  buildAssistantSnapshot,
  clearPendingCvPatch,
  isCvContactField,
  isCvSectionKey,
  loadPendingCvPatch,
  missingRequiredFields,
  toJsonSafe,
} from "@/features/ai-cv/cv-assistant-state";
import {
  applyContactPatch,
  applySectionItems,
  applyTemplatePatch,
  removeSectionItem,
  sectionReport,
} from "@/features/ai-cv/merge-cv-patch";

type UseCvAssistantOpts = {
  data: CvFormData;
  onChange: (data: CvFormData) => void;
  /** true khi form đã load xong (đổ pending-patch sau thời điểm này). */
  ready?: boolean;
  /** Tắt tool khi rời khỏi màn hình soạn CV. */
  enabled?: boolean;
};

const contactSchema = z.object({
  field: z.string().describe(`Field liên hệ, một trong: ${CV_CONTACT_FIELDS.join(", ")}`),
  value: z.string().describe("Giá trị mới (bỏ trống để giữ nguyên)"),
});

const sectionItemsSchema = z.object({
  section: z.string().describe(`Mục CV, một trong: ${CV_SECTION_KEYS.join(", ")}`),
  items: z
    .array(z.record(z.string(), z.unknown()))
    .min(1)
    .max(20)
    .describe(
      "MẢNG item cần thêm/sửa. Muốn SỬA item đã có: truyền đúng id (lấy từ getCvFormSnapshot) " +
        "hoặc đủ bộ khóa tên (hocVan: truong+chuyenNganh; kinhNghiem: congTy+chucDanh; " +
        "duAn: tenDuAn; kyNang: tenKyNang; chungChi: tenChungChi+donViCap). " +
        "Ngày viết MM/YYYY hoặc YYYY. kỹ năng mảng congNghe/kyNangSuDung cách nhau bằng dấu phẩy.",
    ),
});

const removeItemSchema = z.object({
  section: z.string().describe(`Mục CV, một trong: ${CV_SECTION_KEYS.join(", ")}`),
  id: z.string().describe("id của item cần xóa (lấy từ getCvFormSnapshot)"),
});

const templateSchema = z.object({
  templateId: z.string().describe("ID mẫu: minimal-ats (1 cột, chuẩn ATS) hoặc tech-modern (2 cột, cho IT)"),
});

/**
 * Gắn Adam vào form CV: expose snapshot đọc + 5 frontend tool ghi.
 * Ghi thẳng vào form live (preview realtime), mỗi lần ghi có toast Hoàn tác.
 */
export function useCvAssistant({ data, onChange, ready = true, enabled = true }: UseCvAssistantOpts) {
  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  const undoRef = useRef<CvFormData | null>(null);
  const pendingDoneRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
    onChangeRef.current = onChange;
  });

  const undo = () => {
    if (!undoRef.current) {
      toast.info("Không có gì để hoàn tác.");
      return;
    }
    onChangeRef.current(undoRef.current);
    undoRef.current = null;
    toast.success("Đã hoàn tác thay đổi của Adam.");
  };

  const commit = (next: CvFormData, toastLabel: string) => {
    if (next === dataRef.current) return;
    undoRef.current = dataRef.current;
    onChangeRef.current(next);
    toast.success(toastLabel, {
      action: { label: "Hoàn tác", onClick: undo },
    });
  };

  // Form là UI-owned state: agent đọc qua context, chỉ ghi qua tool.
  // Snapshot nhỏ (vài KB) nên build trực tiếp mỗi render, khỏi memo.
  const snapshot = toJsonSafe(buildAssistantSnapshot(data));
  useAgentContext({
    description:
      "Dữ liệu CV đang mở trong trình soạn thảo (nguồn đúng nhất). " +
      "Điền form bằng frontend tool, KHÔNG yêu cầu user gõ lại thứ đã có ở đây.",
    value: snapshot,
  });

  useFrontendTool(
    {
      name: "updateCvContact",
      description: "Ghi một field liên hệ vào form CV (preview cập nhật ngay). Giá trị rỗng sẽ bị bỏ qua.",
      parameters: contactSchema,
      available: enabled,
      handler: async ({ field, value }) => {
        if (!isCvContactField(field)) {
          return `Field không hợp lệ: ${field}. Chỉ nhận: ${CV_CONTACT_FIELDS.join(", ")}.`;
        }
        const r = applyContactPatch(dataRef.current, field, value);
        if (r.applied) commit(r.next, `Adam đã cập nhật ${field}`);
        return r.report;
      },
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "upsertCvSectionItem",
      description:
        "Thêm/sửa HÀNG LOẠT item của một mục CV trong một lượt (bulk-fill). " +
        "Không id và không đủ khóa tên thì TẠO MỚI. Ngày lỗi không ghi mà báo lại.",
      parameters: sectionItemsSchema,
      available: enabled,
      handler: async ({ section, items }) => {
        if (!isCvSectionKey(section)) {
          return `Mục không hợp lệ: ${section}. Chỉ nhận: ${CV_SECTION_KEYS.join(", ")}.`;
        }
        const r = applySectionItems(dataRef.current, section, items);
        const report = sectionReport(section, r);
        if (r.created.length > 0 || r.updated.length > 0) {
          commit(r.next, `Adam đã cập nhật ${r.created.length + r.updated.length} mục`);
        }
        return report;
      },
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "removeCvSectionItem",
      description: "Xóa một item khỏi mục CV theo id. Chỉ gọi khi user yêu cầu xóa rõ ràng.",
      parameters: removeItemSchema,
      available: enabled,
      handler: async ({ section, id }) => {
        const r = removeSectionItem(dataRef.current, section, id);
        if (r.removed) commit(r.next, "Adam đã xóa một mục");
        return r.report;
      },
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "setCvTemplate",
      description: "Đổi mẫu CV hiển thị. IT dùng tech-modern, còn lại minimal-ats.",
      parameters: templateSchema,
      available: enabled,
      handler: async ({ templateId }) => {
        const r = applyTemplatePatch(dataRef.current, templateId);
        if (r.applied) commit(r.next, "Adam đã đổi mẫu CV");
        return r.report;
      },
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "getCvFormSnapshot",
      description:
        "Đọc tóm tắt form hiện tại: field bắt buộc còn thiếu, số lượng từng mục, id các item. " +
        "Gọi trước khi sửa item đã có hoặc khi cần biết còn thiếu gì.",
      available: enabled,
      handler: async () => {
        const d = dataRef.current;
        return JSON.stringify({
          missing: missingRequiredFields(d),
          counts: {
            hocVan: d.hocVan.length,
            kinhNghiemLamViec: d.kinhNghiemLamViec.length,
            duAn: d.duAn.length,
            kyNang: d.kyNang.length,
            chungChi: d.chungChi.length,
          },
          templateId: d.templateId,
          contact: {
            hoTen: d.thongTinLienHe.hoTen,
            email: d.thongTinLienHe.email,
            sdt: d.thongTinLienHe.sdt,
            viTriUngTuyen: d.thongTinLienHe.viTriUngTuyen,
          },
          items: toJsonSafe(buildAssistantSnapshot(d).items),
        });
      },
    },
    [enabled],
  );

  // Pending patch từ chat ở trang khác: đổ vào form sau khi load xong.
  useEffect(() => {
    if (!ready || pendingDoneRef.current) return;
    pendingDoneRef.current = true;
    const pending = loadPendingCvPatch();
    if (!pending) return;
    let next = dataRef.current;
    const notes: string[] = [];
    if (pending.contact) {
      for (const [field, value] of Object.entries(pending.contact)) {
        if (!isCvContactField(field) || typeof value !== "string" || !value.trim()) continue;
        const r = applyContactPatch(next, field, value);
        next = r.next;
        if (r.applied) notes.push(field);
      }
    }
    if (pending.sections) {
      for (const s of pending.sections) {
        if (!s || !isCvSectionKey(s.section) || !Array.isArray(s.items)) continue;
        const r = applySectionItems(next, s.section, s.items);
        next = r.next;
      }
    }
    if (pending.templateId) {
      next = applyTemplatePatch(next, pending.templateId).next;
    }
    clearPendingCvPatch();
    if (next !== dataRef.current) {
      commit(next, "Đã đưa thông tin từ chat Adam vào form");
      if (notes.length > 0) {
        toast.info(`Đã điền từ chat: ${notes.join(", ")}. Kiểm tra lại rồi bấm Lưu CV.`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { undo };
}
