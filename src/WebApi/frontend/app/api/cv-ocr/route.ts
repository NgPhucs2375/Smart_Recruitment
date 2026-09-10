import { NextResponse, type NextRequest } from "next/server";

// POST /api/cv-ocr — nhận file CV (PDF/PNG/JPEG), dùng Gemini File Search RAG
// (theo docs/filesearch.md) để OCR + trích xuất JSON theo schema CvFormData.
//
// Flow:
//   1. Tạo FileSearchStore (embedding gemini-embedding-2 cho multimodal)
//   2. Resumable upload file vào store (uploadToFileSearchStore)
//   3. Poll operation tới khi index xong
//   4. interactions.create với tool file_search + prompt ép trả JSON thuần
//   5. Parse JSON từ text model, trả về client
//
// Env (server-only, KHÔNG prefix NEXT_PUBLIC_):
//   GEMINI_API_KEY (bắt buộc)
//   GEMINI_MODEL (mặc định "gemini-2.5-flash")
//   GEMINI_EMBEDDING_MODEL (mặc định "models/gemini-embedding-2")

export const runtime = "nodejs";
export const maxDuration = 300;

const GEMINI_BASE = "https://generativelanguage.googleapis.com";
const MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

const CV_JSON_PROMPT = `Bạn là hệ thống OCR + trích xuất CV. Dựa trên tài liệu trong File Search store, hãy đọc toàn bộ CV và trích xuất thông tin thành JSON THUẦN (không markdown, không giải thích, không text ngoài JSON).

Schema bắt buộc (đúng key, thiếu thì dùng "" hoặc []):
{
  "thongTinLienHe": {
    "hoTen": "", "email": "", "sdt": "", "diaChi": "",
    "github": "", "linkedIn": "", "portfolio": "",
    "gioiTinh": "", "ngaySinh": "",
    "viTriUngTuyen": "", "mucLuongMongMuon": "", "gioiThieuBanThan": ""
  },
  "hocVan": [{ "truong": "", "chuyenNganh": "", "tuNgay": "", "denNgay": "", "moTa": "" }],
  "kinhNghiemLamViec": [{ "congTy": "", "chucDanh": "", "tuNgay": "", "denNgay": "", "isHienTai": false, "moTa": "", "kyNangSuDung": [] }],
  "duAn": [{ "tenDuAn": "", "vaiTro": "", "congNghe": [], "link": "", "moTa": "" }],
  "kyNang": [{ "tenKyNang": "", "mucDoThanhThao": "", "soNamKinhNghiem": "" }],
  "chungChi": [{ "tenChungChi": "", "donViCap": "", "ngayCap": "", "maXacMinh": "" }]
}

Quy tắc:
- Ngày tháng chuẩn hóa về dd/mm/yyyy (ví dụ "06/2022" -> "01/06/2022", chỉ có năm "2022" -> "01/01/2022"). Không suy đoán được thì "".
- kinhNghiemLamViec.isHienTai = true khi CV ghi "hiện tại/present/nay"; khi đó denNgay = "".
- kyNangSuDung và congNghe là mảng string, tách từ text (ví dụ "React, Node.js").
- SĐT giữ nguyên định dạng trong CV. Email viết thường.
- Chỉ trả JSON, không bọc code fence.`;

type FileSearchStore = { name?: string; displayName?: string };
type Operation = { name?: string; done?: boolean; error?: unknown; response?: unknown };

