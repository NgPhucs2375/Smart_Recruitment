"use client";

import { useEffect, useEffectEvent, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
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
  ArrowRight,
  Mail,
  Printer,
  Minus,
  Plus,
  ImagePlus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { hoSoApi, cvApi } from "@/lib/api/cv-api";
import type { HoSoVm, CvVm } from "@/lib/types";
import { formatVndInput, parseVndInput } from "@/lib/format-vnd";
import { isoToVnDate, isValidVnDate, maskDateVn, vnToIsoDate } from "@/features/tao-cv/cv-data";
import { MOCK_CVS, MOCK_HO_SO } from "./mock-preview";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

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
  const [isMock, setIsMock] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const avatarPreviewRef = useRef<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);

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

  // Gõ ngày sinh: mask caret-aware — strip chữ, tối đa 8 số, tự chèn "/"
  // sau ngày và tháng, giữ caret đúng chỗ (backspace/select/replace tự nhiên).
  const handleNgaySinhChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const raw = el.value;
    const caret = el.selectionStart ?? raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setNgaySinh(out);
    // Đặt lại caret sau render: đếm qua số digit + dấu "/" đã chèn.
    requestAnimationFrame(() => {
      const target = el;
      let seen = 0;
      let pos = out.length;
      for (let i = 0; i < out.length; i += 1) {
        if (/\d/.test(out[i])) seen += 1;
        if (seen >= digitsBeforeCaret) {
          pos = i + 1;
          break;
        }
      }
      try {
        target.setSelectionRange(pos, pos);
      } catch {
        // input không hỗ trợ selection — bỏ qua
      }
    });
  };

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

  const loadData = async () => {
    // DEV preview (?xem-truoc=1): render view-mode with sample data, no API.
    // Delete with mock-preview.ts once the real backend works.
    try {
      if (new URLSearchParams(window.location.search).get("xem-truoc") === "1") {
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
    try {
      const data = await hoSoApi.getMyHoSo();
      if (data) {
        setHoSo(data);
        populateForm(data);
        setIsEditing(false);
      }
    } catch {
      // 404 / Bạn chưa có hồ sơ
      setHoSo(null);
      setIsEditing(true);
      if (identity?.name) setHoTen(identity.name);
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
          if (!cancelled) setCvs(list);
        })
        .catch(() => {
          if (!cancelled) setCvs([]);
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

      if (avatarFile) await hoSoApi.uploadAvatar(profileId, avatarFile);
      else if (avatarRemoved && hoSo?.anhDaiDienUrl) await hoSoApi.deleteAvatar(profileId);

      toast.success(hoSo ? "Cập nhật hồ sơ thành công!" : "Tạo mới hồ sơ ứng viên thành công!");

      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu hồ sơ.");
    } finally {
      setSaving(false);
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
      {isMock && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          Chế độ xem trước giao diện (dữ liệu minh họa) — thao tác lưu và tải danh sách thật bị tắt cho tới khi BE hoạt động. Xóa <span className="font-mono">?xem-truoc=1</span> để dùng dữ liệu thật.
        </div>
      )}
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hồ sơ ứng viên</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin cá nhân và định hướng nghề nghiệp của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hoSo && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa hồ sơ
            </Button>
          )}
          <Link href="/tao-cv">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Tạo CV từ hồ sơ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

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

      {/* View Mode */}
      {hoSo && !isEditing && (
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {/* Card Thông tin chính */}
          <Card className="h-full md:col-span-1">
            <CardHeader className="text-center">
               <div
                 className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 bg-cover bg-center text-2xl font-bold text-primary ring-2 ring-border"
                 style={hoSo.anhDaiDienUrl ? { backgroundImage: `url("${hoSo.anhDaiDienUrl}")` } : undefined}
                 role={hoSo.anhDaiDienUrl ? "img" : undefined}
                 aria-label={hoSo.anhDaiDienUrl ? `Ảnh đại diện của ${hoSo.hoTen}` : undefined}
               >
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
              <CardTitle className="mt-4 text-xl">{hoSo.hoTen}</CardTitle>
              <CardDescription>{hoSo.viTriUngTuyen || "Chưa cập nhật vị trí"}</CardDescription>
              <div className="pt-2">
                <Badge variant={hoSo.isTimViec ? "default" : "secondary"}>
                  {hoSo.isTimViec ? "Đang tìm việc" : "Đã có việc / Tạm dừng"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 truncate">{identity?.email || "Chưa có email"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{hoSo.sdt || "Chưa có SĐT"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {hoSo.ngaySinh
                    ? new Date(hoSo.ngaySinh).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật ngày sinh"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>{hoSo.diaChi || "Chưa có địa chỉ"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {hoSo.mucLuongMongMuon
                    ? `${hoSo.mucLuongMongMuon.toLocaleString("vi-VN")} VNĐ`
                    : "Thương lượng"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chi tiết Giới thiệu & Mục tiêu */}
          <Card className="h-full md:col-span-2">
            <CardHeader>
              <CardTitle>Giới thiệu bản thân & Mục tiêu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Giới thiệu</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {hoSo.gioiThieu || "Chưa có lời giới thiệu bản thân."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4">
                <div>
                  <span className="text-xs text-muted-foreground">Giới tính</span>
                  <p className="font-medium text-foreground">{hoSo.gioiTinh || "Khác"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Mức lương mong muốn</span>
                  <p className="font-medium text-foreground">
                    {hoSo.mucLuongMongMuon
                      ? `${hoSo.mucLuongMongMuon.toLocaleString("vi-VN")} đ`
                      : "Thương lượng"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 2 — CV của tôi (existing created CV list) */}
      {hoSo && !isEditing && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">CV của tôi</CardTitle>
              <CardDescription>
                Các CV bạn đã tạo — mở, chỉnh sửa hoặc in từ trình quản lý CV.
              </CardDescription>
            </div>
            <Link href="/tao-cv">
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Tạo CV
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {cvsLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách CV...
              </div>
            ) : cvs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileText className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-medium text-foreground">Bạn chưa có CV</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Tạo CV đầu tiên từ hồ sơ của bạn để bắt đầu ứng tuyển.
                </p>
                <Link href="/tao-cv" className="mt-4">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tạo CV đầu tiên
                    <ArrowRight className="ml-2 h-4 w-4" />
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
                    <div className="flex shrink-0 items-center gap-2">
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
                  <div
                    className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 bg-cover bg-center text-xl font-semibold text-primary ring-2 ring-border"
                    style={anhDaiDienUrl ? { backgroundImage: `url("${anhDaiDienUrl}")` } : undefined}
                    role={anhDaiDienUrl ? "img" : undefined}
                    aria-label={anhDaiDienUrl ? "Xem trước ảnh đại diện" : undefined}
                  >
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
                    <label className="text-xs font-medium text-foreground">
                      Họ và tên <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Nguyễn Văn A"
                        value={hoTen}
                        onChange={(e) => setHoTen(e.target.value)}
                        required
                        className="h-10 rounded-xl border-input bg-card pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
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
                    <label className="text-xs font-medium text-foreground">Ngày sinh</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/yyyy"
                        autoComplete="bday"
                        value={ngaySinh}
                        onChange={handleNgaySinhChange}
                        onBlur={handleNgaySinhBlur}
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
                      <p className="text-xs text-destructive">Ngày không hợp lệ (dd/mm/yyyy)</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Giới tính</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={gioiTinh}
                        onChange={(e) => setGioiTinh(e.target.value)}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Địa chỉ hiện tại</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
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
                    <label className="text-xs font-medium text-foreground">Vị trí mong muốn / Chức danh</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Fullstack .NET Developer"
                        value={viTriUngTuyen}
                        onChange={(e) => setViTriUngTuyen(e.target.value)}
                        className="h-10 rounded-xl border-input bg-card pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Mức lương mong muốn (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="15.000.000"
                        aria-label="Mức lương mong muốn (VNĐ)"
                        value={mucLuongMongMuon}
                        onChange={(e) => setMucLuongMongMuon(formatVndInput(e.target.value))}
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
