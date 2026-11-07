/** Snapshot of API v2 after the July 2025 administrative merge. */
export const vietnamProvinces = [
  'Thành phố Hà Nội', 'Tỉnh Cao Bằng', 'Tỉnh Tuyên Quang', 'Tỉnh Điện Biên',
  'Tỉnh Lai Châu', 'Tỉnh Sơn La', 'Tỉnh Lào Cai', 'Tỉnh Thái Nguyên',
  'Tỉnh Lạng Sơn', 'Thành phố Quảng Ninh', 'Thành phố Bắc Ninh', 'Tỉnh Phú Thọ',
  'Thành phố Hải Phòng', 'Tỉnh Hưng Yên', 'Tỉnh Ninh Bình', 'Tỉnh Thanh Hóa',
  'Tỉnh Nghệ An', 'Tỉnh Hà Tĩnh', 'Tỉnh Quảng Trị', 'Thành phố Huế',
  'Thành phố Đà Nẵng', 'Tỉnh Quảng Ngãi', 'Tỉnh Gia Lai', 'Tỉnh Khánh Hòa',
  'Tỉnh Đắk Lắk', 'Tỉnh Lâm Đồng', 'Thành phố Đồng Nai', 'Thành phố Hồ Chí Minh',
  'Tỉnh Tây Ninh', 'Tỉnh Đồng Tháp', 'Tỉnh Vĩnh Long', 'Tỉnh An Giang',
  'Thành phố Cần Thơ', 'Tỉnh Cà Mau',
] as const;

export type VietnamProvince = (typeof vietnamProvinces)[number];

function key(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    .replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const aliases: Record<string, VietnamProvince> = {
  hanoi: 'Thành phố Hà Nội', tphcm: 'Thành phố Hồ Chí Minh', tphochiminh: 'Thành phố Hồ Chí Minh',
  hcm: 'Thành phố Hồ Chí Minh', hochiminh: 'Thành phố Hồ Chí Minh', hochiminhcity: 'Thành phố Hồ Chí Minh',
  saigon: 'Thành phố Hồ Chí Minh', binhduong: 'Thành phố Hồ Chí Minh', bariavungtau: 'Thành phố Hồ Chí Minh',
  danang: 'Thành phố Đà Nẵng', quangnam: 'Thành phố Đà Nẵng',
  haiphong: 'Thành phố Hải Phòng', haiduong: 'Thành phố Hải Phòng',
  cantho: 'Thành phố Cần Thơ', soctrang: 'Thành phố Cần Thơ', haugiang: 'Thành phố Cần Thơ',
  dongnai: 'Thành phố Đồng Nai', binhphuoc: 'Thành phố Đồng Nai',
  quangninh: 'Thành phố Quảng Ninh', bacninh: 'Thành phố Bắc Ninh', bacgiang: 'Thành phố Bắc Ninh',
  hue: 'Thành phố Huế', thuathienhue: 'Thành phố Huế',
  daknong: 'Tỉnh Lâm Đồng', binhthuan: 'Tỉnh Lâm Đồng', phuyen: 'Tỉnh Đắk Lắk',
  binhdinh: 'Tỉnh Gia Lai', ninhthuan: 'Tỉnh Khánh Hòa', yenbai: 'Tỉnh Lào Cai', hagiang: 'Tỉnh Tuyên Quang',
  backan: 'Tỉnh Thái Nguyên', vinhphuc: 'Tỉnh Phú Thọ', thaibinh: 'Tỉnh Hưng Yên',
  namdinh: 'Tỉnh Ninh Bình', hanam: 'Tỉnh Ninh Bình', quangbinh: 'Tỉnh Quảng Trị', kontum: 'Tỉnh Quảng Ngãi',
  longan: 'Tỉnh Tây Ninh', tiengiang: 'Tỉnh Đồng Tháp', travinh: 'Tỉnh Vĩnh Long', bentre: 'Tỉnh Vĩnh Long',
  kiengiang: 'Tỉnh An Giang', baclieu: 'Tỉnh Cà Mau',
};

const direct = new Map<string, VietnamProvince>(vietnamProvinces.map((province) => [key(province), province]));

export function canonicalProvince(value: string | null | undefined): VietnamProvince | '' {
  const normalized = key(value ?? '');
  return aliases[normalized] ?? direct.get(normalized) ?? '';
}

export function provinceFromAddress(value: string | null | undefined): VietnamProvince | '' {
  const segments = (value ?? '').split(/[,;|]/).map((part) => part.trim()).reverse();
  for (const segment of segments) {
    const province = canonicalProvince(segment);
    if (province) return province;
  }
  const normalized = key(value ?? '');
  const alias = Object.entries(aliases).find(([name]) => name.length >= 3 && normalized.includes(name));
  return alias?.[1] ?? '';
}

export function composeAddress(detail: string, province: VietnamProvince | ''): string {
  return [detail.trim(), province].filter(Boolean).join(', ');
}

export function addressDetail(value: string, province: VietnamProvince | ''): string {
  return value.split(/[,;|]/).map((part) => part.trim()).filter(Boolean)
    .filter((part) => !province || canonicalProvince(part) !== province).join(', ');
}

export function normalizeAddressProvince(value: string | null | undefined): string {
  const address = value?.trim() ?? '';
  const province = provinceFromAddress(address);
  if (!province) return address;
  const parts = address.split(/[,;|]/).map((part) => part.trim()).filter(Boolean);
  const detail = parts.filter((part) => !canonicalProvince(part));
  return [...detail, province].join(', ');
}
