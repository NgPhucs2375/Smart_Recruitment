"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock, Shield } from "lucide-react";
import { toast } from "sonner";

export default function LienHePage() {
  const [sent, setSent] = useState(false);
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
    toast.success("Đã gửi liên hệ", { description: "Chúng tôi phản hồi trong 24h qua email." });
  }
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/10 bg-white px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">HIRE<span className="text-foreground">AI</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Về trang chủ</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-white px-3 py-1 text-xs font-medium"><Mail className="size-3.5" /> Liên hệ • Phản hồi 24h</div>
            <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em]">Liên hệ HIREAI</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Hỗ trợ ứng viên, nhà tuyển dụng và khiếu nại pháp lý. Chọn kênh phù hợp — chúng tôi cam kết minh bạch theo Quy chế sàn.</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/10 bg-white p-5">
                <Phone className="size-5 text-foreground" />
                <p className="mt-3 text-sm font-semibold">Hotline</p>
                <p className="mt-1 text-sm"><a href="tel:1900636890" className="font-medium hover:underline">1900 636 890</a></p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> 8:00–18:00 T2–T6</p>
              </div>
              <div className="rounded-2xl border border-border/10 bg-white p-5">
                <Mail className="size-5 text-foreground" />
                <p className="mt-3 text-sm font-semibold">Email</p>
                <p className="mt-1 text-xs leading-5"><a href="mailto:support@hireai.vn" className="hover:underline">support@hireai.vn</a><br /><a href="mailto:legal@hireai.vn" className="hover:underline">legal@hireai.vn</a></p>
              </div>
              <div className="rounded-2xl border border-border/10 bg-white p-5">
                <MapPin className="size-5 text-foreground" />
                <p className="mt-3 text-sm font-semibold">Văn phòng</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Tầng 8, 123 Nguyễn Huệ, Q.1, TP.HCM<br />MST 0312345678</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
              <span className="flex items-center gap-1.5 font-medium"><Shield className="size-3.5" /> Khiếu nại & Tranh chấp</span>
              Gửi tới <b>legal@hireai.vn</b> hoặc gọi hotline. Xử lý theo <Link href="/quy-che#co-che-giai-quyet" className="underline">cơ chế 3 bước</Link> trong 14 ngày.
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold">Gửi tin nhắn</h2>
            <p className="mt-1 text-sm text-muted-foreground">Phản hồi qua email trong 24h. Với khiếu nại pháp lý, vui lòng ghi “KHIEU NAI” ở tiêu đề.</p>
            {sent ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                ✅ Cảm ơn bạn! Tin nhắn đã được gửi. Mã ticket sẽ gửi qua email.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Họ tên</span>
                    <input required placeholder="Nguyễn Văn A" className="h-10 w-full rounded-xl border border-border/15 bg-background px-3 text-sm outline-none focus:border-border/40" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Email</span>
                    <input required type="email" placeholder="ban@congty.vn" className="h-10 w-full rounded-xl border border-border/15 bg-background px-3 text-sm outline-none focus:border-border/40" />
                  </label>
                </div>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Chủ đề</span>
                  <select className="h-10 w-full rounded-xl border border-border/15 bg-background px-3 text-sm outline-none focus:border-border/40">
                    <option>Hỗ trợ tài khoản</option>
                    <option>Báo tin tuyển dụng vi phạm</option>
                    <option>Khiếu nại / Tranh chấp</option>
                    <option>Hợp tác doanh nghiệp</option>
                    <option>Khác</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Nội dung</span>
                  <textarea required rows={5} placeholder="Mô tả chi tiết vấn đề..." className="w-full rounded-xl border border-border/15 bg-background p-3 text-sm outline-none focus:border-border/40" />
                </label>
                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover">
                  <Send className="size-4" /> Gửi liên hệ
                </button>
                <p className="text-center text-xs text-muted-foreground">Bằng việc gửi, bạn đồng ý <Link href="/dieu-khoan" className="underline">Điều khoản</Link> và <Link href="/bao-mat" className="underline">Bảo mật</Link>.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
