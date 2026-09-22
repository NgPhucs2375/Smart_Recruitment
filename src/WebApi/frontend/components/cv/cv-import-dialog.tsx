"use client";

// hộp thoại nhập file use components CvUpLoad
import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CvUpload } from "./cv-upload";
import { CvImportError, parseCvFile } from "@/features/tao-cv/cv-import";
import type { CvFormData } from "@/lib/types";
import { cvApi } from "@/lib/api/cv-api";

interface CvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hoSoUngVienId: number | null;
  onImported: (data: Partial<CvFormData>, importSessionId: string) => void;
  onManualImported?: (importSessionId: string, fileName: string) => void;
}

function isAiOverloadMessage(message: string): boolean {
  return /quá tải|thử lại|gemini|503|serviceunavailable|quá thời gian|không phản hồi kịp|overload|timeout/i.test(message);
}

export function CvImportDialog({ open, onOpenChange, hoSoUngVienId, onImported, onManualImported }: CvImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [stage, setStage] = React.useState<"uploading" | "parsing" | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [savedSessionId, setSavedSessionId] = React.useState<string | null>(null);
  const [aiFailed, setAiFailed] = React.useState(false);
  // Dialog đóng giữa chừng thì kết quả về sau bị bỏ (tránh đổ dữ liệu muộn vào form).
  const cancelledRef = React.useRef(false);

  // Prewarm engine đọc PDF/DOCX ngay khi mở dialog để lúc bấm "Nhập CV"
  // không tốn thêm 1 lượt tải module nặng (~vài trăm KB).
  React.useEffect(() => {
    if (!open) return;
    cancelledRef.current = false;
    void import("pdfjs-dist").catch(() => undefined);
    void import("mammoth").catch(() => undefined);
  }, [open ]);

  // Đồng hồ chờ để user biết tiến độ khi AI phân tích file lớn (30–90s là bình thường).
  React.useEffect(() => {
    if (!importing) return;
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [importing]);

  const reset = () => {
    setFile(null);
    setError(null);
    setImporting(false);
    setStage(null);
    setElapsed(0);
    setSavedSessionId(null);
    setAiFailed(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      cancelledRef.current = true;
      reset();
    } else {
      cancelledRef.current = false;
    }
    onOpenChange(next);
  };

  const handleImport = async () => {
    if (!file || !hoSoUngVienId || importing) return;
    setError(null);
    setAiFailed(false);
    setSavedSessionId(null);
    setElapsed(0);
    setImporting(true);
    let sessionId: string | null = null;
    try {
      // Bước 1: tải file gốc lên server một lần duy nhất và giữ session.
      // Session có hiệu lực 24h nên bước phân tích lại không cần upload lại.
      setStage("uploading");
      const session = await cvApi.prepareImport(hoSoUngVienId, file);
      if (cancelledRef.current) return;
      sessionId = session.sessionId;
      setSavedSessionId(sessionId);

      // Bước 2: phân tích nội dung bằng AI (bước lâu nhất, thường 30–90s).
      setStage("parsing");
      const partial = await parseCvFile(file);
      if (cancelledRef.current) return;
      onImported(partial, sessionId);
      handleOpenChange(false);
    } catch (e) {
      if (cancelledRef.current) return;
      const rawMessage =
        e instanceof CvImportError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không đọc được file, vui lòng thử lại.";
      if (sessionId) {
        // File gốc đã lưu thành công, chỉ bước AI thất bại.
        // Giữ file + session để user thử lại mà không phải chọn lại file.
        setAiFailed(true);
        setError(
          isAiOverloadMessage(rawMessage)
            ? "File đã được tải lên. AI đang quá tải nên chưa tự động đọc được nội dung."
            : `File đã được tải lên. ${rawMessage}`,
        );
      } else {
        setError(rawMessage);
      }
    } finally {
      if (!cancelledRef.current) {
        setImporting(false);
        setStage(null);
      }
    }
  };

  const handleRetryParse = async () => {
    if (!file || !savedSessionId || importing) return;
    setError(null);
    setElapsed(0);
    setImporting(true);
    setStage("parsing");
    try {
      const partial = await parseCvFile(file);
      if (cancelledRef.current) return;
      onImported(partial, savedSessionId);
      handleOpenChange(false);
    } catch (e) {
      if (cancelledRef.current) return;
      const rawMessage =
        e instanceof CvImportError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không phân tích được nội dung CV.";
      setAiFailed(true);
      setError(
        isAiOverloadMessage(rawMessage)
          ? "File đã được tải lên. AI vẫn đang quá tải, bạn có thể thử lại sau ít phút hoặc nhập thủ công."
          : `File đã được tải lên. ${rawMessage}`,
      );
    } finally {
      if (!cancelledRef.current) {
        setImporting(false);
        setStage(null);
      }
    }
  };

  const handleManualContinue = () => {
    if (!file || !savedSessionId) return;
    if (onManualImported) {
      onManualImported(savedSessionId, file.name);
    } else {
      onImported({ tenFile: file.name } as Partial<CvFormData>, savedSessionId);
    }
    handleOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl outline-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                  Tải CV hiện có
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                  Tải CV của bạn để sử dụng làm dữ liệu khởi đầu. Bạn vẫn có thể chỉnh sửa toàn bộ nội dung sau khi nhập.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                aria-label="Đóng"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>

            <CvUpload
              className="mt-5"
              file={file}
              disabled={importing}
              onFileChange={(next) => {
                setError(null);
                setAiFailed(false);
                setSavedSessionId(null);
                setFile(next);
              }}
              onError={(message) => {
                setFile(null);
                setError(message);
              }}
            />

            {importing && (
              <p role="status" className="mt-3 flex items-start gap-2 rounded-2xl border border-border bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
                <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
                {stage === "uploading"
                  ? `Đang tải file lên (${elapsed}s)...`
                  : `Đang phân tích CV bằng AI (đã chờ ${elapsed}s — file nhiều chữ thường mất 30–90s, bạn cứ để dialog mở).`}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </p>
            )}

            {aiFailed && savedSessionId && file && !importing ? (
              <div className="mt-5 flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={handleRetryParse}
                    disabled={importing}
                  >
                    Thử phân tích lại
                  </Button>
                  <Button size="sm" className="rounded-full" onClick={handleManualContinue} disabled={importing}>
                    Tiếp tục nhập thủ công
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="self-end rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Để sau
                </button>
              </div>
            ) : (
              <div className="mt-5 flex justify-end gap-2">
                <DialogPrimitive.Close className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  Huỷ
                </DialogPrimitive.Close>
                <Button size="sm" className="rounded-full" onClick={handleImport} disabled={!file || !hoSoUngVienId || importing}>
                  {importing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  {importing ? `Đang nhập (${elapsed}s)...` : "Nhập CV"}
                </Button>
              </div>
            )}
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
