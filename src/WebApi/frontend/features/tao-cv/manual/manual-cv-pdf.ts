const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export function manualCvPdfFileName(value: string, fullName: string): string {
  const base = value.trim() || `CV-${fullName.trim() || new Date().toISOString().slice(0, 10)}`;
  const safeName = base
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 100);
  return `${safeName || "CV"}.pdf`;
}

export async function createManualCvPdfBlob(element: HTMLElement): Promise<Blob> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const width = element.scrollWidth;
  const height = element.scrollHeight;
  const pixelRatio = Math.max(0.5, Math.min(2, 30_000 / height, Math.sqrt(64_000_000 / (width * height))));
  const canvas = await toCanvas(element, {
    backgroundColor: "#ffffff",
    cacheBust: true,
    pixelRatio,
    width,
    height,
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageHeightPx = Math.floor((canvas.width * A4_HEIGHT_MM) / A4_WIDTH_MM);

  for (let offset = 0, page = 0; offset < canvas.height; offset += pageHeightPx, page += 1) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offset);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const context = pageCanvas.getContext("2d");
    if (!context) throw new Error("Trình duyệt không hỗ trợ tạo PDF từ CV.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    if (page > 0) pdf.addPage();
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.96),
      "JPEG",
      0,
      0,
      A4_WIDTH_MM,
      (sliceHeight * A4_WIDTH_MM) / canvas.width,
    );
  }
  return pdf.output("blob");
}

export async function exportManualCvPdf(element: HTMLElement, fileName: string): Promise<void> {
  const blob = await createManualCvPdfBlob(element);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
