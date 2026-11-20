"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProvinceSelect } from "@/components/ui/province-select";
import { canonicalProvince, provinceFromAddress, replaceAddressProvince } from "@/features/location/vietnam-provinces";

// Địa chỉ lưu dạng "<chi tiết>, <Tỉnh>". Tách phần chi tiết bằng cách cắt đuôi
// thay vì trim/split mỗi keystroke — nếu không, dấu cách vừa gõ bị xoá ngay.
function detailFromAddress(value: string, province: string) {
  if (!province) return value;
  const cut = value.lastIndexOf(",");
  if (cut < 0) return canonicalProvince(value) === province ? "" : value;
  // So khớp theo canonical: chuỗi có thể chứa tên ngắn ("Hà Nội") trong khi
  // province là tên đầy đủ ("Thành phố Hà Nội").
  if (canonicalProvince(value.slice(cut + 1)) === province) return value.slice(0, cut);
  return value
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => canonicalProvince(part) !== province)
    .join(", ");
}

function joinAddress(detail: string, province: string) {
  if (!province) return detail;
  return detail ? `${detail}, ${province}` : province;
}

export function ProvinceAddressFields({
  id,
  value,
  onChange,
  disabled,
  required,
  label = "Tỉnh/thành phố",
  detailLabel = "Địa chỉ chi tiết",
  placeholder = "Số nhà, đường, phường/xã",
  fieldClassName,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  detailLabel?: string;
  placeholder?: string;
  fieldClassName?: string;
}) {
  const province = provinceFromAddress(value);
  const detail = detailFromAddress(value, province);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${id}-province`}>
          {label}
          {required && <span aria-hidden className="ml-0.5 text-red-500">*</span>}
        </Label>
        <ProvinceSelect
          id={`${id}-province`}
          value={province}
          disabled={disabled}
          triggerClassName={fieldClassName}
          onValueChange={(next) => onChange(replaceAddressProvince(value, next))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-detail`}>
          {detailLabel}
          {required && <span aria-hidden className="ml-0.5 text-red-500">*</span>}
        </Label>
        <Input
          id={`${id}-detail`}
          value={detail}
          disabled={disabled}
          maxLength={255}
          placeholder={placeholder}
          onChange={(event) => onChange(joinAddress(event.target.value, province))}
          className={fieldClassName}
        />
      </div>
    </div>
  );
}
