"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProvinceSelect } from "@/components/ui/province-select";
import { canonicalProvince, provinceFromAddress, replaceAddressProvince } from "@/features/location/vietnam-provinces";

export function ProvinceAddressFields({
  id,
  value,
  onChange,
  disabled,
  required,
  label = "Tỉnh/thành phố",
  detailLabel = "Địa chỉ chi tiết",
  placeholder = "Số nhà, đường, phường/xã",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  detailLabel?: string;
  placeholder?: string;
}) {
  const province = provinceFromAddress(value);
  const detail = value.split(/[,;|]/).map((part) => part.trim()).filter(Boolean)
    .filter((part) => !province || canonicalProvince(part) !== province).join(", ");
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${id}-province`}>{label}{required ? " *" : ""}</Label>
        <ProvinceSelect
          id={`${id}-province`}
          value={province}
          disabled={disabled}
          onValueChange={(next) => onChange(replaceAddressProvince(value, next))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-detail`}>{detailLabel}</Label>
        <Input
          id={`${id}-detail`}
          value={detail}
          disabled={disabled}
          maxLength={255}
          placeholder={placeholder}
          onChange={(event) => onChange([event.target.value.trim(), province].filter(Boolean).join(", "))}
        />
      </div>
    </div>
  );
}
