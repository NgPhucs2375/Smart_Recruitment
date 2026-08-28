"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Exact codes from Domain.ValueObjects.Colour SupportedColours whitelist
const COLOURS = [
  { value: "#FF5733", label: "Red" },
  { value: "#FFC300", label: "Orange" },
  { value: "#FFFF66", label: "Yellow" },
  { value: "#CCFF99", label: "Green" },
  { value: "#6666FF", label: "Blue" },
  { value: "#9966CC", label: "Purple" },
  { value: "#999999", label: "Grey" },
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {COLOURS.map(({ value: color, label }) => {
        const isSelected = value === color;
        return (
          <button
            key={color}
            type="button"
            title={label}
            onClick={() => onChange(color)}
            className={cn(
              "relative flex size-8 items-center justify-center rounded-full transition-all",
              isSelected && "ring-2 ring-offset-2",
            )}
            style={{ backgroundColor: color, "--tw-ring-color": color } as React.CSSProperties}
          >
            {isSelected && (
              <Check className="size-4 text-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
