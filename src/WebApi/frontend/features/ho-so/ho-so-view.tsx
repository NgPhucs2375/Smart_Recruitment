"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  Save,
  Loader2,
  PlusCircle,
  Pencil,
  Mail,
  Printer,
  Minus,
  Plus,
  ImagePlus,
  Trash2,
  Sparkles,
  Zap,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { avatarProxyUrl, hoSoApi, cvApi } from "@/lib/api/cv-api";
import type { HoSoVm, CvVm } from "@/lib/types";
import { formatVndInput, parseVndInput } from "@/lib/format-vnd";
import { isoToVnDate, isValidVnDate, maskDateVn, vnToIsoDate } from "@/features/tao-cv/cv-data";
import { MOCK_CVS, MOCK_HO_SO } from "./mock-preview";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { useFollowedCompanies } from "@/hooks/use-followed-companies";
import { doanhNghiepApi, type DoanhNghiepVm } from "@/features/doanh-nghiep/doanh-nghiep-api";

/** Stepper step for expected salary (matches previous type=number convention). */
const SALARY_STEP = 500000;

export function HoSoView() {
  const identity = useStoredIdentity();
  const [hoSo, setHoSo] = useState<HoSoVm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  // ngaySinh is edited as dd/mm/yyyy text (masked), stored ISO for backend.
  const [ngaySinh, setNgaySinh] = useState("");
  const [gioiTinh, setGioiTinh] = useState("Nam");
  const [diaChi, setDiaChi] = useState("");
  const [gioiThieu, setGioiThieu] = useState("");
  const [anhDaiDienUrl, setAnhDaiDienUrl] = useState("");
  const [viTriUngTuyen, setViTriUngTuyen] = useState("");
  // Display string with "." thousands separator; parsed to number on submit.
  const [mucLuongMongMuon, setMucLuongMongMuon] = useState("");
  const [isTimViec, setIsTimViec] = useState(true);
  const [cvs, setCvs] = useState<CvVm[]>([]);
  const [cvsLoading, setCvsLoading] = useState(false);
  const [cvsError, setCvsError] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isMock, setIsMock] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const avatarPreviewRef = useRef<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);
  const ngaySinhInputRef = useRef<HTMLInputElement>(null);
  // Số chữ số trước caret mong muốn sau lần mask gần nhất (xem useEffect bên dưới).
  const ngaySinhCaretDigitsRef = useRef<number | null>(null);
  const mucLuongInputRef = useRef<HTMLInputElement>(null);
  const mucLuongCaretDigitsRef = useRef<number | null>(null);
  const [allCompanies, setAllCompanies] = useState<DoanhNghiepVm[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const { followedIds, count: followedCount, toggle: toggleFollowed, hydrated: followedHydrated } = useFollowedCompanies();
  const companiesFetchedRef = useRef(false);

  const handleAvatarFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB.");
      return;
    }
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    const previewUrl = URL.createObjectURL(file);
    avatarPreviewRef.current = previewUrl;
    setAvatarFile(file);
    setAvatarRemoved(false);
    setAnhDaiDienUrl(previewUrl);
  };

  const removeAvatar = () => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    avatarPreviewRef.current = null;
    setAvatarFile(null);
    setAvatarRemoved(true);
    setAnhDaiDienUrl("");
  };

  // Gõ ngày sinh: mask dd/mm/yyyy đơn giản (maskDateVn). Caret KHÔNG set trong
  // onChange (tránh race requestAnimationFrame: callback cũ chạy sau keystroke
  // mới → caret nhảy về vị trí cũ → mất ký tự); thay vào đó ghi số-chữ-số-trước-
  // caret vào ref rồi khôi phục trong useEffect bên dưới.
  const handleNgaySinhChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    ngaySinhCaretDigitsRef.current = raw.slice(0, caret).replace(/\D/g, "").length;
    setNgaySinh(maskDateVn(raw));
  };

  // Khôi phục caret sau khi value được mask (một nguồn ghi duy nhất, không race).
  useEffect(() => {
    const el = ngaySinhInputRef.current;
    const want = ngaySinhCaretDigitsRef.current;
    if (!el || want == null) return;
    ngaySinhCaretDigitsRef.current = null;
    let pos = 0;
    let seen = 0;
    for (let i = 0; i < ngaySinh.length && seen < want; i += 1) {
      if (/\d/.test(ngaySinh[i])) seen += 1;
      pos = i + 1;
    }
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      // input không hỗ trợ selection — bỏ qua
    }
  }, [ngaySinh]);

  const handleNgaySinhBlur = () => {
    setNgaySinh((prev) => {
      const t = prev.trim();
      if (t === "") return "";
      // Đã đúng dd/mm/yyyy thì giữ nguyên, còn lại thử mask (vd 01012000 -> 01/01/2000).
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t;
      const masked = maskDateVn(t);
      return /^\d{2}\/\d{2}\/\d{4}$/.test(masked) ? masked : t;
    });
  };

  // Mức lương: formatVndInput chèn dấu "." phân cách nghìn. Giữ caret bằng cách
  // đếm số chữ số trước caret rồi khôi phục trong useEffect (tránh nhảy/chèn số).
  const handleMucLuongChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    mucLuongCaretDigitsRef.current = raw.slice(0, caret).replace(/\D/g, "").length;
    setMucLuongMongMuon(formatVndInput(raw));
  };

  useEffect(() => {
    const el = mucLuongInputRef.current;
    const want = mucLuongCaretDigitsRef.current;
    if (!el || want == null) return;
    mucLuongCaretDigitsRef.current = null;
    let pos = 0;
    let seen = 0;
    for (let i = 0; i < mucLuongMongMuon.length && seen < want; i += 1) {
      if (/\d/.test(mucLuongMongMuon[i])) seen += 1;
      pos = i + 1;
    }
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      // input không hỗ trợ selection — bỏ qua
    }
  }, [mucLuongMongMuon]);

  const loadData = async () => {
    // DEV preview (?xem-truoc=1): render view-mode with sample data, no API.
    // Delete with mock-preview.ts once the real backend works.
    try {
      if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("xem-truoc") === "1") {
        setHoSo(MOCK_HO_SO);
        populateForm(MOCK_HO_SO);
        setCvs(MOCK_CVS);
        setIsEditing(false);
        setIsMock(true);
        setLoading(false);
        return;
      }
    } catch {
      // ignore location errors, fall through to real load
    }
    setLoading(true);
    setLoadError("");
    try {
      const data = await hoSoApi.getMyHoSo();
      if (data) {
        setHoSo(data);
        populateForm(data);
        setIsEditing(false);
      }
    } catch (e) {
      // Chỉ 404 / "chưa có hồ sơ" mới là trạng thái chưa có hồ sơ; các lỗi
      // khác (500, mạng, token) phải hiện lỗi — không mở form tạo trống,
      // tránh lưu trùng lặp khi người dùng không hay biết.
      const status = (e as Error & { status?: number }).status;
      const isNoProfile = status === 404 || (e instanceof Error && /chưa có hồ sơ/i.test(e.message));
      if (isNoProfile) {
        setHoSo(null);
        setIsEditing(true);
        if (identity?.name) setHoTen(identity.name);
      } else {
        setLoadError(e instanceof Error ? e.message : "Không tải được hồ sơ.");
      }
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: HoSoVm) => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    avatarPreviewRef.current = null;
    setAvatarFile(null);
    setAvatarRemoved(false);
    setHoTen(data.hoTen || "");
    setSdt(data.sdt || "");
    setNgaySinh(isoToVnDate(data.ngaySinh));
    setGioiTinh(data.gioiTinh || "Nam");
    setDiaChi(data.diaChi || "");
    setGioiThieu(data.gioiThieu || "");
    setAnhDaiDienUrl(data.anhDaiDienUrl || "");
    setViTriUngTuyen(data.viTriUngTuyen || "");
    setMucLuongMongMuon(
      data.mucLuongMongMuon ? formatVndInput(String(data.mucLuongMongMuon)) : ""
    );
    setIsTimViec(data.isTimViec !== false);
  };

  const loadInitialData = useEffectEvent(() => {
    void loadData();
  });

  useEffect(() => {
    const timer = window.setTimeout(loadInitialData, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
  }, []);

  // CV của tôi — reuse existing CV list API, no duplicate storage.
  // Skipped in mock preview (sample CVs are already set).
  useEffect(() => {
    const hoSoId = hoSo?.id;
    if (!hoSoId || hoSoId <= 0 || isEditing || isMock) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setCvsLoading(true);
      cvApi
        .listCvs(hoSoId)
        .then((list) => {
          if (!cancelled) { setCvs(list); setCvsError(false); }
        })
        .catch(() => {
          if (!cancelled) { setCvs([]); setCvsError(true); }
        })
        .finally(() => {
          if (!cancelled) setCvsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hoSo?.id, isEditing, isMock]);

  // Danh bạ doanh nghiệp — lấy 1 lần để lọc theo danh sách theo dõi (localStorage).
  // Mock preview không gọi API, giữ trạng thái rỗng.
  useEffect(() => {
    if (!followedHydrated || isMock || companiesFetchedRef.current) return;
    companiesFetchedRef.current = true;
    let cancelled = false;
    setCompaniesLoading(true);
    void doanhNghiepApi
      .list()
      .then((list) => {
        if (!cancelled) setAllCompanies(list);
      })
      .catch(() => {
        if (!cancelled) setAllCompanies([]);
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [followedHydrated, isMock]);

  const followedCompanies = useMemo(
    () => (isMock ? [] : allCompanies.filter((company) => followedIds.has(company.id))),
    [allCompanies, followedIds, isMock]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMock) {
      toast.info("Chế độ xem trước — kết nối BE để lưu hồ sơ thật.");
      return;
    }
    if (!hoTen.trim()) {
      toast.error("Vui lòng nhập họ tên.");
      return;
    }
    if (ngaySinh.trim() !== "" && !isValidVnDate(ngaySinh)) {
      toast.error("Ngày sinh không hợp lệ (dd/mm/yyyy).");
      return;
    }
    setSaving(true);
    try {
      const isoNgaySinh = vnToIsoDate(ngaySinh);
      const payload = {
        hoTen: hoTen.trim(),
        sdt: sdt.trim(),
        // Date-only string parses as UTC midnight, preserving the calendar day.
        ngaySinh: isoNgaySinh ? new Date(isoNgaySinh).toISOString() : null,
        gioiTinh,
        diaChi: diaChi.trim(),
        gioiThieu: gioiThieu.trim(),
        viTriUngTuyen: viTriUngTuyen.trim(),
        mucLuongMongMuon: parseVndInput(mucLuongMongMuon),
        isTimViec,
      };

      let profileId: number;
      if (hoSo && hoSo.id > 0) {
        await hoSoApi.update(hoSo.id, {
          id: hoSo.id,
          ...payload,
        });
        profileId = hoSo.id;
      } else {
        profileId = await hoSoApi.create({
          nguoiDungId: 0,
          ...payload,
        });
      }

      const uploadedAvatar = avatarFile ? await hoSoApi.uploadAvatar(profileId, avatarFile) : null;
      const deletedAvatar = !uploadedAvatar && avatarRemoved && Boolean(hoSo?.anhDaiDienUrl);
      if (deletedAvatar) await hoSoApi.deleteAvatar(profileId);
      if (uploadedAvatar || deletedAvatar) {
        window.dispatchEvent(new Event("hireai:avatar-changed"));
      }

      toast.success(hoSo ? "Cập nhật hồ sơ thành công!" : "Tạo mới hồ sơ ứng viên thành công!");

      if (uploadedAvatar && hoSo) {
        const nextAvatarUrl = avatarProxyUrl(profileId, uploadedAvatar);
        setAnhDaiDienUrl(nextAvatarUrl);
        setHoSo((current) => current ? { ...current, anhDaiDienUrl: nextAvatarUrl } : current);
        setAvatarFile(null);
        if (avatarPreviewRef.current) {
          URL.revokeObjectURL(avatarPreviewRef.current);
          avatarPreviewRef.current = null;
        }
        setIsEditing(false);
      } else {
        await loadData();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultCv = async (cvId: number) => {
    try {
      await cvApi.setDefault(cvId);
      if (hoSo) setCvs(await cvApi.listCvs(hoSo.id));
      toast.success("Đã đặt CV làm mặc định cho gợi ý việc làm.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đặt CV mặc định.");
    }
  };

  // Mock CVs don't exist on the backend — open them via the gallery
  // template flow instead of the saved-CV (?cv=) flow.
  const cvHref = (cv: CvVm) =>
    isMock && cv.templateId ? `/tao-cv?template=${cv.templateId}` : `/tao-cv?cv=${cv.id}`;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Đang tải thông tin hồ sơ...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="sr-only">Hồ sơ ứng viên</h1>
      {loadError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">Không tải được hồ sơ: {loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void loadData()}>
            Thử lại
          </Button>
        </div>
      )}
      {isMock && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          Chế độ xem trước giao diện (dữ liệu minh họa) — thao tác lưu và tải danh sách thật bị tắt cho tới khi BE hoạt động. Xóa <span className="font-mono">?xem-truoc=1</span> để dùng dữ liệu thật.
        </div>
      )}
      {!hoSo && !isEditing && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <CardTitle className="mt-2">Bạn chưa có hồ sơ ứng viên</CardTitle>
            <CardDescription>
              Tạo hồ sơ ngay để bắt đầu ứng tuyển các công việc hấp dẫn và tạo CV chuyên nghiệp.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => setIsEditing(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo hồ sơ ứng viên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SECTION 1 — HỒ SƠ ỨNG VIÊN */}
      {hoSo && !isEditing && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Hồ sơ ứng viên
            </h2>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-1.5 size-3.5" />
              Chỉnh sửa
            </Button>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-bold text-primary sm:size-20">
                  {hoSo.anhDaiDienUrl && (
                    <Image
                      src={hoSo.anhDaiDienUrl}
                      alt={`Ảnh đại diện của ${hoSo.hoTen}`}
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-cover"
                    />
                  )}
                  <span className={hoSo.anhDaiDienUrl ? "sr-only" : undefined}>
                    {hoSo.hoTen
                      ? hoSo.hoTen
                          .split(" ")
                          .map((n) => n[0])
                          .slice(-2)
                          .join("")
                          .toUpperCase()
                      : "UV"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-foreground sm:text-xl">{hoSo.hoTen}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{hoSo.viTriUngTuyen || "Chưa cập nhật vị trí"}</p>
                  <span
                    className={
                      hoSo.isTimViec
                        ? "mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal"
                        : "mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    <span
                      className={hoSo.isTimViec ? "size-1.5 rounded-full bg-teal" : "size-1.5 rounded-full bg-muted-foreground/50"}
                      aria-hidden
                    />
                    {hoSo.isTimViec ? "Đang bật tìm việc" : "Tạm dừng tìm việc"}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 border-t border-border/50 pt-4 text-sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 truncate">{identity?.email || "Chưa có email"}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                  <span className="inline-flex items-center gap-2.5">
                    <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                    {hoSo.sdt || "Chưa có SĐT"}
                  </span>
                  <span aria-hidden className="text-border">•</span>
                  <span className="inline-flex items-center gap-2.5">
                    <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
                    {hoSo.ngaySinh
                      ? `${new Date(hoSo.ngaySinh).toLocaleDateString("vi-VN")}${hoSo.gioiTinh ? ` (${hoSo.gioiTinh})` : ""}`
                      : "Chưa cập nhật ngày sinh"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 truncate">{hoSo.diaChi || "Chưa có địa chỉ"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <DollarSign className="size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Mong muốn:{" "}
                    {hoSo.mucLuongMongMuon
                      ? `${hoSo.mucLuongMongMuon.toLocaleString("vi-VN")} VNĐ/tháng`
                      : "Thương lượng"}
                  </span>
                </div>
              </div>
              {hoSo.gioiThieu && (
                <div className="mt-4 border-t border-border/50 pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Giới thiệu</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{hoSo.gioiThieu}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* SECTION 2 — DANH SÁCH CV ĐÃ TẠO */}
      {hoSo && !isEditing && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Danh sách CV đã tạo {cvsLoading ? "" : `(${cvs.length})`}
            </h2>
            <Link href="/tao-cv">
              <Button size="sm" className="rounded-full">
                <PlusCircle className="mr-1.5 size-3.5" />
                Tạo CV
              </Button>
            </Link>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
            {cvsLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách CV...
              </div>
            ) : cvsError ? (
              <div className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive">Không tải được danh sách CV.</p>
                <Button variant="outline" size="sm" onClick={() => {
                  const hoSoId = hoSo?.id;
                  if (!hoSoId || hoSoId <= 0) return;
                  setCvsLoading(true);
                  cvApi
                    .listCvs(hoSoId)
                    .then((list) => { setCvs(list); setCvsError(false); })
                    .catch(() => { setCvs([]); setCvsError(true); })
                    .finally(() => setCvsLoading(false));
                }}>
                  Thử lại
                </Button>
              </div>
            ) : cvs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-sm text-muted-foreground">Chưa có CV nào được lưu.</p>
                <Link href="/tao-cv" className="mt-4">
                  <Button>
                    <Zap className="mr-2 size-4" />
                    Tạo CV nhanh từ Hồ sơ này
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cvs.map((cv) => (
                  <li key={cv.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {cv.tenFile || `CV #${cv.id}`}
                          {cv.isDefault && (
                            <Badge variant="secondary" className="ml-2">Mặc định</Badge>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {cv.templateId ? `Mẫu ${cv.templateId}` : "Mẫu chuẩn"}
                          {cv.ngayUpload
                            ? ` • Cập nhật ${new Date(cv.ngayUpload).toLocaleDateString("vi-VN")}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      {!cv.isDefault && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleSetDefaultCv(cv.id)}
                        >
                          Đặt làm mặc định
                        </Button>
                      )}
                      <Link href={cvHref(cv)}>
                        <Button variant="outline" size="sm">
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Mở / Sửa
                        </Button>
                      </Link>
                      <Link href={`/cv-phan-tich/${cv.id}`}>
                        <Button variant="outline" size="sm">
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          Phân tích AI
                        </Button>
                      </Link>
                      <Link href={cvHref(cv)}>
                        <Button variant="ghost" size="sm">
                          <Printer className="mr-1.5 h-3.5 w-3.5" />
                          In / PDF
                        </Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </section>
      )}

      {/* SECTION 3 — CÔNG TY ĐANG THEO DÕI */}
      {hoSo && !isEditing && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Công ty đang theo dõi {followedHydrated && !companiesLoading ? `(${followedCount})` : ""}
            </h2>
            <Link href="/doanh-nghiep">
              <Button variant="outline" size="sm" className="rounded-full">
                Khám phá
              </Button>
            </Link>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              {companiesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải danh sách công ty...
                </div>
              ) : followedCompanies.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Bạn chưa theo dõi doanh nghiệp nào.
                </p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {followedCompanies.map((company) => (
                    <li key={company.id} className="flex items-center justify-between gap-3 py-3">
                      <Link
                        href={`/doanh-nghiep/${company.id}`}
                        className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Building2 className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {company.tenDoanhNghiep}
                          </span>
                          {(company.linhVucHoatDong || company.diaChi) && (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {company.linhVucHoatDong || company.diaChi}
                            </span>
                          )}
                        </span>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleFollowed(company.id)}
                      >
                        Bỏ theo dõi
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Edit / Create Form Mode */}
      {isEditing && (
        <form onSubmit={handleSave}>
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/40 pb-4">
              <CardTitle className="text-xl font-semibold text-foreground">
                {hoSo ? "Chỉnh sửa thông tin hồ sơ" : "Tạo hồ sơ ứng viên mới"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Điền đầy đủ thông tin cá nhân và vị trí mong muốn để nhà tuyển dụng tiếp cận bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Thông tin cá nhân */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Thông tin cá nhân
                </h3>
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                   <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-semibold text-primary ring-2 ring-border">
                      {anhDaiDienUrl && <Image src={anhDaiDienUrl} alt="Xem trước ảnh đại diện" fill sizes="80px" unoptimized className="object-cover" />}
                     {!anhDaiDienUrl && <User className="size-8" />}
                   </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="text-xs font-medium text-foreground">Ảnh đại diện</label>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        handleAvatarFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => avatarInputRef.current?.click()}
                        className="h-9 rounded-xl"
                      >
                        <ImagePlus className="mr-2 size-4" />
                        {anhDaiDienUrl ? "Đổi ảnh" : "Chọn ảnh từ thiết bị"}
                      </Button>
                      {anhDaiDienUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={removeAvatar}
                          className="h-9 rounded-xl text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Xóa ảnh
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      JPG, PNG, WEBP hoặc GIF, tối đa 5MB. Ảnh được lưu an toàn trên MinIO.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ho-so-ho-ten" className="text-xs font-medium text-foreground">
                      Họ và tên <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ho-so-ho-ten"
                        placeholder="Nguyễn Văn A"
                        value={hoTen}
                        onChange={(e) => setHoTen(e.target.value)}
                        required
                        className="h-10 rounded-xl border-input bg-card pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ho-so-sdt" className="text-xs font-medium text-foreground">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ho-so-sdt"
                        placeholder="0912345678"
                        value={sdt}
                        onChange={(e) => setSdt(e.target.value)}
                        className="h-10 rounded-xl border-input bg-card pl-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ho-so-ngay-sinh" className="text-xs font-medium text-foreground">Ngày sinh</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ho-so-ngay-sinh"
                        ref={ngaySinhInputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/yyyy"
                        autoComplete="bday"
                        value={ngaySinh}
                        onChange={handleNgaySinhChange}
                        onBlur={handleNgaySinhBlur}
                        aria-invalid={ngaySinh.trim() !== "" && !isValidVnDate(ngaySinh)}
                        aria-describedby="ho-so-ngay-sinh-error"
                        className="h-10 rounded-xl border-input bg-card pl-10 pr-10 text-sm"
                      />
                      {/* Date picker ẩn: bấm icon lịch để chọn ngày, gõ tay không bị nhảy số */}
                      <input
                        ref={nativeDateRef}
                        type="date"
                        tabIndex={-1}
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 right-10 h-0 w-0 opacity-0"
                        value={vnToIsoDate(ngaySinh) || ""}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => {
                          if (e.target.value) setNgaySinh(isoToVnDate(e.target.value));
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Chọn ngày sinh từ lịch"
                        onClick={() => {
                          const el = nativeDateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                          if (!el) return;
                          if (typeof el.showPicker === "function") el.showPicker();
                          else el.focus();
                        }}
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <Calendar className="size-4" />
                      </button>
                    </div>
                    {ngaySinh.trim() !== "" && !isValidVnDate(ngaySinh) && (
                      <p id="ho-so-ngay-sinh-error" role="alert" className="text-xs text-destructive">Ngày không hợp lệ (dd/mm/yyyy)</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ho-so-gioi-tinh" className="text-xs font-medium text-foreground">Giới tính</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Select value={gioiTinh} onValueChange={(value) => { if (value !== null) setGioiTinh(value); }}>
                        <SelectTrigger id="ho-so-gioi-tinh" className="h-10 w-full rounded-xl border-input bg-card pl-10 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="Nam">Nam</SelectItem>
                          <SelectItem value="Nữ">Nữ</SelectItem>
                          <SelectItem value="Khác">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ho-so-dia-chi" className="text-xs font-medium text-foreground">Địa chỉ hiện tại</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ho-so-dia-chi"
                      placeholder="Quận 1, TP. Hồ Chí Minh"
                      value={diaChi}
                      onChange={(e) => setDiaChi(e.target.value)}
                      className="h-10 rounded-xl border-input bg-card pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Vị trí & Định hướng */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Định hướng nghề nghiệp & Mong muốn
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ho-so-vi-tri" className="text-xs font-medium text-foreground">Vị trí mong muốn / Chức danh</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ho-so-vi-tri"
                        placeholder="Fullstack .NET Developer"
                        value={viTriUngTuyen}
                        onChange={(e) => setViTriUngTuyen(e.target.value)}
                        className="h-10 rounded-xl border-input bg-card pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ho-so-muc-luong" className="text-xs font-medium text-foreground">Mức lương mong muốn (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ho-so-muc-luong"
                        ref={mucLuongInputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="15.000.000"
                        aria-label="Mức lương mong muốn (VNĐ)"
                        value={mucLuongMongMuon}
                        onChange={handleMucLuongChange}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setMucLuongMongMuon(formatVndInput(String(parseVndInput(mucLuongMongMuon) + SALARY_STEP)));
                          } else if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setMucLuongMongMuon(
                              formatVndInput(String(Math.max(0, parseVndInput(mucLuongMongMuon) - SALARY_STEP)))
                            );
                          }
                        }}
                        className="h-10 rounded-xl border-input bg-card pl-10 pr-20 text-sm tabular-nums"
                      />
                      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                        <button
                          type="button"
                          aria-label="Giảm mức lương"
                          onClick={() =>
                            setMucLuongMongMuon(
                              formatVndInput(String(Math.max(0, parseVndInput(mucLuongMongMuon) - SALARY_STEP)))
                            )
                          }
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Tăng mức lương"
                          onClick={() =>
                            setMucLuongMongMuon(formatVndInput(String(parseVndInput(mucLuongMongMuon) + SALARY_STEP)))
                          }
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trạng thái tìm việc */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                  <input
                    type="checkbox"
                    id="isTimViec"
                    className="size-4 rounded border-gray-300 accent-primary focus:ring-ring"
                    checked={isTimViec}
                    onChange={(e) => setIsTimViec(e.target.checked)}
                  />
                  <label htmlFor="isTimViec" className="text-xs font-medium cursor-pointer text-foreground">
                    Bật trạng thái sẵn sàng tìm việc (Cho phép Nhà tuyển dụng tìm thấy hồ sơ)
                  </label>
                </div>

                {/* Giới thiệu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Giới thiệu bản thân & Mục tiêu nghề nghiệp
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Tóm tắt kinh nghiệm làm việc, kỹ năng nổi bật và định hướng phát triển sự nghiệp..."
                    value={gioiThieu}
                    onChange={(e) => setGioiThieu(e.target.value)}
                    className="rounded-xl border-input bg-card text-sm"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                {hoSo && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      populateForm(hoSo);
                      setIsEditing(false);
                    }}
                    className="h-10 rounded-xl border-input"
                  >
                    Hủy bỏ
                  </Button>
                )}
                <Button type="submit" disabled={saving} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu hồ sơ
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
