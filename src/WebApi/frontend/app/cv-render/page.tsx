// Route render CV thành HTML cho mobile (WebView preview + expo-print PDF).
// Server component để HTML trả về đã chứa đầy đủ markup CV (mobile fetch trực tiếp được).
// Nhận: ?d=<encodeURIComponent(JSON CvFormData)> & ?t=<templateId override>
import { CvDocument } from "@/components/cv/cv-document";
import {
  CV_RENDER_COOKIE,
  decodeCvData,
  decodeCvRenderCookie,
} from "@/features/tao-cv/cv-render-payload";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CvRenderPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const cookieData = decodeCvRenderCookie((await cookies()).get(CV_RENDER_COOKIE)?.value);
  const data = cookieData ?? decodeCvData(firstValue(sp.d), firstValue(sp.t));

  return (
    <>
      <span hidden data-cv-render-start="" />
      <div className="cv-render-page flex min-h-screen justify-center overflow-x-auto bg-[#efece6] py-4">
        <div className="cv-paper" data-cv-print-root>
          <CvDocument data={data} />
        </div>
      </div>
      <span hidden data-cv-render-end="" />
    </>
  );
}
