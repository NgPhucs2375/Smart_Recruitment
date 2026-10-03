"use client";

import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** 16 màu nhanh thông dụng. */
export const QUICK_SWATCHES = [
  "#1e293b",
  "#047857",
  "#1d4ed8",
  "#881337",
  "#4338ca",
  "#111827",
  "#e11d48",
  "#64748b",
  "#f59e0b",
  "#06b6d4",
  "#0d9488",
  "#65a30d",
  "#ea580c",
  "#0284c7",
  "#7c3aed",
  "#78716c",
];

function parseAlpha(color: string): number {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(color.trim());
  if (m) return Math.round((Number.parseInt(m[2], 16) / 255) * 100) / 100;
  if (/^#([0-9a-f]{6})$/i.test(color.trim())) return 1;
  const r = /rgba?\([\d\s.,/]+\)/i.exec(color.trim());
  if (r) {
    const nums = r[0]
      .replace(/[^0-9.,/]/g, "")
      .split(/[,/]/)
      .map(Number);
    const a = nums[3];
    if (Number.isFinite(a)) return a <= 1 ? a : a / 100;
  }
  return 1;
}

function baseHex(color: string): string {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color.trim());
  if (m) return `#${m[1]}`;
  const r = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color.trim());
  if (r) {
    const to = (n: number) =>
      Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return `#${to(Number(r[1]))}${to(Number(r[2]))}${to(Number(r[3]))}`;
  }
  return "#1e293b";
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${baseHex(hex)}${alpha >= 1 ? "" : a}`;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** Hiện slider độ trong suốt (chỉ cho zones nền). */
  alpha?: boolean;
}

/** Hàng chọn màu: swatch → popover (picker + input color + swatches + hex + opacity). */
export function ColorField({
  label,
  value,
  onChange,
  alpha = false,
}: ColorFieldProps) {
  const hex = baseHex(value);
  const a = parseAlpha(value);

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Chọn ${label}`}
            title={`Chọn ${label}`}
            className="size-9 shrink-0 cursor-pointer rounded-lg border border-border"
            style={{ backgroundColor: value }}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto space-y-2.5 p-3">
          <HexColorPicker
            color={hex}
            onChange={(next) => onChange(alpha ? withAlpha(next, a) : next)}
          />
          <input
            type="color"
            aria-label={`${label} (chọn nhanh)`}
            value={hex}
            onChange={(e) =>
              onChange(alpha ? withAlpha(e.target.value, a) : e.target.value)
            }
            className="h-32 w-full cursor-pointer rounded-md border border-border bg-card"
          />
          <div
            className="grid grid-cols-8 gap-1"
            role="group"
            aria-label="Màu nhanh"
          >
            {QUICK_SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Màu ${s}`}
                title={s}
                onClick={() => onChange(alpha ? withAlpha(s, a) : s)}
                className="size-6 rounded-md border border-border transition hover:scale-110"
                style={{ backgroundColor: s }}
              />
            ))}
          </div>
          {alpha && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label className="text-xs">Độ trong suốt</Label>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {Math.round(a * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={a}
                onChange={(e) =>
                  onChange(withAlpha(hex, Number(e.target.value)))
                }
                className="w-full accent-primary"
                aria-label="Độ trong suốt"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
      <div className="min-w-0 flex-1">
        <Label className="text-xs">{label}</Label>
        <Input
          value={value}
          maxLength={9}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 h-8 font-mono text-xs"
        />
      </div>
    </div>
  );
}
