/** Snapshot from https://provinces.open-api.vn/api/v2/?depth=1 (post-07/2025). */
export const vietnamProvinces = [
  "Thành phố Hà Nội", "Tỉnh Cao Bằng", "Tỉnh Tuyên Quang", "Tỉnh Điện Biên",
  "Tỉnh Lai Châu", "Tỉnh Sơn La", "Tỉnh Lào Cai", "Tỉnh Thái Nguyên",
  "Tỉnh Lạng Sơn", "Thành phố Quảng Ninh", "Thành phố Bắc Ninh", "Tỉnh Phú Thọ",
  "Thành phố Hải Phòng", "Tỉnh Hưng Yên", "Tỉnh Ninh Bình", "Tỉnh Thanh Hóa",
  "Tỉnh Nghệ An", "Tỉnh Hà Tĩnh", "Tỉnh Quảng Trị", "Thành phố Huế",
  "Thành phố Đà Nẵng", "Tỉnh Quảng Ngãi", "Tỉnh Gia Lai", "Tỉnh Khánh Hòa",
  "Tỉnh Đắk Lắk", "Tỉnh Lâm Đồng", "Thành phố Đồng Nai", "Thành phố Hồ Chí Minh",
  "Tỉnh Tây Ninh", "Tỉnh Đồng Tháp", "Tỉnh Vĩnh Long", "Tỉnh An Giang",
  "Thành phố Cần Thơ", "Tỉnh Cà Mau",
] as const;

export type VietnamProvince = (typeof vietnamProvinces)[number];

/** Tên địa danh gọn để hiển thị; giá trị chuẩn vẫn giữ nguyên cho API. */
export function provinceDisplayName(province: string): string {
  return province.replace(/^(?:Tỉnh|Thành phố)\s+/i, "");
}

function key(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const aliases: Record<string, VietnamProvince> = {
  hanoi: "Thành phố Hà Nội", thanhphohochiminh: "Thành phố Hồ Chí Minh",
  hochiminh: "Thành phố Hồ Chí Minh", hochiminhcity: "Thành phố Hồ Chí Minh",
  tphcm: "Thành phố Hồ Chí Minh", tphochiminh: "Thành phố Hồ Chí Minh",
  hcm: "Thành phố Hồ Chí Minh", saigon: "Thành phố Hồ Chí Minh",
  binhduong: "Thành phố Hồ Chí Minh", bariavungtau: "Thành phố Hồ Chí Minh",
  danang: "Thành phố Đà Nẵng", quangnam: "Thành phố Đà Nẵng",
  haiphong: "Thành phố Hải Phòng", haiduong: "Thành phố Hải Phòng",
  cantho: "Thành phố Cần Thơ", soctrang: "Thành phố Cần Thơ", haugiang: "Thành phố Cần Thơ",
  dongnai: "Thành phố Đồng Nai", binhphuoc: "Thành phố Đồng Nai",
  quangninh: "Thành phố Quảng Ninh", thanhphoquangninh: "Thành phố Quảng Ninh",
  thanhphobacninh: "Thành phố Bắc Ninh", bacgiang: "Thành phố Bắc Ninh",
  thanhphohue: "Thành phố Huế", thuathienhue: "Thành phố Huế",
  daknong: "Tỉnh Lâm Đồng", binhthuan: "Tỉnh Lâm Đồng", lamdong: "Tỉnh Lâm Đồng",
  daklak: "Tỉnh Đắk Lắk", phuyen: "Tỉnh Đắk Lắk",
  gialai: "Tỉnh Gia Lai", binhdinh: "Tỉnh Gia Lai",
  khanhhoa: "Tỉnh Khánh Hòa", ninhthuan: "Tỉnh Khánh Hòa",
  laocai: "Tỉnh Lào Cai", yenbai: "Tỉnh Lào Cai",
  tuyenquang: "Tỉnh Tuyên Quang", hagiang: "Tỉnh Tuyên Quang",
  thainguyen: "Tỉnh Thái Nguyên", backan: "Tỉnh Thái Nguyên",
  phutho: "Tỉnh Phú Thọ", vinhphuc: "Tỉnh Phú Thọ",
  hungyen: "Tỉnh Hưng Yên", thaibinh: "Tỉnh Hưng Yên",
  ninhbinh: "Tỉnh Ninh Bình", namdinh: "Tỉnh Ninh Bình", hanam: "Tỉnh Ninh Bình",
  quangtri: "Tỉnh Quảng Trị", quangbinh: "Tỉnh Quảng Trị",
  quangngai: "Tỉnh Quảng Ngãi", kontum: "Tỉnh Quảng Ngãi",
  dongthap: "Tỉnh Đồng Tháp", tiengiang: "Tỉnh Đồng Tháp",
  vinhlong: "Tỉnh Vĩnh Long", travinh: "Tỉnh Vĩnh Long", bentre: "Tỉnh Vĩnh Long",
  angiang: "Tỉnh An Giang", kiengiang: "Tỉnh An Giang",
  camau: "Tỉnh Cà Mau", baclieu: "Tỉnh Cà Mau",
  tayninh: "Tỉnh Tây Ninh", longan: "Tỉnh Tây Ninh",
};

const provinceByKey = new Map<string, VietnamProvince>(vietnamProvinces.map((name) => [key(name), name]));

export function canonicalProvince(value: string | null | undefined): VietnamProvince | "" {
  const normalized = key(value?.trim() ?? "");
  if (!normalized) return "";
  if (aliases[normalized]) return aliases[normalized];
  const direct = provinceByKey.get(normalized);
  if (direct) return direct;
  for (const [candidate, province] of provinceByKey) {
    if (normalized === candidate.replace(/^(tinh|thanhpho)/, "")) return province;
  }
  return "";
}

export function provinceFromAddress(address: string | null | undefined): VietnamProvince | "" {
  const parts = (address ?? "").split(/[,;|]/).map((part) => part.trim()).filter(Boolean);
  for (const part of [...parts].reverse()) {
    const province = canonicalProvince(part);
    if (province) return province;
  }
  const normalized = key(address ?? "");
  for (const [alias, province] of Object.entries(aliases)) {
    if (alias.length >= 3 && normalized.includes(alias)) return province;
  }
  return "";
}

export function replaceAddressProvince(address: string, province: VietnamProvince): string {
  const parts = address.split(/[,;|]/).map((part) => part.trim()).filter(Boolean);
  const provinceIndex = parts.findIndex((part) => Boolean(canonicalProvince(part)));
  const detail = provinceIndex >= 0 ? parts.filter((_, index) => index !== provinceIndex) : parts;
  return [...detail, province].join(", ");
}

export function normalizeAddressProvince(address: string | null | undefined): string {
  const value = address?.trim() ?? "";
  const province = provinceFromAddress(value);
  return province ? replaceAddressProvince(value, province) : value;
}
