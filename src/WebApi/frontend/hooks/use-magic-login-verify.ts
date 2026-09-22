"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { magicLogin } from "@/lib/auth-provider";
import { sanitizeNext, type PortalKind } from "@/lib/portal-roles";

export function useMagicLoginVerify(
  token: string | null,
  email: string | null,
  opts?: { portal?: PortalKind; next?: string | null }
) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !token || !email ? "error" : "loading"
  );
  const [message, setMessage] = useState(
    !token || !email
      ? "Liên kết đăng nhập không hợp lệ hoặc thiếu thông tin."
      : "Đang xác thực thông tin đăng nhập..."
  );
  const [wrongPortal, setWrongPortal] = useState<PortalKind | null>(null);

  useEffect(() => {
    if (!token || !email) return;

    let isMounted = true;

    const processMagicLogin = async () => {
      try {
        // Portal context preserved frontend-only (?next= allowlist + portal
        // stored by the requesting page). No backend magic-link change.
        const storedPortal =
          typeof window !== "undefined"
            ? (sessionStorage.getItem("hireai.magic.portal") as PortalKind | null)
            : null;
        const portal =
          opts?.portal ??
          (storedPortal === "candidate" || storedPortal === "employer" ? storedPortal : undefined);
        const res = await magicLogin({ email, token, portal });

        if (!isMounted) return;

        if (res.success) {
          setStatus("success");
          setMessage("Đăng nhập thành công. Đang chuyển hướng vào hệ thống...");
          const target =
            sanitizeNext(opts?.next) ??
            (typeof window !== "undefined"
              ? sanitizeNext(sessionStorage.getItem("hireai.magic.next"))
              : null) ??
            "/dashboard";
          try {
            sessionStorage.removeItem("hireai.magic.portal");
            sessionStorage.removeItem("hireai.magic.next");
          } catch {
            // ignore
          }
          setTimeout(() => {
            router.replace(target);
          }, 800);
        } else {
          setStatus("error");
          if (res.wrongPortal) setWrongPortal(res.wrongPortal);
          setMessage(res.error || "Xác thực Magic Link thất bại.");
        }
      } catch {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Lỗi kết nối đến máy chủ.");
      }
    };

    processMagicLogin();

    return () => {
      isMounted = false;
    };
  }, [token, email, router, opts?.portal, opts?.next]);

  return { status, message, wrongPortal };
}
