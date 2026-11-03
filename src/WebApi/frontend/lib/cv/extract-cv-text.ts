// trích xuất nội dung file

import { flattenDocxHtml } from "./docx-table-text";

export async function extractCvText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return extractPdfText(file);
    case "docx":
      return extractDocxText(file);
    default:
      throw new Error("Chỉ hỗ trợ file PDF hoặc DOCX.");
  }
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n").trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  // convertToHtml giữ được <table>/<tr>/<td>; extractRawText thì rải ô bảng
  // thành dòng rời nên CV dạng bảng mất quan hệ nhãn - giá trị trước khi vào parser.
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  return flattenDocxHtml(result.value).trim();
}
