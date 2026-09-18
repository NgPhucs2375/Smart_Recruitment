import React, { useMemo, useState } from "react";
import { Card, Col, Row, Statistic, Tag, Tooltip } from "antd";
import {
  EnvironmentOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
 
import vietnam from "@svg-maps/vietnam";
 
interface Province {
  id: string;
  name: string;
  path: string;
}
 
interface RegionStatistic {
  regionId: string;
  regionName: string;
  total: number;
}
 
interface VietnamRegionMapProps {
  data?: RegionStatistic[];
  onRegionClick?: (regionId: string) => void;
}

interface RegionLabelPosition {
  left: string;
  top: string;
}
 
/**
* Map tỉnh/thành -> 7 khu vực nghiệp vụ.
*
* Bạn có thể thay đổi mapping này theo quy ước
* phân vùng thực tế của Vietbank.
*/
const PROVINCE_REGION_MAP: Record<string, string> = {
  // =====================================================
  // 1. TRUNG DU VÀ MIỀN NÚI PHÍA BẮC
  // =====================================================
  "ha-giang": "north_mountain",
  "cao-bang": "north_mountain",
  "bac-kan": "north_mountain",
  "tuyen-quang": "north_mountain",
  "lao-cai": "north_mountain",
  "yen-bai": "north_mountain",
  "thai-nguyen": "north_mountain",
  "lang-son": "north_mountain",
  "bac-giang": "north_mountain",
  "phu-tho": "north_mountain",
  "dien-bien": "north_mountain",
  "lai-chau": "north_mountain",
  "son-la": "north_mountain",
  "hoa-binh": "north_mountain",
 
  // =====================================================
  // 2. ĐỒNG BẰNG SÔNG HỒNG
  // =====================================================
  "ha-noi": "red_river",
  "hai-phong": "red_river",
  "quang-ninh": "red_river",
  "hai-duong": "red_river",
  "hung-yen": "red_river",
  "thai-binh": "red_river",
  "ha-nam": "red_river",
  "nam-dinh": "red_river",
  "ninh-binh": "red_river",
  "vinh-phuc": "red_river",
  "bac-ninh": "red_river",
 
  // =====================================================
  // 3. BẮC TRUNG BỘ
  // =====================================================
  "thanh-hoa": "north_central",
  "nghe-an": "north_central",
  "ha-tinh": "north_central",
  "quang-binh": "north_central",
  "quang-tri": "north_central",
  "thua-thien-hue": "north_central",
 
  // =====================================================
  // 4. NAM TRUNG BỘ
  // =====================================================
  "da-nang": "south_central",
  "quang-nam": "south_central",
  "quang-ngai": "south_central",
  "binh-dinh": "south_central",
  "phu-yen": "south_central",
  "khanh-hoa": "south_central",
  "ninh-thuan": "south_central",
  "binh-thuan": "south_central",
 
  // =====================================================
  // 5. TÂY NGUYÊN
  // =====================================================
  "kon-tum": "central_highlands",
  "gia-lai": "central_highlands",
  "dak-lak": "central_highlands",
  "dak-nong": "central_highlands",
  "lam-dong": "central_highlands",
 
  // =====================================================
  // 6. ĐÔNG NAM BỘ
  // =====================================================
  "ho-chi-minh": "southeast",
  "ba-ria-vung-tau": "southeast",
  "dong-nai": "southeast",
  "binh-duong": "southeast",
  "binh-phuoc": "southeast",
  "tay-ninh": "southeast",
 
  // =====================================================
  // 7. ĐỒNG BẰNG SÔNG CỬU LONG
  // =====================================================
  "long-an": "mekong",
  "tien-giang": "mekong",
  "ben-tre": "mekong",
  "tra-vinh": "mekong",
  "vinh-long": "mekong",
  "dong-thap": "mekong",
  "an-giang": "mekong",
  "kien-giang": "mekong",
  "can-tho": "mekong",
  "hau-giang": "mekong",
  "soc-trang": "mekong",
  "bac-lieu": "mekong",
  "ca-mau": "mekong",
};
 
const REGION_INFO: Record<
  string,
  {
    name: string;
    shortName: string;
  }
> = {
  north_mountain: {
    name: "Trung du và miền núi phía Bắc",
    shortName: "Miền núi phía Bắc",
  },
 
  red_river: {
    name: "Đồng bằng sông Hồng",
    shortName: "Đồng bằng sông Hồng",
  },
 
  north_central: {
    name: "Bắc Trung Bộ",
    shortName: "Bắc Trung Bộ",
  },
 
  south_central: {
    name: "Duyên hải Nam Trung Bộ",
    shortName: "Nam Trung Bộ",
  },
 
  central_highlands: {
    name: "Tây Nguyên",
    shortName: "Tây Nguyên",
  },
 
  southeast: {
    name: "Đông Nam Bộ",
    shortName: "Đông Nam Bộ",
  },
 
  mekong: {
    name: "Đồng bằng sông Cửu Long",
    shortName: "ĐBS Cửu Long",
  },
};
 
const DEFAULT_DATA: RegionStatistic[] = [
  {
    regionId: "north_mountain",
    regionName: "Trung du và miền núi phía Bắc",
    total: 1245,
  },
  {
    regionId: "red_river",
    regionName: "Đồng bằng sông Hồng",
    total: 2340,
  },
  {
    regionId: "north_central",
    regionName: "Bắc Trung Bộ",
    total: 1680,
  },
  {
    regionId: "south_central",
    regionName: "Duyên hải Nam Trung Bộ",
    total: 1120,
  },
  {
    regionId: "central_highlands",
    regionName: "Tây Nguyên",
    total: 980,
  },
  {
    regionId: "southeast",
    regionName: "Đông Nam Bộ",
    total: 3420,
  },
  {
    regionId: "mekong",
    regionName: "Đồng bằng sông Cửu Long",
    total: 2120,
  },
];

/**
 * Vị trí nhãn theo phần trăm của khung SVG.
 * Dùng phần trăm để nhãn vẫn bám theo bản đồ khi responsive.
 */
const REGION_LABEL_POSITIONS: Record<string, RegionLabelPosition> = {
  north_mountain: { left: "43%", top: "9%" },
  red_river: { left: "60%", top: "20%" },
  north_central: { left: "55%", top: "31%" },
  south_central: { left: "60%", top: "45%" },
  central_highlands: { left: "42%", top: "48%" },
  southeast: { left: "50%", top: "64%" },
  mekong: { left: "43%", top: "81%" },
};
 
export const VietnamRegionMap: React.FC<VietnamRegionMapProps> = ({
  data = DEFAULT_DATA,
  onRegionClick,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(
    null
  );
 
  /**
   * Convert data thành dictionary để lookup nhanh.
   */
  const statistics = useMemo(() => {
    return data.reduce<Record<string, number>>((acc, item) => {
      acc[item.regionId] = item.total;
      return acc;
    }, {});
  }, [data]);
 
  /**
   * Tổng hồ sơ.
   */
  const totalRecords = useMemo(() => {
    return data.reduce((sum, item) => sum + item.total, 0);
  }, [data]);
 
  /**
   * Max để tính màu.
   */
  const maxRecords = useMemo(() => {
    return Math.max(...data.map((item) => item.total), 1);
  }, [data]);
 
  /**
   * Lấy số hồ sơ của region.
   */
  const getRegionTotal = (regionId: string) => {
    return statistics[regionId] || 0;
  };
 
  /**
   * Màu theo số lượng hồ sơ.
   */
  const getRegionColor = (regionId: string) => {
    const total = getRegionTotal(regionId);
 
    if (total === 0) {
      return "#E5E7EB";
    }
 
    const ratio = total / maxRecords;
 
    if (ratio >= 0.8) return "#1677ff";
    if (ratio >= 0.6) return "#4096ff";
    if (ratio >= 0.4) return "#69b1ff";
    if (ratio >= 0.2) return "#91caff";
 
    return "#bae0ff";
  };
 
  /**
   * Tạo map provinces.
   */
  const provinces = vietnam.locations as Province[];
 
  return (
<Card
      title={
<div className="flex items-center gap-2">
<EnvironmentOutlined />
<span>Hồ sơ theo khu vực</span>
</div>
      }
      className="w-full"
>
      {/* =====================================================
          SUMMARY
      ====================================================== */}
<Row gutter={[16, 16]} className="mb-6">
<Col xs={24} sm={12} lg={6}>
<Card size="small">
<Statistic
              title="Tổng số hồ sơ"
              value={totalRecords}
              prefix={<FileTextOutlined />}
              formatter={(value) =>
                Number(value).toLocaleString("vi-VN")
              }
            />
</Card>
</Col>
 
        {data.slice(0, 3).map((item) => (
<Col xs={24} sm={12} lg={6} key={item.regionId}>
<Card size="small">
<Statistic
                title={
                  REGION_INFO[item.regionId]?.shortName ||
                  item.regionName
                }
                value={item.total}
                formatter={(value) =>
                  Number(value).toLocaleString("vi-VN")
                }
              />
</Card>
</Col>
        ))}
</Row>
 
      {/* =====================================================
          MAP
      ====================================================== */}
<div className="relative w-full overflow-hidden">
<svg
          viewBox={vietnam.viewBox}
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
>
          {provinces.map((province) => {
            const regionId = PROVINCE_REGION_MAP[province.id];
 
            if (!regionId) {
              return (
<path
                  key={province.id}
                  d={province.path}
                  fill="#F3F4F6"
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                />
              );
            }
 
            const total = getRegionTotal(regionId);
            const isHovered = hoveredRegion === regionId;
 
            return (
<Tooltip
                key={province.id}
                title={
<div>
<div className="font-semibold">
                      {province.name}
</div>
 
                    <div>
                      Khu vực:{" "}
                      {REGION_INFO[regionId]?.shortName}
</div>
 
                    <div>
                      Hồ sơ:{" "}
<strong>
                        {total.toLocaleString("vi-VN")}
</strong>
</div>
</div>
                }
>
<path
                  d={province.path}
                  fill={getRegionColor(regionId)}
                  stroke="#FFFFFF"
                  strokeWidth={0.6}
                  style={{
                    cursor: "pointer",
                    transition:
                      "all 0.2s ease",
                    opacity:
                      hoveredRegion &&
                      hoveredRegion !== regionId
                        ? 0.45
                        : 1,
                    filter: isHovered
                      ? "brightness(0.9)"
                      : undefined,
                  }}
                  onMouseEnter={() =>
                    setHoveredRegion(regionId)
                  }
                  onMouseLeave={() =>
                    setHoveredRegion(null)
                  }
                  onClick={() =>
                    onRegionClick?.(regionId)
                  }
                />
</Tooltip>
            );
          })}
</svg>
 
        {/* =====================================================
            REGION TOTAL LABELS
        ====================================================== */}
        <div className="pointer-events-none absolute inset-0">
          {data.map((item) => {
            const position = REGION_LABEL_POSITIONS[item.regionId];

            if (!position) {
              return null;
            }

            const info = REGION_INFO[item.regionId];
            const isActive = hoveredRegion === item.regionId;

            return (
              <div
                key={`label-${item.regionId}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-center shadow-md transition-all duration-200 ${
                  isActive
                    ? "z-10 scale-110 border-blue-700 bg-blue-700 text-white"
                    : "border-white/90 bg-white/95 text-slate-700"
                }`}
                style={position}
                aria-label={`${info?.name || item.regionName}: ${item.total.toLocaleString(
                  "vi-VN"
                )} hồ sơ`}
              >
                <div className="text-[10px] font-medium leading-tight">
                  {info?.shortName || item.regionName}
                </div>
                <div
                  className={`text-sm font-bold leading-tight ${
                    isActive ? "text-white" : "text-blue-700"
                  }`}
                >
                  {item.total.toLocaleString("vi-VN")} hồ sơ
                </div>
              </div>
            );
          })}
        </div>
</div>
 
      {/* =====================================================
          LEGEND / REGION LIST
      ====================================================== */}
<div className="mt-6">
<Row gutter={[12, 12]}>
          {data.map((item) => {
            const info = REGION_INFO[item.regionId];
 
            const isActive =
              hoveredRegion === item.regionId;
 
            return (
<Col
                xs={24}
                sm={12}
                lg={8}
                xl={6}
                key={item.regionId}
>
<div
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isActive
                      ? "border-blue-400 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white"
                  }`}
                  onMouseEnter={() =>
                    setHoveredRegion(item.regionId)
                  }
                  onMouseLeave={() =>
                    setHoveredRegion(null)
                  }
                  onClick={() =>
                    onRegionClick?.(item.regionId)
                  }
>
<div className="flex items-center justify-between gap-2">
<div className="min-w-0">
<div className="truncate text-sm font-medium">
                        {info?.shortName ||
                          item.regionName}
</div>
 
                      <div className="mt-1 text-xs text-gray-500">
                        {item.regionName}
</div>
</div>
 
                    <Tag color="blue">
                      {item.total.toLocaleString("vi-VN")}
</Tag>
</div>
</div>
</Col>
            );
          })}
</Row>
</div>
</Card>
  );
};
 
export default VietnamRegionMap;
