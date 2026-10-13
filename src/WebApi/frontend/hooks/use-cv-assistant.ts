"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { toast } from "sonner";
import type { CvFormData } from "@/lib/types";
import {
  CV_CONTACT_FIELDS,
  CV_PENDING_PATCH_EVENT,
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
  applyTenFilePatch,
  removeSectionItem,
  sectionReport,
} from "@/features/ai-cv/merge-cv-patch";
import { reviewCurrentCv } from "@/features/ai-cv/review-current-cv";
import { suggestThemes, ensureActiveTemplate, CV_APPLY_THEME_EVENT, type ApplyThemeDetail } from "@/features/ai-cv/theme-recommendations";
import {
  cvContactPatchSchema,
  cvSectionUpsertSchema,
} from "@/features/ai-cv/cv-tool-schemas";
import { CV_BUDGET_PROMPT_HINT } from "@/features/tao-cv/cv-budget";

type UseCvAssistantOpts = {
  data: CvFormData;
  onChange: (data: CvFormData) => void;
  /** true khi form đã load xong (đổ pending-patch sau thời điểm này). */
  ready?: boolean;
  /** Tắt tool khi rời khỏi màn hình soạn CV. */
  enabled?: boolean;
  /** Mở một CV đã lưu vào form (handleSelect của TaoCvView). Trả true nếu thành công. */
  selectCv?: (id: number) => Promise<boolean>;
};

const contactSchema = z.object({
  field: z.string().describe(`Field liên hệ, một trong: ${CV_CONTACT_FIELDS.join(", ")}`),
  value: z.string().describe(
    "Giá trị mới (bỏ trống để giữ nguyên). Riêng gioiThieuBanThan phải tự tóm gọn 450-600 ký tự, không dán nguyên văn dài.",
  ),
});

const bulkContactSchema = z.object({
  contact: cvContactPatchSchema.describe(
    `NHIỀU field liên hệ trong MỘT lượt (khuyên dùng khi ≥2 field). Key là một trong: ${CV_CONTACT_FIELDS.join(", ")}. ` +
      "Chỉ điền field user nói rõ, field rỗng sẽ bị bỏ qua. " +
      CV_BUDGET_PROMPT_HINT,
  ),
});

const sectionItemsSchema = cvSectionUpsertSchema.describe(
  `Thêm/sửa item của đúng một mục CV (${CV_SECTION_KEYS.join(", ")}). ` +
    "Dùng đúng field được khai báo; không truyền reason hoặc văn bản tổng hợp. " +
    "Muốn sửa item đã có thì truyền id từ getCvFormSnapshot. " +
    CV_BUDGET_PROMPT_HINT,
);

const removeItemSchema = z.object({
  section: z.string().describe(`Mục CV, một trong: ${CV_SECTION_KEYS.join(", ")}`),
  id: z.string().describe("id của item cần xóa (lấy từ getCvFormSnapshot)"),
});

const templateSchema = z.object({
  templateId: z.string().describe("ID mẫu trong TEMPLATE_REGISTRY (vd: tech-modern, minimal-ats, data-specialist...). Chỉ dùng slug có sẵn."),
});

const loadCvSchema = z.object({
  cvId: z.number().int().describe("ID của CV đã lưu cần mở vào form (lấy từ kết quả list_my_cvs của backend tool)"),
});

const metaSchema = z.object({
  tenFile: z
    .string()
    .describe(
      "Tên file CV (hiển thị ở danh sách CV, vd: CV-Tester-2026). " +
        "Khác hoTen trong liên hệ. Khi user nói 'Tạo CV với tên là X' mà chưa có họ tên thì điền cả tenFile và hoTen.",
    ),
});

/**
 * Gắn Adam vào form CV: expose snapshot đọc + 8 frontend tool (7 ghi + 1 mở CV đã lưu).
 * Ghi thẳng vào form live (preview realtime), mỗi lần ghi có toast Hoàn tác.
 * Mount trong /tao-cv và /CV. Chat từ trang khác dùng useGlobalCvAssistant
 * (navigateToCvEditor + pending-patch) rồi đổ vào đây.
 */
