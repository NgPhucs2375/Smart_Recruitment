// Route render CV thành HTML cho mobile (WebView preview + expo-print PDF).
// Server component để HTML trả về đã chứa đầy đủ markup CV (mobile fetch trực tiếp được).
// Nhận: ?d=<encodeURIComponent(JSON CvFormData)> & ?t=<templateId override>
import { CvDocument } from "@/components/cv/cv-document";
import { defaultCvData } from "@/features/tao-cv/constants";
import { resolveTemplateId } from "@/features/tao-cv/template-registry";
import type { CvFormData } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function decodeCvData(raw: string | undefined, templateId: string | undefined): CvFormData {
  const base: CvFormData = { ...defaultCvData };
  if (templateId) base.templateId = resolveTemplateId(templateId);
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<CvFormData>;
    const merged: CvFormData = { ...defaultCvData, ...parsed };
    if (templateId) merged.templateId = resolveTemplateId(templateId);
    else if (parsed.templateId) merged.templateId = resolveTemplateId(parsed.templateId);
    return merged;
  } catch {
    return base;
  }
}

export default async function CvRenderPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const data = decodeCvData(firstValue(sp.d), firstValue(sp.t));

  return (
    <div className="cv-render-page flex min-h-screen justify-center overflow-x-auto bg-[#efece6] py-4">
      <div className="cv-paper" data-cv-print-root>
        <CvDocument data={data} />
      </div>
    </div>
  );
}
