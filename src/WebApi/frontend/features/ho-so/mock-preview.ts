import type { CvVm, HoSoVm } from "@/lib/cv-api";

/**
 * DEV-ONLY preview data for `/ho-so?xem-truoc=1`.
 * Lets reviewers see the profile summary + CV collection (view-mode)
 * while the backend save endpoint is unavailable. No API calls, no
 * contract changes. Delete this file (and the `xem-truoc` branch in
 * HoSoView) once the real backend works.
 */
export const MOCK_HO_SO: HoSoVm = {
  id: -1,
  nguoiDungId: 0,
  hoTen: "Nguyễn Văn Minh",
  sdt: "0912345678",
  ngaySinh: "1998-04-15T00:00:00",
  gioiTinh: "Nam",
  diaChi: "Quận 1, TP. Hồ Chí Minh",
  gioiThieu:
    "Lập trình viên Fullstack .NET với 3 năm kinh nghiệm xây dựng Web API và ứng dụng React. Mong muốn phát triển sâu về kiến trúc hệ thống và AI ứng dụng.",
  viTriUngTuyen: "Fullstack .NET Developer",
  mucLuongMongMuon: 18000000,
  isTimViec: true,
};

export const MOCK_CVS: CvVm[] = [
  {
    id: -1,
    hoSoUngVienId: -1,
    tenFile: "CV-Backend-2026",
    fileUrl: null,
    ngayUpload: "2026-09-10T02:00:00",
    isDefault: true,
    isDaXoa: false,
    templateId: "tech-modern",
    noiDungJson: null,
  },
  {
    id: -2,
    hoSoUngVienId: -1,
    tenFile: "CV-Frontend-React",
    fileUrl: null,
    ngayUpload: "2026-08-28T02:00:00",
    isDefault: false,
    isDaXoa: false,
    templateId: "minimal-ats",
    noiDungJson: null,
  },
];
