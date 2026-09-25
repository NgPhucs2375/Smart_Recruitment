"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { toast } from "sonner";
import {
  isCvContactField,
  isCvSectionKey,
  savePendingCvPatch,
  type PendingSectionPatch,
} from "@/features/ai-cv/cv-assistant-state";
import { getNavigableRoute, type NavigablePage } from "@/components/navigation/navigation-routes";
import {
  CV_FOCUS_SECTIONS,
  getCvFocusSectionLabel,
  requestCvSectionFocus,
  type CvFocusSection,
} from "@/features/ai-cv/cv-focus";

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
    .record(z.string(), z.string())
    .optional()
    .describe("Các field liên hệ khác (email, sdt, diaChi, viTriUngTuyen...). Chỉ điền thứ user nói rõ."),
  sections: z
    .array(
      z.object({
        section: z.string(),
        items: z.array(z.record(z.string(), z.unknown())),
      }),
    )
    .optional()
    .describe("Các mục list (hocVan, kinhNghiemLamViec, duAn, kyNang, chungChi), mỗi mục là mảng item."),
  templateId: z
    .string()
    .optional()
    .describe("ID mẫu: minimal-ats hoặc tech-modern. Bỏ trống để giữ mặc định."),
});

const pageSchema = z.object({
  page: z.enum([
    "dashboard",
    "jobs",
    "saved-jobs",
    "applied-jobs",
    "matching-jobs",
    "job-messages",
    "my-profile",
    "cv-editor",
    "cv-import",
    "cv-templates",
    "candidates",
    "employees",
    "recruiter-profile",
    "companies",
    "reports",
    "settings",
    "admin-users",
    "admin-companies",
    "admin-jobs",
    "admin-rules",
    "admin-categories",
    "admin-banners",
    "admin-permissions",
  ]).describe("Page key trong danh sách route được phép. Không truyền URL.")
});

const focusSectionSchema = z.object({
  section: z.enum([...CV_FOCUS_SECTIONS, "skill"] as [string, ...string[]]).describe(
    "Section cần đưa vào tầm nhìn: contact, experience, education, skills (hoặc skill), projects hoặc certificates.",
  ),
});

export function useGlobalCvAssistant({ enabled = true }: { enabled?: boolean } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/tao-cv") || pathname?.startsWith("/CV") || false;

  // Warm the editor chunk while the user is still chatting. This removes the
  // compile/fetch gap when navigateToCvEditor is called by a frontend tool.
  useEffect(() => {
    if (enabled && !isEditor) void router.prefetch("/CV");
  }, [enabled, isEditor, router]);

  useAgentContext({
    description:
      "Vị trí trang hiện tại của user. " +
      "Nếu isEditor=false thì KHÔNG có form CV trực tiếp để ghi — " +
      "muốn điền CV phải gọi navigateToCvEditor (tự lưu nháp + nhảy vào /CV). " +
      "Nếu isEditor=true thì điền trực tiếp bằng updateCvContact/updateCvMeta/upsertCvSectionItem.",
    value: JSON.parse(JSON.stringify({ pathname: pathname ?? "", isEditor })) as {
      pathname: string;
      isEditor: boolean;
    },
  });

  useFrontendTool(
    {
      name: "navigateTo",
      description:
        "Điều hướng user tới đúng page trong ứng dụng. Chỉ dùng khi user yêu cầu mở, đi tới hoặc chuyển sang một chức năng. " +
        "Không dùng cho flow tạo CV có dữ liệu; flow đó phải gọi navigateToCvEditor. Không truyền URL, chỉ truyền page key. " +
        "Mapping quan trọng: saved-jobs = việc làm đã lưu, applied-jobs = việc làm đã ứng tuyển, matching-jobs = việc làm phù hợp, " +
        "cv-editor = soạn CV, cv-templates = mẫu CV, my-profile = hồ sơ cá nhân.",
      agentId: "default",
      parameters: pageSchema,
      available: enabled,
      handler: async ({ page }) => {
        const destination = getNavigableRoute(page as NavigablePage);
        if (!destination) return `Không tìm thấy page hợp lệ cho ${page}.`;

        if (pathname === destination.href) {
          return `User đang ở page ${destination.label}.`;
        }

        await router.prefetch(destination.href);
        toast.success(`Đang mở ${destination.label}.`);
        window.setTimeout(() => router.push(destination.href), 0);
        return `Đã xác nhận điều hướng tới ${destination.label}.`;
      },
    },
    [enabled, pathname, router],
  );

  useFrontendTool(
    {
      name: "focusSection",
      description:
        "Đưa một section CV vào tầm nhìn của user để Adam chỉ đúng phần đang thiếu hoặc yếu. " +
        "Tool sẽ tự scroll tới section, highlight rõ trong khoảng 2-3 giây rồi fade dần. " +
        "Dùng sau khi phân tích CV và chỉ gọi với section cụ thể, không dùng thay cho câu trả lời nhận xét.",
      agentId: "default",
      parameters: focusSectionSchema,
      available: enabled,
      handler: async ({ section }) => {
        const normalizedSection = section === "skill" ? "skills" : section;
        const label = getCvFocusSectionLabel(normalizedSection as CvFocusSection);
        if (!isEditor) return `Chưa thể focus ${label} vì user chưa mở trình soạn CV.`;
        requestCvSectionFocus(normalizedSection as CvFocusSection);
        return `Đã đưa phần ${label} vào tầm nhìn và highlight để user kiểm tra.`;
      },
    },
    [enabled, isEditor],
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
      available: enabled,
      handler: async ({ tenFile, hoTen, contact, sections, templateId }) => {
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
                const out: Record<string, string> = {};
                for (const [k, v] of Object.entries(it as Record<string, unknown>)) {
                  if (typeof v === "string" && v.trim()) out[k] = v.trim();
                  else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
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

        savePendingCvPatch({
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

        if (!isEditor) {
          toast.success(
            savedBits.length > 0
              ? `Đã lưu ${savedBits.join(", ")} — đang mở trình soạn CV.`
              : "Đang mở trình soạn CV.",
          );
          // Let the tool result finish before unmounting CopilotChat; otherwise
          // navigation can interrupt the final AG-UI tool response.
          window.setTimeout(() => router.push("/CV"), 0);
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
          : "Đã lưu nháp và điều hướng tới /CV. Workspace sẽ tự đổ patch khi load xong.";
      },
    },
    [enabled, isEditor, pathname],
  );
}
