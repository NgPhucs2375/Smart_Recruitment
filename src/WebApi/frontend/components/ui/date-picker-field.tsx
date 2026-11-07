"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isoToVnDate, maskDateVn, vnToIsoDate } from "@/features/tao-cv/cv-data";

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  disabled,
  min,
  max,
  placeholder = "dd/MM/yyyy",
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    const picker = pickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!picker || disabled) return;
    if (picker.showPicker) picker.showPicker();
    else picker.focus();
  };

  return (
    <div className="space-y-2">
      {label && <label htmlFor={id} className="text-sm font-medium">{label}</label>}
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          maxLength={10}
          onChange={(event) => onChange(maskDateVn(event.target.value))}
          className="pr-10"
          aria-label={label}
        />
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-10 h-0 w-0 opacity-0"
          value={vnToIsoDate(value) || ""}
          min={min}
          max={max}
          onChange={(event) => {
            if (event.target.value) onChange(isoToVnDate(event.target.value));
          }}
        />
        <button
          type="button"
          aria-label={`Chọn ${label ?? "ngày"} từ lịch`}
          disabled={disabled}
          onClick={openPicker}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
        >
          <CalendarDays className="size-4" />
        </button>
      </div>
    </div>
  );
}
