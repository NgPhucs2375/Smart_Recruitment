"use client";

// Frontend luôn gọi Runtime nội bộ; Runtime sẽ adapter request sang AG-UI .NET.
import {
  CopilotKit,
  CopilotPopup,
  useDefaultRenderTool,
  useAgent,
  useConfigureSuggestions,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAuthToken, getValidToken } from "@/lib/auth-provider";
import { useGlobalCvAssistant } from "@/hooks/use-global-cv-assistant";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { adamMessageView } from "@/components/ai/adam-markdown";
import {
  getCvFocusSectionLabel,
  requestCvSectionFocus,
  type CvFocusSection,
} from "@/features/ai-cv/cv-focus";

const CHAT_SUGGESTIONS = [
  { title: "Tạo CV từ đầu", message: "Hãy giúp tôi tạo một CV mới. Hỏi tôi các thông tin còn thiếu theo từng bước." },
  { title: "Cải thiện nội dung", message: "Hãy xem nội dung CV hiện tại và đề xuất cách viết chuyên nghiệp hơn mà không bịa thông tin." },
  { title: "Tối ưu theo JD", message: "Tôi muốn tối ưu CV theo một công việc mục tiêu. Hãy yêu cầu tôi cung cấp JD rồi điều chỉnh CV phù hợp." },
  { title: "Kiểm tra ATS", message: "Hãy kiểm tra CV hiện tại và đề xuất các cải thiện giúp CV thân thiện với ATS." },
];

const CV_TOOL_SECTIONS: Record<string, CvFocusSection> = {
  updateCvContact: "contact",
  updateCvContactBulk: "contact",
};

const CV_SECTION_FROM_PARAMETER: Record<string, CvFocusSection> = {
  hocVan: "education",
  kinhNghiemLamViec: "experience",
  duAn: "projects",
  kyNang: "skills",
  chungChi: "certificates",
};

function cvToolSection(name: string, parameters: unknown): CvFocusSection | undefined {
  if (CV_TOOL_SECTIONS[name]) return CV_TOOL_SECTIONS[name];
  if (name !== "upsertCvSectionItem" || !parameters || typeof parameters !== "object") return undefined;
  const section = (parameters as { section?: unknown }).section;
  return typeof section === "string" ? CV_SECTION_FROM_PARAMETER[section] : undefined;
}

type RecruitmentJobState = {
  tinTuyenDungId: number;
  tieuDe: string;
  trangThai: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
};

type SharedAgentState = {
  recruitmentJobs?: RecruitmentJobState[];
  selectedJobId?: number;
  lastAction?: string;
};

type JobRecommendation = {
  tinTuyenDungId: number;
  tieuDe: string;
  tenDoanhNghiep: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  diemPhuHop: number;
};

function formatSalary(min: number, max: number) {
  if (!min && !max) return "Thỏa thuận";
  const formatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
  if (!min) return `Tối đa ${formatter.format(max)}đ`;
  if (!max) return `Từ ${formatter.format(min)}đ`;
  return `${formatter.format(min)}đ - ${formatter.format(max)}đ`;
}

function parseJobRecommendations(result: string | undefined): JobRecommendation[] {
  if (!result) return [];
  try {
    const parsed = JSON.parse(result) as { data?: unknown; Data?: unknown };
    const data = parsed.data ?? parsed.Data;
    if (!Array.isArray(data)) return [];

    const seenIds = new Set<number>();
    return data.flatMap((value): JobRecommendation[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      const tinTuyenDungId = Number(item.tinTuyenDungId ?? item.TinTuyenDungId);
      if (!Number.isInteger(tinTuyenDungId) || tinTuyenDungId <= 0 || seenIds.has(tinTuyenDungId)) return [];

      seenIds.add(tinTuyenDungId);
      return [{
        tinTuyenDungId,
        tieuDe: String(item.tieuDe ?? item.TieuDe ?? "Tin tuyển dụng"),
        tenDoanhNghiep: String(item.tenDoanhNghiep ?? item.TenDoanhNghiep ?? "Doanh nghiệp chưa cập nhật"),
        diaDiemLamViec: String(item.diaDiemLamViec ?? item.DiaDiemLamViec ?? ""),
        luongToiThieu: Number(item.luongToiThieu ?? item.LuongToiThieu ?? 0) || 0,
        luongToiDa: Number(item.luongToiDa ?? item.LuongToiDa ?? 0) || 0,
        diemPhuHop: Number(item.diemPhuHop ?? item.DiemPhuHop ?? 0) || 0,
      }];
    });
  } catch {
    return [];
  }
}

