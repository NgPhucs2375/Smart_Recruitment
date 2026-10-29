"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { toast } from "sonner";
import type { AdamRole } from "@/lib/adam-role";
import {
  isCvContactField,
  isCvSectionKey,
  savePendingCvPatch,
  loadPendingCvPatch,
  type PendingSectionPatch,
} from "@/features/ai-cv/cv-assistant-state";
import {
  getAdamPages,
  getNavigableRoute,
  type NavigablePage,
} from "@/components/navigation/navigation-routes";
import { ensureActiveTemplate } from "@/features/ai-cv/theme-recommendations";
import {
  CV_FOCUS_SECTIONS,
  getCvFocusSectionLabel,
  requestCvSectionsFocus,
  type CvFocusSection,
} from "@/features/ai-cv/cv-focus";
import {
  cvContactPatchSchema,
  cvSectionCreateSchema,
} from "@/features/ai-cv/cv-tool-schemas";

/**
 * Global Adam bridge: mount MỘT lần trong CopilotProvider (protected layout).
 *
 * Vấn đề gốc: `useCvAssistant` (updateCvContact/upsertCvSectionItem/...)
 * chỉ mount trong /tao-cv (tao-cv-view.tsx). Chat bằng CopilotPopup từ
 * trang khác (/CV, /, /dashboard...) thì LLM vẫn emit tool_call nhưng
 * client không có handler -> im lặng, không điền, không điều hướng.
 *
 * Hook này luôn sẵn sàng ở mọi trang protected:
 * - expose `route` context để agent biết user đang ở đâu,
 * - expose `navigateTo` để điều hướng tới page hợp lệ,
 * - expose `navigateToCvEditor` để agent lưu nháp + nhảy vào /CV.
 * Khi đã ở /CV, useCvAssistant lo điền trực tiếp; tool này chỉ là fallback.
 */

const navigateSchema = z.object({
  tenFile: z
    .string()
    .optional()
    .describe("Tên file CV (vd: CV-Tester-2026). Khi user nói 'Tạo CV với tên là X' thì điền X vào đây."),
  hoTen: z
    .string()
    .optional()
    .describe("Họ tên ứng viên. Nếu user chỉ cho 1 cái tên và chưa có họ tên thì điền cùng giá trị với tenFile."),
  contact: z
    .object(cvContactPatchSchema.shape)
    .strict()
    .optional()
    .describe("Các field liên hệ cụ thể. Không truyền reason hoặc mô tả tổng hợp."),
  sections: z.array(cvSectionCreateSchema)
    .max(5)
    .optional()
    .describe(
      "Các mục CV được hỗ trợ: hocVan, kinhNghiemLamViec, duAn, kyNang, chungChi. " +
      "Phải điền đúng field cấu trúc của từng item; không truyền reason. ngonNgu và hoatDong chưa có section riêng.",
    ),
  templateId: z
    .string()
    .optional()
    .describe("ID mẫu: minimal-ats hoặc tech-modern. Bỏ trống để giữ mặc định."),
});

function buildPageSchema(role: AdamRole) {
  const pages = getAdamPages(role);
  // z.enum requires at least one literal; blocked roles never mount the tool.
  const allowed = (pages.length > 0 ? [...pages] : ["dashboard"]) as [string, ...string[]];
  return z.object({
    page: z
      .enum(allowed)
      .describe("Page key trong danh sách route được phép theo vai trò. Không truyền URL."),
  });
}

const focusSectionsSchema = z.object({
  sections: z
    .array(z.enum([...CV_FOCUS_SECTIONS, "skill"] as [string, ...string[]]))
    .min(1)
    .max(3)
    .describe(
      "Tối đa 3 section cần đưa vào tầm nhìn: contact, experience, education, skills (hoặc skill), projects hoặc certificates. Section quan trọng nhất đặt đầu tiên.",
    ),
});

