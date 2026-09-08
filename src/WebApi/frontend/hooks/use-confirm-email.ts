"use client";

import { useEffect, useState } from "react";

export function useConfirmEmail(userId: string | null, code: string | null) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !userId || !code ? "error" : "loading"
  );
  const [message, setMessage] = useState(
    !userId || !code
      ? "Liên kết xác nhận không hợp lệ hoặc đã hết hạn."
      : "Đang xác thực email của bạn..."
  );

  useEffect(() => {
    if (!userId || !code) return;

    const confirmEmail = async () => {
      try {
        const res = await fetch(
          `/api/dotnet/account/confirm-email?userId=${encodeURIComponent(userId)}&code=${encodeURIComponent(code)}`
        );
        if (res.ok) {
          setStatus("success");
          setMessage("Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.");
        } else {
          setStatus("error");
          setMessage("Xác thực email thất bại. Vui lòng thử lại sau.");
        }
      } catch {
        setStatus("error");
        setMessage("Lỗi kết nối đến máy chủ.");
      }
    };

    confirmEmail();
  }, [userId, code]);

  return { status, message };
}
