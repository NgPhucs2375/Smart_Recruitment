"use client";

import { useEffect, useState } from "react";
import { refreshSession } from "@/lib/auth-provider";
import {
  acceptLoiMoi,
  getLoiMoiByToken,
  type LoiMoiNhanSu,
} from "@/lib/api/nhan-su-api";

type InvitationStatus = "loading" | "ready" | "success" | "error";

export function useInvitation(token: string | null) {
  const [status, setStatus] = useState<InvitationStatus>(token ? "loading" : "error");
  const [invitation, setInvitation] = useState<LoiMoiNhanSu | null>(null);
  const [message, setMessage] = useState(token ? "" : "Liên kết lời mời thiếu token.");
  const [accepting, setAccepting] = useState(false);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;

    getLoiMoiByToken(token)
      .then((data) => {
        if (!active) return;
        setInvitation(data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Không thể tải lời mời.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function accept() {
    if (!token || accepting) return;
    setAccepting(true);
    setMessage("");
    try {
      const successMessage = await acceptLoiMoi(token);
      const refreshed = await refreshSession();
      setSessionRefreshed(refreshed);
      setMessage(successMessage);
      setStatus("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể chấp nhận lời mời.");
    } finally {
      setAccepting(false);
    }
  }

  return { status, invitation, message, accepting, sessionRefreshed, accept };
}