export function useGlobalCvAssistant({
  enabled = true,
  role = "candidate",
}: {
  enabled?: boolean;
  role?: AdamRole;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/tao-cv") || pathname?.startsWith("/CV") || false;
  const isCandidate = role === "candidate";
  const canNavigate = enabled && (isCandidate || role === "recruiter");
  const pageSchema = useMemo(() => buildPageSchema(role), [role]);

  // Cooldown chống loop: navigateTo/navigateToCvEditor gọi router.push →
  // CV page mount → useCvAssistant apply patch → state change → agent
  // re-trigger với cùng message → loop vô tận (đã thấy 4 run liên tiếp
  // chạm rate limit 429). Ghi timestamp lần navigate cuối, chặn trong 30s.
  const lastNavigateAt = useRef(0);

  // Warm the editor chunk while the user is still chatting. This removes the
  // compile/fetch gap when navigateToCvEditor is called by a frontend tool.
  useEffect(() => {
    if (enabled && isCandidate && !isEditor) void router.prefetch("/CV");
  }, [enabled, isCandidate, isEditor, router]);

  const agentContext = useMemo(() => {
    if (!enabled || role === "blocked") {
      return {
        description: "Tài khoản hiện tại không thuộc phạm vi hỗ trợ của Adam.",
        value: { role, pathname: pathname ?? "", isEditor: false },
      };
    }

    if (isCandidate) {
      return {
        description:
          "Vị trí trang hiện tại của ứng viên. " +
          "Nếu isEditor=false thì KHÔNG có form CV trực tiếp để ghi — " +
          "muốn điền CV phải gọi navigateToCvEditor (tự lưu nháp + nhảy vào /CV). " +
          "Nếu isEditor=true thì điền trực tiếp bằng updateCvContact/updateCvMeta/upsertCvSectionItem.",
        value: { role, pathname: pathname ?? "", isEditor },
      };
    }

    return {
      description:
        "Vị trí trang hiện tại của nhà tuyển dụng. " +
        "Chỉ dùng tool nghiệp vụ tuyển dụng; không có form CV để điền.",
      value: { role, pathname: pathname ?? "", isEditor: false },
    };
  }, [enabled, isCandidate, isEditor, pathname, role]);

  useAgentContext(agentContext);

  useFrontendTool(
    {
      name: "navigateTo",
      description: isCandidate
        ? "Điều hướng user tới đúng page trong ứng dụng. Chỉ dùng khi user yêu cầu mở, đi tới hoặc chuyển sang một chức năng. " +
          "Không dùng cho flow tạo CV có dữ liệu; flow đó phải gọi navigateToCvEditor. Không truyền URL, chỉ truyền page key. " +
          "Mapping quan trọng: saved-jobs = việc làm đã lưu, applied-jobs = việc làm đã ứng tuyển, matching-jobs = việc làm phù hợp, " +
          "cv-editor = soạn CV, cv-templates = mẫu CV, my-profile = hồ sơ cá nhân."
        : "Điều hướng user tới đúng page nghiệp vụ tuyển dụng. Chỉ dùng khi user yêu cầu mở, đi tới hoặc chuyển sang một chức năng. " +
          "Không truyền URL, chỉ truyền page key. Mapping: recruiter-profile = tài khoản, candidates = ứng viên, employees = nhân sự, " +
          "companies = doanh nghiệp, reports = báo cáo, job-messages = tin nhắn.",
      agentId: "default",
      parameters: pageSchema,
      available: canNavigate,
      handler: async ({ page }) => {
        const destination = getNavigableRoute(page as NavigablePage, role);
        if (!destination) return `Page ${page} không được phép với vai trò hiện tại.`;

        if (pathname === destination.href) {
          return `User đang ở page ${destination.label}.`;
        }

        // Cooldown chống loop: nếu vừa navigate trong 30s, bỏ qua — tránh
        // router.push → remount → agent re-trigger cùng message → loop.
        if (Date.now() - lastNavigateAt.current < 30_000) {
          return `Vừa điều hướng gần đây, bỏ qua để tránh loop. User đang ở ${pathname}.`;
        }

        if (destination.href === "/CV" && isEditor) {
          return "User đã đang ở workspace CV, không cần điều hướng.";
        }

        lastNavigateAt.current = Date.now();
        await router.prefetch(destination.href);
        toast.success(`Đang mở ${destination.label}.`);
        window.setTimeout(() => router.push(destination.href), 0);
        return `Đã xác nhận điều hướng tới ${destination.label}.`;
      },
    },
    [canNavigate, pathname, role, router],
  );

  useFrontendTool(
    {
      name: "focusSections",
      description:
        "Đưa tối đa 3 section CV vào tầm nhìn của user để Adam chỉ đúng các phần đang thiếu hoặc yếu. " +
        "Tool sẽ scroll tới section đầu tiên và highlight đồng thời các section trong khoảng 2-3 giây rồi fade dần. " +
        "BẮT BUỘC gọi sau khi phân tích CV nếu vừa chỉ ra điểm yếu, thiếu sót hoặc đề xuất bổ sung " +
        "cho một hoặc nhiều section, kể cả khi chưa sửa dữ liệu. Nếu nói về nhiều mục, truyền chúng trong một lần gọi. " +
        "Không chỉ mô tả bằng text rồi bỏ qua focus; tool này không thay cho câu trả lời nhận xét.",
      agentId: "default",
      parameters: focusSectionsSchema,
      available: enabled && isCandidate && isEditor,
      handler: async ({ sections }) => {
        const normalizedSections = [...new Set(sections.map((section) => section === "skill" ? "skills" : section))] as CvFocusSection[];
        const labels = normalizedSections.map((section) => getCvFocusSectionLabel(section));
        if (!isEditor) return `Chưa thể focus ${labels.join(", ")} vì user chưa mở trình soạn CV.`;
        requestCvSectionsFocus(normalizedSections);
        return `Đã đưa ${labels.join(", ")} vào tầm nhìn và highlight để user kiểm tra.`;
      },
    },
    [enabled, isCandidate, isEditor],
  );

  useFrontendTool(
    {
      name: "navigateToCvEditor",
      description:
        "Lưu nháp CV rồi mở workspace /CV. " +
        "BẮT BUỘC gọi khi user nói 'tạo CV / CV mới / tạo CV với tên là X' mà isEditor=false. " +
        "Sau khi gọi, báo user đang mở trình soạn và liệt kê đã lưu gì.",
      agentId: "default",
      parameters: navigateSchema,
      available: enabled && isCandidate && !isEditor,
      handler: async ({ tenFile, hoTen, contact, sections, templateId }) => {
        // Cooldown chống loop: nếu vừa navigate trong 30s, chỉ lưu patch
        // không navigate lại — tránh router.push → remount → re-trigger.
        const cooldownActive = Date.now() - lastNavigateAt.current < 30_000;

        const cleanContact: Record<string, string> = {};
        const merged: Record<string, string> = { ...(contact ?? {}) };
        if (typeof hoTen === "string" && hoTen.trim()) {
          merged.hoTen = hoTen.trim();
        }
        for (const [k, v] of Object.entries(merged)) {
          if (!isCvContactField(k)) continue;
          if (typeof v !== "string" || !v.trim()) continue;
          cleanContact[k] = v.trim();
        }

        const cleanSections: PendingSectionPatch[] = [];
        if (Array.isArray(sections)) {
          for (const s of sections.slice(0, 5)) {
            if (!s || typeof s !== "object") continue;
            const section = (s as { section?: unknown }).section;
            const items = (s as { items?: unknown }).items;
            if (!isCvSectionKey(section) || !Array.isArray(items)) continue;
            const cleanItems = items
              .slice(0, 20)
              .filter((it) => it && typeof it === "object" && !Array.isArray(it))
              .map((it) => {
                const out: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(it as Record<string, unknown>)) {
                  if (typeof v === "string" && v.trim()) out[k] = v.trim();
                  else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
                  else if (Array.isArray(v)) {
                    const values = v.map((value) => String(value).trim()).filter(Boolean);
                    if (values.length > 0) out[k] = values;
                  }
                }
                return out;
              })
              .filter((it) => Object.keys(it).length > 0);
            if (cleanItems.length > 0) cleanSections.push({ section, items: cleanItems });
          }
        }

        const cleanTenFile = typeof tenFile === "string" ? tenFile.trim() : "";
        // Enduser lười: "tên là Tester" thường vừa là tên file vừa là họ tên.
        if (cleanTenFile && !cleanContact.hoTen) {
          cleanContact.hoTen = cleanTenFile;
        }
        const cleanTemplate = typeof templateId === "string" ? templateId.trim() : "";
        if (cleanTemplate) await ensureActiveTemplate(cleanTemplate);

        const previous = cleanTemplate && !cleanTenFile && Object.keys(cleanContact).length === 0 && cleanSections.length === 0 ? loadPendingCvPatch() : null;
        savePendingCvPatch({
          ...(previous?.contact ? { contact: previous.contact } : {}),
          ...(previous?.sections ? { sections: previous.sections } : {}),
          ...(previous?.tenFile ? { tenFile: previous.tenFile } : {}),
          ...(Object.keys(cleanContact).length > 0 ? { contact: cleanContact } : {}),
          ...(cleanSections.length > 0 ? { sections: cleanSections } : {}),
          ...(cleanTemplate ? { templateId: cleanTemplate } : {}),
          ...(cleanTenFile ? { tenFile: cleanTenFile } : {}),
        });

        const savedBits: string[] = [];
        if (cleanTenFile) savedBits.push(`tên file "${cleanTenFile}"`);
        if (cleanContact.hoTen && cleanContact.hoTen !== cleanTenFile)
          savedBits.push(`họ tên "${cleanContact.hoTen}"`);
        else if (cleanContact.hoTen && !cleanTenFile) savedBits.push(`họ tên "${cleanContact.hoTen}"`);
        if (cleanSections.length > 0) savedBits.push(`${cleanSections.length} nhóm mục`);

        if (!isEditor && !cooldownActive) {
          lastNavigateAt.current = Date.now();
          toast.success(
            savedBits.length > 0
              ? `Đã lưu ${savedBits.join(", ")} — đang mở trình soạn CV.`
              : "Đang mở trình soạn CV.",
          );
          // Let the tool result finish before unmounting CopilotChat; otherwise
          // navigation can interrupt the final AG-UI tool response.
          window.setTimeout(() => router.push("/CV"), 0);
        } else if (!isEditor && cooldownActive) {
          // Đang cooldown: chỉ lưu patch, không navigate — tránh loop.
          toast.success(
            savedBits.length > 0
              ? `Đã lưu ${savedBits.join(", ")} (bỏ qua điều hướng vì vừa mở trang).`
              : "Đã lưu nháp (bỏ qua điều hướng vì vừa mở trang).",
          );
        } else {
          // Đã ở editor: pending-patch sẽ được useCvAssistant đổ vào form ngay.
          toast.success(
            savedBits.length > 0
              ? `Đã đưa ${savedBits.join(", ")} vào form.`
              : "Đã cập nhật form CV.",
          );
        }
        return isEditor
          ? "Đã lưu nháp. Workspace /CV đang mở sẽ tự đổ patch vào."
          : cooldownActive
            ? "Đã lưu nháp. Bỏ qua điều hướng vì vừa mở trang gần đây — tránh loop."
            : "Đã lưu nháp và điều hướng tới /CV. Workspace sẽ tự đổ patch khi load xong.";
      },
    },
    [enabled, isCandidate, isEditor, pathname],
  );
}
