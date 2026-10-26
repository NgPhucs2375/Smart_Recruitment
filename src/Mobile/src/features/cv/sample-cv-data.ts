import type { CvFormData } from './types';

/**
 * Dữ liệu minh họa cho "Xem thử" mẫu ở kho CV (tương đương SAMPLE_RESUME
 * của Web nhưng theo shape CvFormData để render qua route /cv-render).
 */
export const sampleCvFormData: CvFormData = {
  thongTinLienHe: {
    hoTen: 'Nguyễn Văn An',
    email: 'an.nguyen@email.com',
    sdt: '0901234567',
    diaChi: 'TP. Hồ Chí Minh',
    github: 'https://github.com/nguyenvanan',
    linkedIn: 'https://linkedin.com/in/nguyenvanan',
    portfolio: 'https://nguyenvanan.dev',
    gioiTinh: 'Nam',
    ngaySinh: '15/08/1998',
    viTriUngTuyen: 'Frontend Developer',
    mucLuongMongMuon: '25.000.000',
    gioiThieuBanThan:
      'Lập trình viên với 3 năm kinh nghiệm React và TypeScript, tập trung vào hiệu năng và trải nghiệm người dùng.',
    anhDaiDienUrl: '',
  },
  hocVan: [
    {
      id: 'sample-edu-1',
      truong: 'Đại học Bách Khoa TP.HCM',
      chuyenNganh: 'Khoa học máy tính',
      bangCap: 'Cử nhân',
      tuNgay: '2016',
      denNgay: '2021',
      isHienTai: false,
      moTa: 'GPA 3.4/4.0 — sinh viên giỏi nhiều kỳ.',
    },
  ],
  kinhNghiemLamViec: [
    {
      id: 'sample-exp-1',
      congTy: 'Công ty TNHH Giải pháp Số',
      chucDanh: 'Frontend Developer',
      diaChi: 'TP. Hồ Chí Minh',
      tuNgay: '03/2023',
      denNgay: '',
      isHienTai: true,
      moTa:
        'Xây dựng hệ thống quản trị nội bộ cho 12.000 người dùng, giảm thời gian tải trang 45%.',
      kyNangSuDung: ['React', 'TypeScript', 'TanStack Query'],
    },
    {
      id: 'sample-exp-2',
      congTy: 'Startup Công nghệ ABC',
      chucDanh: 'Junior Developer',
      diaChi: 'Đà Nẵng',
      tuNgay: '07/2021',
      denNgay: '02/2023',
      isHienTai: false,
      moTa: 'Phát triển trang landing page và cổng thanh toán cho 6 sản phẩm SaaS.',
      kyNangSuDung: ['Next.js', 'Tailwind CSS'],
    },
  ],
  duAn: [
    {
      id: 'sample-proj-1',
      tenDuAn: 'HIREAI Web',
      vaiTro: 'Tech Lead',
      congNghe: ['Next.js', 'TypeScript', 'PostgreSQL'],
      link: 'https://hireai.example.com',
      moTa: 'Thiết kế kiến trúc frontend và quy trình CI/CD cho nền tảng tuyển dụng.',
      tuNgay: '01/2024',
      denNgay: '',
      isHienTai: true,
    },
  ],
  kyNang: [
    { id: 'sample-skill-1', tenKyNang: 'React', mucDoThanhThao: '3', soNamKinhNghiem: '3' },
    { id: 'sample-skill-2', tenKyNang: 'TypeScript', mucDoThanhThao: '2', soNamKinhNghiem: '3' },
    { id: 'sample-skill-3', tenKyNang: 'Git', mucDoThanhThao: '2', soNamKinhNghiem: '4' },
  ],
  chungChi: [
    {
      id: 'sample-cert-1',
      tenChungChi: 'AWS Certified Cloud Practitioner',
      donViCap: 'Amazon Web Services',
      ngayCap: '05/2024',
      ngayHetHan: '',
      maXacMinh: 'AWS-CCP-2024',
      credentialUrl: '',
    },
  ],
  templateId: 'minimal-ats',
  tenFile: 'CV mẫu',
};