export function useCvAssistant({
  data,
  onChange,
  ready = true,
  enabled = true,
  selectCv,
}: UseCvAssistantOpts) {
  const router = useRouter();
  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  const selectCvRef = useRef(selectCv);
  const undoRef = useRef<CvFormData | null>(null);
  const pendingDoneRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
    onChangeRef.current = onChange;
    selectCvRef.current = selectCv;
  });

  const undo = () => {
    if (!undoRef.current) {
      toast.info("Không có gì để hoàn tác.");
      return;
    }
    const previous = undoRef.current;
    dataRef.current = previous;
    onChangeRef.current(previous);
    undoRef.current = null;
    toast.success("Đã hoàn tác thay đổi của Adam.");
  };

  const commit = (next: CvFormData, toastLabel: string) => {
    if (next === dataRef.current) return;
    undoRef.current = dataRef.current;
    // Frontend tools can run back-to-back before React commits a render.
    // Mirror synchronously so every following tool merges onto the latest CV.
    dataRef.current = next;
    onChangeRef.current(next);
    toast.success(toastLabel, {
      action: { label: "Hoàn tác", onClick: undo },
    });
  };

  const applyActiveTemplate = async (templateId: string) => {
    if (!ready || !enabled) return { success: false, message: "Trình soạn chưa sẵn sàng." };
    const expected = dataRef.current;
    await ensureActiveTemplate(templateId);
    if (!mountedRef.current) return { success: false, message: "Trình soạn đã đóng; chưa áp dụng mẫu." };
    if (dataRef.current !== expected) return { success: false, message: "CV đã thay đổi trong lúc kiểm tra mẫu; hãy chọn lại." };
    const result = applyTemplatePatch(dataRef.current, templateId);
    if (result.applied) commit(result.next, "Adam đã đổi mẫu bản nháp; nội dung được giữ nguyên");
    return { success: result.applied || dataRef.current.templateId === templateId, message: result.report + " Chưa lưu vào database." };
  };
  const applyTemplateRef = useRef(applyActiveTemplate);
  useEffect(() => { applyTemplateRef.current = applyActiveTemplate; });
  useEffect(() => {
    mountedRef.current = enabled;
    if (!enabled) return;
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<ApplyThemeDetail>).detail;
      void applyTemplateRef.current(detail.templateId).then(detail.complete).catch(error => detail.complete({ success: false, message: error instanceof Error ? error.message : "Không đổi được mẫu." }));
    };
    window.addEventListener(CV_APPLY_THEME_EVENT, receive);
    return () => { mountedRef.current = false; window.removeEventListener(CV_APPLY_THEME_EVENT, receive); };
  }, [enabled]);

  // Form là UI-owned state: agent đọc qua context, chỉ ghi qua tool.
  // Snapshot nhỏ (vài KB) nên build trực tiếp mỗi render, khỏi memo.
  const snapshot = toJsonSafe(buildAssistantSnapshot(data));
  useAgentContext({
    description:
      "Dữ liệu CV đang mở trong trình soạn thảo (nguồn đúng nhất). " +
      "Điền form bằng frontend tool, KHÔNG yêu cầu user gõ lại thứ đã có ở đây. " +
      "Khi gợi ý mẫu CV, đọc contact.viTriUngTuyen và kinh nghiệm/kỹ năng từ snapshot này làm tiêu chí cho suggestCvThemeForDraft, " +
      "không hỏi lại user thứ snapshot đã có. " +
      "Khi user yêu cầu review/kiểm tra CV hoặc hỏi điểm yếu cần bổ sung, hãy xác định section " +
      "liên quan từ snapshot và BẮT BUỘC gọi focusSections để scroll + highlight đúng các khu vực " +
      "trước hoặc cùng lúc với phần giải thích. Nếu user đồng ý bổ sung thì mới gọi tool cập nhật dữ liệu. " +
      "Luôn giữ CV trong 2 trang A4: " +
      CV_BUDGET_PROMPT_HINT +
      " User xem preview rồi yêu cầu sửa sau nếu chưa vừa ý.",
    value: snapshot,
  });

  // Note:
    // nullish: cho phep nhan null hoac undefined === nullable() || optional()
  useFrontendTool({
    name: "suggestCvThemeForDraft",
    description: "Gợi ý tối đa 3 mẫu theo CV NHÁP hiện tại và tiêu chí user. Dùng thay suggest_cv_theme khi đang editor; không đọc CV khác trong database, không ghi/lưu CV. Có thể gọi setCvTemplate sau kết quả nếu user yêu cầu chọn giúp/áp dụng. " +
      "ViTri tự lấy từ form (viTriUngTuyen, nếu trống lấy chucDanh kinh nghiệm gần nhất) nên user không cần nói vẫn có; " +
      "nganh/capBac suy từ snapshot CV (vị trí, chức danh, kỹ năng) nếu user chưa nói; backend tự suy thêm và cảnh báo khi thiếu — " +
      "cứ gọi tool ngay, KHÔNG hỏi user cung cấp thông tin trước; trình bày kết quả kèm caveat rồi mới hỏi tinh chỉnh nếu cần.",
    parameters: z.object({ viTri: z.string().nullish(), nganh: z.string().nullish(), capBac: z.string().nullish().describe("intern/fresher/junior/mid/senior/lead/manager; cấp độ công việc mục tiêu"),
      phongCach: z.string().nullish(), soCot: z.number().int().min(1).max(2).nullish(), uuTienATS: z.boolean().optional(), batBuocATS: z.boolean().optional(), nhanManh: z.array(z.enum(["projects", "experience", "skills", "education"])).max(3).optional() }),
    available: enabled && ready,
    handler: async args => {
      const draft = dataRef.current;
      const latestRole = draft.kinhNghiemLamViec.find((job) => job.chucDanh?.trim())?.chucDanh?.trim() ?? "";
      return JSON.stringify(await suggestThemes({ UseSavedCv: false,
        ViTri: args.viTri?.trim() || draft.thongTinLienHe.viTriUngTuyen?.trim() || latestRole,
        Nganh: args.nganh, CapBac: args.capBac, PhongCach: args.phongCach, SoCot: args.soCot,
        UuTienATS: args.uuTienATS ?? true, BatBuocATS: args.batBuocATS ?? false, NhanManh: args.nhanManh,
        KyNang: draft.kyNang.map(s => s.tenKyNang).filter(Boolean).slice(0, 100) }));
    },
  }, [enabled, ready]);

  useFrontendTool(
    {
      name: "reviewCurrentUnsavedCv",
      description:
        "Đọc và kiểm tra CV NHÁP đang mở trong trình chỉnh sửa. " +
        "Không đọc CV database. Dùng tool này khi user hỏi CV hiện tại còn thiếu gì, " +
        "có những section nào hoặc cần bổ sung nội dung nào. " +
        "Phải dựa vào answer và dữ liệu trả về, không tự liệt kê thiếu các field đang có " +
        "và không yêu cầu làm lại toàn bộ CV.",
      parameters: z.object({}).strict(),
      available: enabled,
      handler: async () => JSON.stringify(reviewCurrentCv(dataRef.current)),
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "updateCvContact",
      description:
        "Ghi một field liên hệ vào form CV (preview cập nhật ngay). Giá trị rỗng sẽ bị bỏ qua. " +
        "Luôn tự tóm gọn vừa 2 trang A4, riêng gioiThieuBanThan 450-600 ký tự: giữ ý chính và số liệu, không dán nguyên văn dài.",
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
      name: "updateCvContactBulk",
      description:
        "Ghi NHIỀU field liên hệ trong MỘT lượt (bulk-fill, preview cập nhật ngay). " +
        "Ưu tiên tool này thay vì gọi updateCvContact lẻ nhiều lần. Giá trị rỗng sẽ bị bỏ qua. " +
        "Luôn tự tóm gọn vừa 2 trang A4: " +
        CV_BUDGET_PROMPT_HINT,
      parameters: bulkContactSchema,
      available: enabled,
      handler: async ({ contact }) => {
        if (!contact || typeof contact !== "object" || Array.isArray(contact)) {
          return "Bỏ qua vì contact không phải object.";
        }
        let next = dataRef.current;
        const done: string[] = [];
        const skipped: string[] = [];
        for (const [field, value] of Object.entries(contact)) {
          if (!isCvContactField(field)) {
            skipped.push(`field lạ ${field}`);
            continue;
          }
          if (typeof value !== "string" || !value.trim()) continue;
          const r = applyContactPatch(next, field, value);
          next = r.next;
          if (r.applied) done.push(field);
        }
        if (done.length > 0) commit(next, `Adam đã cập nhật ${done.join(", ")}`);
        const parts: string[] = [];
        if (done.length > 0) parts.push(`đã điền: ${done.join(", ")}`);
        if (skipped.length > 0) parts.push(`bỏ qua: ${skipped.join("; ")}`);
        return parts.length > 0 ? parts.join(". ") + "." : "Không có gì để ghi.";
      },
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "upsertCvSectionItem",
      description:
        "Thêm/sửa HÀNG LOẠT item của một mục CV trong một lượt (bulk-fill). " +
        "Không id và không đủ khóa tên thì TẠO MỚI. Ngày lỗi không ghi mà báo lại. " +
        "Luôn tự tóm gọn vừa 2 trang A4: " +
        CV_BUDGET_PROMPT_HINT,
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
      name: "updateCvMeta",
      description:
        "Đặt tên file CV (tenFile, top-level). Khác hoTen trong liên hệ. " +
        "Khi user nói 'Tạo CV với tên là X' thì gọi tool này (và updateCvContact hoTen nếu chưa có).",
      parameters: metaSchema,
      available: enabled,
      handler: async ({ tenFile }) => {
        const r = applyTenFilePatch(dataRef.current, tenFile);
        if (r.applied) commit(r.next, "Adam đã đặt tên CV");
        return r.report;
      },
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "setCvTemplate",
      description: "Đổi mẫu CV hiển thị. Khi cần gợi ý, gọi backend tool suggest_cv_theme trước rồi áp dụng slug được đề xuất.",
      parameters: templateSchema,
      available: enabled,
      handler: async ({ templateId }) => {
        try { return JSON.stringify(await applyTemplateRef.current(templateId)); }
        catch (error) { return JSON.stringify({ success: false, message: error instanceof Error ? error.message : "Không đổi được mẫu." }); }
      },
    },
    [enabled],
  );

  useFrontendTool(
    {
      name: "getCvFormSnapshot",
      description:
        "Đọc toàn bộ trạng thái CV NHÁP hiện đang mở trong /CV. " +
        "Đây là nguồn chính xác nhất để review hoặc chỉnh CV chưa lưu. " +
        "Bao gồm thông tin liên hệ, section, item, field, template và field còn thiếu. " +
        "Không đọc CV đã lưu trong database.",
      parameters: z.object({}).strict(),
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
          tenFile: d.tenFile,
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

  useFrontendTool(
    {
      name: "loadCvFromBackend",
      description:
        "Mở MỘT CV đã lưu vào workspace /CV để chỉnh tiếp (thay toàn bộ form hiện tại). " +
        "cvId lấy từ backend tool list_my_cvs. Nếu form đang có thay đổi chưa lưu, nhắc user trước khi gọi. " +
        "Sau khi mở, đọc lại trạng thái form bằng getCvFormSnapshot trước khi sửa.",
      parameters: loadCvSchema,
      available: enabled,
      handler: async ({ cvId }) => {
        if (selectCvRef.current) {
          const ok = await selectCvRef.current(cvId);
          if (ok) {
            toast.success(`Adam đã mở CV #${cvId} vào trình soạn`);
            return `Đã mở CV ${cvId} vào form. Dữ liệu form bây giờ là của CV này.`;
          }
          return `Không tải được CV ${cvId}. Báo người dùng thử lại hoặc mở thủ công từ hồ sơ.`;
        }
        router.push(`/CV?cv=${cvId}`);
        return `Đang chuyển sang /CV để mở CV ${cvId}. Workspace sẽ tự load CV khi đến nơi.`;
      },
    },
    [enabled],
  );

  // Pending patch: đổ vào form sau khi load xong (chat từ trang khác nhảy sang),
  // và lắng nghe event cùng-tab khi user chat ngay trong /CV mà agent
  // lại gọi navigateToCvEditor thay vì tool điền trực tiếp.
  useEffect(() => {
    const drainPending = (isInitial: boolean) => {
      if (!ready) return;
      if (isInitial) {
        if (pendingDoneRef.current) return;
        pendingDoneRef.current = true;
      }
      const pending = loadPendingCvPatch();
      if (!pending) return;
      let next = dataRef.current;
      const notes: string[] = [];
      if (pending.tenFile && typeof pending.tenFile === "string" && pending.tenFile.trim()) {
        const r = applyTenFilePatch(next, pending.tenFile);
        next = r.next;
        if (r.applied) notes.push(`tên file "${pending.tenFile.trim()}"`);
      }
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
    };

    drainPending(true);
    const onPatch = () => drainPending(false);
    window.addEventListener(CV_PENDING_PATCH_EVENT, onPatch);
    return () => window.removeEventListener(CV_PENDING_PATCH_EVENT, onPatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { undo };
}
