"use client";

import { useState } from "react";
import { requestMagicLink } from "@/lib/auth-provider";

export function useMagicLink(purpose: "Login" | "Register") {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await requestMagicLink({ email, purpose });
      if (res.success) {
        setSent(true);
      } else {
        setError(res.message || "Gửi liên kết thất bại");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSent(false);
    setEmail("");
    setError(null);
  }

  return {
    email,
    setEmail,
    sent,
    loading,
    error,
    handleSubmit,
    reset,
  };
}