async function geminiFetch(
  apiKey: string,
  path: string,
  init: RequestInit & { apiKeyInHeader?: boolean } = {},
) {
  const url = `${GEMINI_BASE}${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(apiKey)}`;
  const headers = new Headers(init.headers);
  if (init.apiKeyInHeader) {
    headers.set("x-goog-api-key", apiKey);
  }
  return fetch(url, { ...init, headers });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollOperation(apiKey: string, opName: string, label: string) {
  const deadline = Date.now() + 120_000;
  let delay = 3000;
  for (;;) {
    await sleep(delay);
    const res = await geminiFetch(apiKey, `/v1beta/${opName}`);
    const op = (await res.json().catch(() => null)) as Operation | null;
    if (!res.ok || !op) {
      throw new Error(`${label} thất bại (HTTP ${res.status})`);
    }
    if (op.error) {
      throw new Error(`${label} thất bại: ${JSON.stringify(op.error).slice(0, 300)}`);
    }
    if (op.done) return op;
    if (Date.now() > deadline) {
      throw new Error(`${label} quá thời gian chờ index (>120s), hãy thử lại`);
    }
    delay = Math.min(delay + 1000, 8000);
  }
}

function extractJsonObject(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function sanitizeCvJson(raw: unknown): Record<string, unknown> {
  const o = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const asObj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

  const lh = asObj(o.thongTinLienHe);
  return {
    thongTinLienHe: {
      hoTen: str(lh.hoTen),
      email: str(lh.email).toLowerCase(),
      sdt: str(lh.sdt),
      diaChi: str(lh.diaChi),
      github: str(lh.github),
      linkedIn: str(lh.linkedIn),
      portfolio: str(lh.portfolio),
      gioiTinh: str(lh.gioiTinh),
      ngaySinh: str(lh.ngaySinh),
      viTriUngTuyen: str(lh.viTriUngTuyen),
      mucLuongMongMuon: str(lh.mucLuongMongMuon),
      gioiThieuBanThan: str(lh.gioiThieuBanThan),
    },
    hocVan: arr(o.hocVan).map((h) => {
      const x = asObj(h);
      return { truong: str(x.truong), chuyenNganh: str(x.chuyenNganh), tuNgay: str(x.tuNgay), denNgay: str(x.denNgay), moTa: str(x.moTa) };
    }),
    kinhNghiemLamViec: arr(o.kinhNghiemLamViec).map((k) => {
      const x = asObj(k);
      const kn = arr(x.kyNangSuDung).map(str).filter(Boolean);
      return {
        congTy: str(x.congTy),
        chucDanh: str(x.chucDanh),
        tuNgay: str(x.tuNgay),
        denNgay: str(x.denNgay),
        isHienTai: x.isHienTai === true,
        moTa: str(x.moTa),
        kyNangSuDung: kn,
      };
    }),
    duAn: arr(o.duAn).map((d) => {
      const x = asObj(d);
      return {
        tenDuAn: str(x.tenDuAn),
        vaiTro: str(x.vaiTro),
        congNghe: arr(x.congNghe).map(str).filter(Boolean),
        link: str(x.link),
        moTa: str(x.moTa),
      };
    }),
    kyNang: arr(o.kyNang).map((k) => {
      const x = asObj(k);
      return { tenKyNang: str(x.tenKyNang), mucDoThanhThao: str(x.mucDoThanhThao), soNamKinhNghiem: str(x.soNamKinhNghiem) };
    }),
    chungChi: arr(o.chungChi).map((c) => {
      const x = asObj(c);
      return { tenChungChi: str(x.tenChungChi), donViCap: str(x.donViCap), ngayCap: str(x.ngayCap), maXacMinh: str(x.maXacMinh) };
    }),
  };
}

type InteractionStep = {
  type?: string;
  content?: { type?: string; text?: string; annotations?: unknown[] }[];
};

export async function GET() {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  return NextResponse.json({
    configured,
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    accepts: Object.keys(ALLOWED_MIME),
    maxBytes: MAX_BYTES,
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Thiếu GEMINI_API_KEY ở server (thêm vào src/WebApi/frontend/.env.local rồi restart next dev)." },
      { status: 500 },
    );
  }
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? "models/gemini-embedding-2";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Request phải là multipart/form-data với field 'file'." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Thiếu file (field 'file')." }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME[mime]) {
    return NextResponse.json(
      { message: `Định dạng không hỗ trợ (${mime || "unknown"}). Chỉ nhận PDF, PNG, JPEG.` },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ message: "File rỗng hoặc vượt quá 20MB." }, { status: 400 });
  }

  const fileName = file.name || `cv.${ALLOWED_MIME[mime]}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    // 1. Tạo File Search store (multimodal để index cả ảnh/PDF)
    const storeRes = await geminiFetch(apiKey, "/v1beta/fileSearchStores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: `cv-upload-${Date.now()}`,
        embeddingModel,
      }),
    });
    const store = (await storeRes.json().catch(() => null)) as FileSearchStore | null;
    const storeName = store?.name;
    if (!storeRes.ok || !storeName) {
      return NextResponse.json(
        { message: `Tạo File Search store thất bại (HTTP ${storeRes.status}).` },
        { status: 502 },
      );
    }

    // 2a. Khởi tạo resumable upload vào store
    const startRes = await fetch(
      `${GEMINI_BASE}/upload/v1beta/${storeName}:uploadToFileSearchStore?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Upload-Protocol": "resumable",
          "X-Goog-Upload-Command": "start",
          "X-Goog-Upload-Header-Content-Length": String(bytes.length),
          "X-Goog-Upload-Header-Content-Type": mime,
        },
        body: JSON.stringify({ displayName: fileName }),
      },
    );
    const uploadUrl = startRes.headers.get("x-goog-upload-url");
    if (!startRes.ok || !uploadUrl) {
      return NextResponse.json(
        { message: `Khởi tạo upload thất bại (HTTP ${startRes.status}).` },
        { status: 502 },
      );
    }

    // 2b. Upload bytes + finalize
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Length": String(bytes.length),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: new Uint8Array(bytes),
    });
    const uploadBody = (await uploadRes.json().catch(() => null)) as (Operation & {
      document?: unknown;
    }) | null;
    if (!uploadRes.ok) {
      return NextResponse.json(
        { message: `Upload file thất bại (HTTP ${uploadRes.status}).` },
        { status: 502 },
      );
    }
    if (uploadBody?.name && !uploadBody.done) {
      await pollOperation(apiKey, uploadBody.name, "Index file");
    }

    // 3. Dùng File Search để trích xuất JSON
    const itRes = await geminiFetch(apiKey, "/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      apiKeyInHeader: true,
      body: JSON.stringify({
        model,
        input: CV_JSON_PROMPT,
        tools: [{ type: "file_search", file_search_store_names: [storeName] }],
      }),
    });
    const interaction = (await itRes.json().catch(() => null)) as {
      steps?: InteractionStep[];
      outputText?: string;
      error?: unknown;
    } | null;
    if (!itRes.ok || !interaction) {
      return NextResponse.json(
        { message: `Gemini trích xuất thất bại (HTTP ${itRes.status}).`, storeName, fileName },
        { status: 502 },
      );
    }

    let rawText = "";
    const citations: unknown[] = [];
    for (const step of interaction.steps ?? []) {
      if (step.type !== "model_output") continue;
      for (const block of step.content ?? []) {
        if (block.type === "text" && block.text) {
          rawText += (rawText ? "\n" : "") + block.text;
          if (Array.isArray(block.annotations)) citations.push(...block.annotations);
        }
      }
    }
    if (!rawText && typeof interaction.outputText === "string") rawText = interaction.outputText;
    if (!rawText.trim()) {
      return NextResponse.json(
        { message: "Gemini không trả về nội dung. Hãy thử lại với file rõ nét hơn.", storeName, fileName },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonObject(rawText));
    } catch {
      return NextResponse.json(
        { message: "Gemini trả về text không phải JSON hợp lệ.", rawText, storeName, fileName },
        { status: 502 },
      );
    }

    return NextResponse.json({
      data: sanitizeCvJson(parsed),
      storeName,
      fileName,
      citations: citations.slice(0, 20),
    });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "OCR thất bại, hãy thử lại." },
      { status: 500 },
    );
  }
}
