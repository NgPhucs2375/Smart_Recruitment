import { FormField, FormSelect } from '@/features/hr/components/form-field';
import { composeAddress, provinceFromAddress, addressDetail, vietnamProvinces } from '@/features/location/vietnam-provinces';

export function ProvinceAddressFields({
  value,
  onChange,
  disabled,
  invalid,
  errorText,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  errorText?: string;
}) {
  const province = provinceFromAddress(value);
  const detail = addressDetail(value, province);
  const options = vietnamProvinces.map((name) => ({ value: name, label: name }));
  return (
    <>
      <FormSelect
        label="Tỉnh/thành phố"
        value={province}
        placeholder="Chọn tỉnh/thành phố"
        options={options}
        disabled={disabled}
        invalid={invalid}
        errorText={errorText}
        onSelect={(next) => onChange(composeAddress(detail, next as (typeof vietnamProvinces)[number]))}
      />
      <FormField
        label="Địa chỉ chi tiết (không bắt buộc)"
        value={detail}
        editable={!disabled}
        onChangeText={(next) => onChange(composeAddress(next, province))}
        maxLength={220}
        placeholder="Số nhà, đường, phường/xã"
      />
    </>
  );
}