function normalizeRecruitmentJobs(jobs: RecruitmentJobState[]) {
  const seenIds = new Set<number>();
  return jobs.filter((job) => {
    const id = Number(job.tinTuyenDungId);
    if (!Number.isInteger(id) || id <= 0 || seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
}

function GlobalCvAssistantMount() {
  useGlobalCvAssistant({ enabled: true });
  useConfigureSuggestions({
    suggestions: CHAT_SUGGESTIONS,
    available: "before-first-message",
    consumerAgentId: "default",
  });
  return null;
}

function ToolActivityMount() {
  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => {
      const labels: Record<string, string> = {
        getCvFormSnapshot: "Đang đọc nội dung CV",
        updateCvContact: "Đang cập nhật thông tin liên hệ",
        updateCvContactBulk: "Đang cập nhật thông tin liên hệ",
        upsertCvSectionItem: "Đang cập nhật nội dung CV",
        updateCvMeta: "Đang cập nhật thông tin CV",
        setCvTemplate: "Đang đổi mẫu CV",
        analyze_cv: "Đang phân tích CV",
        review_default_cv: "Đang phân tích CV",
        get_job_recommendations: "Đang tìm việc phù hợp với CV",
        suggest_jobs_for_my_cv: "Đang tìm việc phù hợp với CV",
        search_jobs: "Đang tìm kiếm tin tuyển dụng",
        get_my_recruitment_jobs: "Đang tải danh sách tin tuyển dụng",
        get_candidate_recommendations_for_job: "Đang tìm ứng viên phù hợp",
        get_job_details: "Đang tải chi tiết tin tuyển dụng",
      };
      const label = labels[name] ?? "Adam đang xử lý yêu cầu";
      const complete = status === "complete";
      const jobs = complete ? parseJobRecommendations(result) : [];
      const section = cvToolSection(name, parameters);
      const sectionLabel = section ? getCvFocusSectionLabel(section) : undefined;
      const activityLabel = !complete && sectionLabel ? `Đang cập nhật ${sectionLabel}` : label;

      if (jobs.length > 0) {
        return (
          <section className="adam-recommendations" aria-label="Việc làm phù hợp">
            <div className="adam-recommendations__header">
              <div>
                <p className="adam-recommendations__eyebrow">Kết quả phù hợp</p>
                <h3>{jobs.length} việc làm cho bạn</h3>
              </div>
              <span>{label.replace("Đang ", "")}</span>
            </div>
            <ol className="adam-recommendations__list">
              {jobs.map((job, index) => (
                <li key={job.tinTuyenDungId} className="adam-recommendation-card">
                  <span className="adam-recommendation-card__rank">{index + 1}</span>
                  <div className="adam-recommendation-card__body">
                    <strong>{job.tieuDe}</strong>
                    <span>{job.tenDoanhNghiep}</span>
                    <small>{job.diaDiemLamViec || "Chưa có địa điểm"} · {formatSalary(job.luongToiThieu, job.luongToiDa)}</small>
                  </div>
                  <span className="adam-recommendation-card__score">{Math.round(job.diemPhuHop * 100)}%</span>
                </li>
              ))}
            </ol>
          </section>
        );
      }

      return (
        <div className={`adam-tool-activity${section ? " adam-tool-activity--change" : ""}`} role="status" aria-live="polite">
          <span className={`adam-tool-activity__icon${complete ? " is-complete" : ""}`} aria-hidden="true" />
          <span className="adam-tool-activity__label">
            {complete && sectionLabel ? <>Đã cập nhật <strong>{sectionLabel}</strong></> : complete ? `${label} xong` : activityLabel}
          </span>
          {complete && section && (
            <button type="button" className="adam-tool-activity__action" onClick={() => requestCvSectionFocus(section)}>
              Xem thay đổi
            </button>
          )}
          <span className="adam-tool-activity__status">{complete ? "Đã xong" : "Đang xử lý"}</span>
        </div>
      );
    },
  });
  return null;
}

function SharedStateMount() {
  const { agent, isReady } = useAgent({ agentId: "default" });
  const state = (agent.state ?? {}) as SharedAgentState;
  const jobs = normalizeRecruitmentJobs(state.recruitmentJobs ?? []);

  useEffect(() => {
    if (!isReady) return;
    console.debug("[CopilotKit shared state] updated", agent.state);
  }, [agent, agent.state, isReady]);

  if (!isReady || jobs.length === 0) return null;

  const selectJob = (jobId: number) => {
    agent.setState({
      ...agent.state,
      selectedJobId: jobId,
    });
  };

  return (
    <aside className="fixed bottom-24 right-4 z-40 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-border bg-card/95 shadow-xl backdrop-blur">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Tin tuyển dụng</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Chọn một tin để Adam dùng ở lượt tiếp theo.
        </p>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto p-3">
        {jobs.map((job) => {
          const selected = state.selectedJobId === job.tinTuyenDungId;
          return (
            <button
              key={job.tinTuyenDungId}
              type="button"
              onClick={() => selectJob(job.tinTuyenDungId)}
              className={`block w-full rounded-xl border px-3 py-2 text-left transition ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <span className="block truncate text-sm font-medium text-foreground">
                {job.tieuDe}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {job.trangThai} · {job.diaDiemLamViec || "Chưa có địa điểm"}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function InitialPopupState() {
  const configuration = useCopilotChatConfiguration();
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current || !configuration) return;
    initialized.current = true;
    configuration.setModalOpen(false);
  }, [configuration]);

  return null;
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  // Key chuẩn của app là "access_token" (auth-provider.ts TOKEN_KEY) —
  // đọc sai key trước đây khiến header Authorization luôn rỗng.
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const pathname = usePathname();
  const identity = useStoredIdentity();
  const adamRoles = identity?.roles?.join(",") ?? "";

  // The access token can expire while the protected layout remains mounted.
  // Refresh before the first chat request so CopilotKit does not keep sending
  // the token captured during the initial render.
  useEffect(() => {
    let active = true;
    void getValidToken().then((validToken) => {
      if (active) setToken(validToken);
    });
    return () => {
      active = false;
    };
  }, []);

  // BE-first: LLM + tool backend (hồ sơ, CV) chạy ở .NET smart-agent.
  // FE chỉ expose action client-side (useCopilotAction ghi nháp vào form) để BE gọi ngược qua AG-UI.
  // Đi qua Next proxy cùng origin để giữ SSE streaming, sanitize event hỏng
  // và không phụ thuộc browser -> BE direct (hết CORS/localhost staging).
  const runtimeUrl = "/api/copilotkit";
  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      useSingleEndpoint={false}
      headers={{
        Authorization: token ? `Bearer ${token}` : "",
        "X-Adam-Route": pathname ?? "",
        "X-Adam-Roles": adamRoles,
      }}
      onError={(event) => {
        console.error(`[CopilotKit ${event.type}]`, event.error, event.context);
      }}
    >
      {children}
      <InitialPopupState />
      <GlobalCvAssistantMount />
      <ToolActivityMount /> 
      <SharedStateMount />
      <CopilotPopup
        defaultOpen={false}
        width="min(92vw, 650px)"
        height="min(88vh, 1100px)"
        messageView={adamMessageView}
        clickOutsideToClose
        toggleButton={{
          className: "adam-chat-toggle",
        }}
        header={{
          className: "adam-chat-header",
        }}
        labels={{
          modalHeaderTitle: "Adam - Trợ lý thông minh",
          chatToggleOpenLabel: "Trò chuyện với Adam",
          chatToggleCloseLabel: "Tạm biệt Adam",
          welcomeMessageText: "Xin chào, tôi là Adam. Tôi có thể giúp gì cho bạn?",
          chatInputPlaceholder: "Nhắn cho Adam...",
        }}
      />
    </CopilotKit>
  );
}
