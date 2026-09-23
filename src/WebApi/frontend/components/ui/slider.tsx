"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SliderProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "min" | "max"> & {
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: [number, number]) => void;
};

function Slider({ className, value, min, max, step = 1, onValueChange, ...props }: SliderProps) {
  const percent = (n: number) => `${((n - min) / (max - min)) * 100}%`;
  return (
    <div className={cn("relative flex h-8 w-full items-center", className)}>
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted" />
      <div className="absolute h-1.5 rounded-full bg-primary" style={{ left: percent(value[0]), right: `${100 - Number.parseFloat(percent(value[1]))}%` }} />
      <input aria-label="Mức lương tối thiểu" type="range" min={min} max={max} step={step} value={value[0]} onChange={(event) => onValueChange([Math.min(Number(event.target.value), value[1]), value[1]])} className="slider-thumb absolute inset-x-0 z-20 w-full appearance-none bg-transparent" {...props} />
      <input aria-label="Mức lương tối đa" type="range" min={min} max={max} step={step} value={value[1]} onChange={(event) => onValueChange([value[0], Math.max(Number(event.target.value), value[0])])} className="slider-thumb absolute inset-x-0 z-10 w-full appearance-none bg-transparent" {...props} />
    </div>
  );
}

export { Slider };
