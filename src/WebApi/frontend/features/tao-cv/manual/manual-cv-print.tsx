import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { CvDocument } from "@/components/cv/cv-document";
import type { CvFormData } from "@/lib/types";
import { manualCvPdfFileName } from "./manual-cv-pdf";

/** Print a snapshot of the working copy, independently of saved files and UI tabs. */
export async function printManualCv(data: CvFormData): Promise<void> {
  const snapshot = structuredClone(data);
  const frame = document.createElement("iframe");
  frame.title = "Xuất CV thành PDF";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;pointer-events:none";
  document.body.appendChild(frame);

  let root: Root | undefined;
  let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    if (cleanupTimer) clearTimeout(cleanupTimer);
    root?.unmount();
    root = undefined;
    frame.remove();
  };

  try {
    const printWindow = frame.contentWindow;
    const printDocument = frame.contentDocument;
    if (!printWindow || !printDocument) throw new Error("Không thể mở khung in CV.");
    printDocument.title = manualCvPdfFileName(snapshot.tenFile, snapshot.thongTinLienHe.hoTen).replace(/\.pdf$/i, "");
    printDocument.documentElement.lang = "vi";
    printDocument.documentElement.className = document.documentElement.className.replace(/\bdark\b/g, "");
    printDocument.body.className = document.body.className;

    const stylesReady = Array.from(document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>("style, link[rel='stylesheet']"))
      .map((source) => {
        const copy = source.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;
        if (source instanceof HTMLLinkElement && copy instanceof HTMLLinkElement) {
          copy.href = source.href;
          const loaded = new Promise<void>((resolve, reject) => {
            copy.onload = () => resolve();
            copy.onerror = () => reject(new Error("Không thể tải định dạng CV để xuất PDF. Vui lòng thử lại."));
          });
          printDocument.head.appendChild(copy);
          return loaded;
        }
        printDocument.head.appendChild(copy);
        return Promise.resolve();
      });

    // App print selectors keep this root only. Render a natural-flow document,
    // rather than a deferred/off-screen preview with cloned, hidden pages.
    const host = printDocument.createElement("div");
    host.setAttribute("data-cv-print-root", "");
    printDocument.body.appendChild(host);
    const overrides = printDocument.createElement("style");
    overrides.textContent = `
      html, body { margin: 0 !important; background: white !important; color: #111; }
      [data-cv-print-root] { visibility: visible !important; }
      [data-cv-print-root], [data-cv-print-root] * { animation: none !important; transition: none !important; }
      @media print {
        html, body { height: auto !important; overflow: visible !important; }
        .cv-document-shell, .cv-paper, .cv-paper-a4 {
          height: auto !important; min-height: 0 !important; max-height: none !important;
          overflow: visible !important;
        }
      }
    `;
    printDocument.head.appendChild(overrides);

    let renderError: unknown;
    root = createRoot(host, { onUncaughtError: (error) => { renderError = error; } });
    flushSync(() => root!.render(<CvDocument data={snapshot} />));

    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          await Promise.all(stylesReady);
          await printDocument.fonts.ready;
          await Promise.all(Array.from(host.querySelectorAll("img")).map((image) => image.decode().catch(() => undefined)));
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        })(),
        new Promise<never>((_, reject) => {
          readyTimer = setTimeout(() => reject(new Error("Chuẩn bị PDF quá lâu. Vui lòng thử lại.")), 20_000);
        }),
      ]);
    } finally {
      if (readyTimer) clearTimeout(readyTimer);
    }

    if (renderError) throw renderError;
    const paper = host.querySelector<HTMLElement>(".cv-paper");
    if (!paper || !paper.textContent?.trim() || paper.getBoundingClientRect().width === 0) {
      throw new Error("Nội dung CV chưa sẵn sàng để xuất PDF. Vui lòng thử lại.");
    }

    // Keep the iframe alive until the browser has finished reading the document.
    printWindow.addEventListener("afterprint", () => { setTimeout(cleanup, 0); }, { once: true });
    cleanupTimer = setTimeout(cleanup, 120_000);
    printWindow.focus();
    printWindow.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}
