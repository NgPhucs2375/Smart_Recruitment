"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PromptOptions = ConfirmOptions & {
  placeholder?: string;
  defaultValue?: string;
};

type PendingRequest =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void };

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [value, setValue] = useState("");
  const activeResolve = useRef<((value: boolean | string | null) => void) | null>(null);

  function close(result: boolean | string | null) {
    activeResolve.current?.(result);
    activeResolve.current = null;
    setRequest(null);
    setValue("");
  }

  function openConfirm(options: ConfirmOptions) {
    return new Promise<boolean>((resolve) => {
      activeResolve.current = resolve as (value: boolean | string | null) => void;
      setRequest({ kind: "confirm", options, resolve });
    });
  }

  function openPrompt(options: PromptOptions) {
    return new Promise<string | null>((resolve) => {
      activeResolve.current = resolve as (value: boolean | string | null) => void;
      setValue(options.defaultValue ?? "");
      setRequest({ kind: "prompt", options, resolve });
    });
  }

  const options = request?.options;
  return (
    <ConfirmDialogContext.Provider value={{ confirm: openConfirm, prompt: openPrompt }}>
      {children}
      <DialogPrimitive.Root open={request !== null} onOpenChange={(open) => { if (!open) close(request?.kind === "prompt" ? null : false); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Popup className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl outline-none">
              <div className="flex items-start gap-3">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${options?.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                  <AlertTriangle className="size-5" />
                </span>
                <div className="min-w-0">
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                    {options?.title}
                  </DialogPrimitive.Title>
                  {options?.description && (
                    <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                      {options.description}
                    </DialogPrimitive.Description>
                  )}
                </div>
                <DialogPrimitive.Close aria-label="Đóng" className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </div>

              {request?.kind === "prompt" && (
                <Input
                  autoFocus
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={request.options.placeholder}
                  className="mt-5"
                />
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => close(request?.kind === "prompt" ? null : false)}>
                  {options?.cancelLabel ?? "Hủy"}
                </Button>
                <Button type="button" variant={options?.destructive ? "destructive" : "default"} onClick={() => close(request?.kind === "prompt" ? value : true)}>
                  <Check className="size-4" />
                  {options?.confirmLabel ?? "Xác nhận"}
                </Button>
              </div>
            </DialogPrimitive.Popup>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) throw new Error("useConfirmDialog must be used inside ConfirmDialogProvider");
  return context;
}
