export const CV_FOCUS_SECTIONS = [
  "contact",
  "experience",
  "education",
  "skills",
  "projects",
  "certificates",
] as const;

export type CvFocusSection = (typeof CV_FOCUS_SECTIONS)[number];

const CV_FOCUS_EVENT = "hireai:cv-focus-section";

const SECTION_LABELS: Record<CvFocusSection, string> = {
  contact: "Thông tin liên hệ",
  experience: "Kinh nghiệm làm việc",
  education: "Học vấn",
  skills: "Kỹ năng",
  projects: "Dự án",
  certificates: "Chứng chỉ",
};

const SECTION_SEARCH_TEXT: Record<CvFocusSection, string[]> = {
  contact: ["Thông tin liên hệ", "Liên hệ", "Contact", "Profile"],
  experience: ["Kinh nghiệm làm việc", "Kinh nghiệm", "Experience"],
  education: ["Học vấn", "Đào tạo", "Education"],
  skills: ["Kỹ năng", "Kỹ năng chuyên môn", "Kỹ năng chính", "Skills"],
  projects: ["Dự án", "Dự án tiêu biểu", "Projects"],
  certificates: ["Chứng chỉ", "Chứng chỉ & ấn phẩm", "Certificates"],
};

let activeFocusTargets: HTMLElement[] = [];
let focusTimer: number | undefined;

export function getCvFocusSectionLabel(section: CvFocusSection) {
  return SECTION_LABELS[section];
}

export function requestCvSectionsFocus(sections: CvFocusSection[]) {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent(CV_FOCUS_EVENT, { detail: { sections } }));
  return true;
}

export function getCvFocusEventName() {
  return CV_FOCUS_EVENT;
}

export function focusCvSectionsInDom(sections: CvFocusSection[]) {
  const uniqueSections = [...new Set(sections)];
  const previewRoots = Array.from(document.querySelectorAll<HTMLElement>("[data-cv-document]"))
    .filter((element) => !element.classList.contains("cv-measure"));
  const targets = uniqueSections.flatMap((section) => {
    const explicitTarget = previewRoots
      .flatMap((root) => Array.from(root.querySelectorAll<HTMLElement>(`[data-cv-section="${section}"]`)))
      .find((element) => !element.closest(".cv-measure"));
    if (explicitTarget) return [explicitTarget];

    const formTarget = document.getElementById(`cv-section-${section}`);
    if (formTarget) return [formTarget];

    const headingTarget = previewRoots
      .flatMap((root) => Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,div,span")))
      .find((element) => SECTION_SEARCH_TEXT[section].includes(element.textContent?.trim() ?? ""));
    return headingTarget ? [headingTarget] : [];
  });
  const firstTarget = targets[0];

  if (!firstTarget) return false;
  activeFocusTargets.forEach((target) => target.classList.remove("cv-ai-focused"));
  if (focusTimer) window.clearTimeout(focusTimer);
  activeFocusTargets = targets;
  targets.forEach((target) => {
    target.classList.remove("cv-ai-focused");
    void target.offsetWidth;
    target.classList.add("cv-ai-focused");
  });
  firstTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  focusTimer = window.setTimeout(() => {
    activeFocusTargets.forEach((target) => target.classList.remove("cv-ai-focused"));
    activeFocusTargets = [];
  }, 3000);
  return true;
}
