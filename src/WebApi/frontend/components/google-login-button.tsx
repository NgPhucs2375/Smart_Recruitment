"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.3-2.1 3.8-5.2 3.8-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-3.7 2.9c2 3.9 6 6.7 10.5 6.7z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4L1.5 6.7C.5 8.7 0 10.3 0 12s.5 3.3 1.5 4.7l3.7-2.3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.6 1.5 6.6l3.7 2.9c1-2.8 3.7-4.9 6.8-4.9z"
      />
    </svg>
  );
}

interface Props {
  mode?: "login" | "register";
  onSuccess: (credential: string) => void;
  disabled?: boolean;
  text?: string;
  onError?: (message: string) => void;
}

export function GoogleLoginButton({
  mode = "login",
  onSuccess,
  disabled,
  text = "Đăng nhập với Google",
  onError,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [buttonWidth, setButtonWidth] = useState<string>();

  useEffect(() => {
    const element = wrapperRef.current;

    if (!element) return;

    const updateWidth = () => {
      const width = Math.floor(element.getBoundingClientRect().width);

      if (width > 0) {
        setButtonWidth(String(width));
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (CLIENT_ID) {
    return (
      <div
        ref={wrapperRef}
        className={`
          flex min-h-11
          w-full max-w-full
          items-center justify-center
          overflow-hidden
          rounded-xl
          bg-white
          ${disabled ? "pointer-events-none opacity-50" : ""}
        `}
      >
        {buttonWidth && (
          <GoogleLogin
            type="standard"
            theme="outline"
            size="large"
            text={
              mode === "register"
                ? "signup_with"
                : "continue_with"
            }
            shape="rectangular"
            logo_alignment="left"
            width={buttonWidth}
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                onSuccess(credentialResponse.credential);
              } else {
                onError?.(
                  "Đăng nhập Google thất bại (thiếu credential)."
                );
              }
            }}
            onError={() =>
              onError?.(
                "Đăng nhập Google thất bại. Vui lòng thử lại."
              )
            }
            useOneTap={false}
          />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        onError?.(
          "Đăng nhập Google chưa được cấu hình (thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID)."
        )
      }
      className="
        flex h-11
        w-full max-w-full
        items-center justify-center gap-2
        rounded-xl border border-border
        bg-white px-4
        text-sm font-medium text-foreground
        shadow-sm transition
        hover:-translate-y-px
        hover:border-primary/35
        hover:bg-muted/50
        hover:shadow-md
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      <GoogleMark />
      {text}
    </button>
  );
}