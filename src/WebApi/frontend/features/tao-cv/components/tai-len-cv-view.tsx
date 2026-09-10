"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2, Copy, ArrowRight, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { defaultCvData } from "../constants";
import type { CvFormData } from "../types";
import { newId, toCvPayload } from "../types";
import { cvApi } from "@/lib/cv-api";

type OcrResult = {
  data: Record<string, unknown>;
  storeName: string;
  fileName: string;
  citations?: unknown[];
};

type Stage = "idle" | "uploading" | "done" | "error";

const STEPS = ["Tạo File Search store", "Upload + index file", "Gemini trích xuất JSON"];

const ACCEPT = "application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg";

function toCvFormData(raw: Record<string, unknown>, fileName: string): CvFormData {
  const base: CvFormData = JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;
  const o = raw as Partial<CvFormData>;
  const withIds = <T extends object>(arr: unknown): (T & { id: string })[] =>
    (Array.isArray(arr) ? arr : []).map((it) => ({ ...((it ?? {}) as object), id: newId() }) as T & { id: string });
  return {
    ...base,
    thongTinLienHe: { ...base.thongTinLienHe, ...((o.thongTinLienHe ?? {}) as object) },
    hocVan: withIds(o.hocVan),
    kinhNghiemLamViec: withIds(o.kinhNghiemLamViec),
    duAn: withIds(o.duAn),
    kyNang: withIds(o.kyNang),
    chungChi: withIds(o.chungChi),
    templateId: base.templateId,
    tenFile: fileName.replace(/\.[^.]+$/, "") || base.tenFile,
  } as CvFormData;
}

export function TaiLenCvView() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keyMissing, setKeyMissing] = useState(false);

  useEffect(() => {
    fetch("/api/cv-ocr")
      .then((r) => r.json())
      .then((j) => {
        if (j && j.configured === false) setKeyMissing(true);
      })
      .catch(() => {});
  }, []);

  // Hiệu ứng chạy step trong lúc chờ server (server làm 1 request dài).
  useEffect(() => {
    if (stage !== "uploading") return;
    const t = setInterval(() => setActiveStep((s) => (s + 1) % STEPS.length), 4000);
    return () => clearInterval(t);
  }, [stage]);

  const pickFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    const ok = ["application/pdf", "image/png", "image/jpeg"].includes(f.type);
    if (!ok) {
      toast.error("Chỉ nhận PDF, PNG, JPEG");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File vượt quá 20MB");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    setStage("idle");
  }, []);

  const handleExtract = async () => {
    if (!file) {
      toast.error("Hãy chọn file CV trước");
      return;
    }
    setStage("uploading");
    setActiveStep(0);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cv-ocr", { method: "POST", body: fd });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (body as { message?: string } | null)?.message ?? `OCR thất bại (HTTP ${res.status})`,
        );
      }
      setResult(body as OcrResult);
      setStage("done");
      toast.success("Đã trích xuất CV thành JSON");
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR thất bại");
      setStage("error");
    }
  };

  const jsonText = result ? JSON.stringify(result.data, null, 2) : "";

  const handleCopy = async () => {
    if (!jsonText) return;
    await navigator.clipboard.writeText(jsonText).catch(() => {});
    toast.success("Đã sao chép JSON");
  };

  const handleGoToBuilder = () => {
    if (!result) return;
    try {
      localStorage.setItem(
        "tao-cv-import",
        JSON.stringify({ data: result.data, fileName: result.fileName, at: Date.now() }),
      );
    } catch {}
    router.push("/tao-cv");
  };

  const handleSaveDirect = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const hs = await cvApi.getMyHoSo();
      const formData = toCvFormData(result.data, result.fileName);
      const id = await cvApi.createCv(
        toCvPayload(hs.id, formData, true) as unknown as Record<string, unknown>,
      );
      toast.success(`Đã lưu thành CV #${id}`);
      router.push("/tao-cv");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu CV thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cv-builder-shell">
      <div className="cv-builder-topline">
        <div className="cv-breadcrumb">
          <span>
            <FileText className="inline h-3.5 w-3.5 mr-1" />
            Tạo CV
          </span>
          <strong>/</strong>
          <span>Tải lên & OCR</span>
        </div>
        <div className="cv-save-state">
          <div className="cv-live-dot"></div>
          <span>Gemini File Search</span>
        </div>
      </div>

      <div className="cv-builder-header">
        <div>
          <p className="cv-eyebrow">Bước 0: Tải CV có sẵn</p>
          <h1>
            Tải lên CV, <em>nhận về JSON</em>
          </h1>
          <p className="cv-builder-subtitle">
            Upload PDF/ảnh CV → server tạo File Search store, index file rồi dùng Gemini trích xuất JSON đúng
            schema form Tạo CV.
          </p>
        </div>
      </div>

      {keyMissing && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4 text-sm text-yellow-800">
            Chưa cấu hình <code>GEMINI_API_KEY</code> ở server. Thêm vào{" "}
            <code>src/WebApi/frontend/.env.local</code> rồi restart <code>next dev</code>.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              1. Chọn file CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
              }`}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Kéo thả file vào đây hoặc bấm để chọn</p>
              <p className="text-xs text-muted-foreground">PDF, PNG, JPEG — tối đa 20MB</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setStage("idle");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button onClick={handleExtract} disabled={!file || stage === "uploading"} className="w-full">
              {stage === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang OCR bằng Gemini...
                </>
              ) : (
                "Trích xuất thành JSON"
              )}
            </Button>

            {stage === "uploading" && (
              <ol className="space-y-2 text-sm">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    {i < activeStep ? (
                      <Badge variant="secondary">✓ xong</Badge>
                    ) : i === activeStep ? (
                      <Badge>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        đang chạy
                      </Badge>
                    ) : (
                      <Badge variant="outline">chờ</Badge>
                    )}
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
                <p className="text-xs text-muted-foreground">
                  Index file có thể mất 30–120s với PDF nhiều trang, vui lòng đợi.
                </p>
              </ol>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Kết quả JSON</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!result ? (
              <p className="text-sm text-muted-foreground">
                Chưa có kết quả. Upload file rồi bấm “Trích xuất thành JSON”.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{result.fileName}</Badge>
                  <span className="truncate" title={result.storeName}>
                    store: {result.storeName}
                  </span>
                </div>
                <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
                  {jsonText}
                </pre>
                {Array.isArray(result.citations) && result.citations.length > 0 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">
                      Trích dẫn File Search ({result.citations.length})
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2">
                      {JSON.stringify(result.citations, null, 2)}
                    </pre>
                  </details>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Sao chép JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGoToBuilder}>
                    Đổ vào Tạo CV
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button size="sm" onClick={handleSaveDirect} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu thành CV luôn
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
