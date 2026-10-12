import { z } from "zod";

const optionalText = z.string().optional();
const optionalTextList = z.union([z.array(z.string()), z.string()]).optional();

export const cvContactPatchSchema = z.object({
  hoTen: optionalText.describe("Họ và tên"),
  email: optionalText.describe("Email"),
  sdt: optionalText.describe("Số điện thoại"),
  diaChi: optionalText.describe("Địa chỉ"),
  github: optionalText.describe("URL GitHub"),
  linkedIn: optionalText.describe("URL LinkedIn"),
  portfolio: optionalText.describe("URL portfolio"),
  gioiTinh: optionalText.describe("Giới tính, chỉ điền khi user cung cấp"),
  ngaySinh: optionalText.describe("Ngày sinh, ưu tiên YYYY-MM-DD"),
  viTriUngTuyen: optionalText.describe("Vị trí ứng tuyển"),
  mucLuongMongMuon: optionalText.describe("Mức lương mong muốn"),
  gioiThieuBanThan: optionalText.describe(
    "Tóm tắt nghề nghiệp 450-600 ký tự (4-6 dòng). Dài hơn phải tự viết lại ngắn gọn, giữ ý chính và số liệu, không dán nguyên văn prompt.",
  ),
  anhDaiDienUrl: optionalText.describe("URL ảnh đại diện"),
}).strict().describe("Thông tin liên hệ. Chỉ dùng đúng các field được khai báo, không truyền reason hoặc văn bản tổng hợp.");

const educationCreateSchema = z.object({
  truong: z.string().min(1).describe("Tên trường"),
  chuyenNganh: optionalText.describe("Chuyên ngành"),
  bangCap: optionalText.describe("Bằng cấp"),
  tuNgay: optionalText.describe("Ngày bắt đầu, MM/YYYY hoặc YYYY"),
  denNgay: optionalText.describe("Ngày kết thúc, MM/YYYY hoặc YYYY"),
  isHienTai: z.boolean().optional().describe("Đang theo học"),
  moTa: optionalText.describe("GPA hoặc mô tả học vấn dưới 200 ký tự"),
}).strict();

const experienceCreateFields = {
  congTy: optionalText.describe("Tên công ty"),
  truong: optionalText.describe("Alias tương thích: nếu section là kinh nghiệm thì hiểu là tên công ty"),
  chucDanh: z.string().min(1).describe("Chức danh"),
  diaChi: optionalText.describe("Địa điểm làm việc"),
  tuNgay: optionalText.describe("Ngày bắt đầu, MM/YYYY hoặc YYYY"),
  denNgay: optionalText.describe("Ngày kết thúc, MM/YYYY hoặc YYYY"),
  isHienTai: z.boolean().optional().describe("Hiện vẫn đang làm"),
  moTa: optionalText.describe(
    "Mô tả 350-500 ký tự mỗi mục, ngăn cách bằng xuống dòng. Dài hơn phải tự tóm gọn, giữ thành tích và số liệu.",
  ),
  kyNangSuDung: optionalTextList.describe("Danh sách kỹ năng hoặc công nghệ sử dụng"),
};

const experienceCreateSchema = z.union([
  z.object({ ...experienceCreateFields, congTy: z.string().min(1).describe("Tên công ty") }).strict(),
  z.object({ ...experienceCreateFields, truong: z.string().min(1).describe("Tên công ty (alias)") }).strict(),
]);

const projectCreateSchema = z.object({
  tenDuAn: z.string().min(1).describe("Tên dự án"),
  vaiTro: optionalText.describe("Vai trò trong dự án"),
  congNghe: optionalTextList.describe("Danh sách công nghệ"),
  link: optionalText.describe("URL dự án hoặc repository"),
  moTa: optionalText.describe(
    "Mô tả 250-400 ký tự mỗi mục, ngăn cách bằng xuống dòng. Dài hơn phải tự tóm gọn, giữ vai trò và kết quả chính.",
  ),
  tuNgay: optionalText.describe("Ngày bắt đầu, MM/YYYY hoặc YYYY"),
  denNgay: optionalText.describe("Ngày kết thúc, MM/YYYY hoặc YYYY"),
  isHienTai: z.boolean().optional().describe("Dự án đang tiếp tục"),
}).strict();

const skillCreateSchema = z.object({
  tenKyNang: z.string().min(1).describe("Tên kỹ năng ngắn gọn dưới 30 ký tự"),
  mucDoThanhThao: optionalText.describe("Mức độ hoặc danh sách kỹ năng trong nhóm"),
  soNamKinhNghiem: optionalText.describe("Số năm kinh nghiệm nếu user cung cấp"),
}).strict();

const certificateCreateFields = {
  tenChungChi: optionalText.describe("Tên chứng chỉ"),
  truong: optionalText.describe("Alias tương thích: tên chứng chỉ nếu model gửi nhầm field"),
  donViCap: optionalText.describe("Đơn vị cấp"),
  ngayCap: optionalText.describe("Ngày cấp, MM/YYYY hoặc YYYY"),
  moTa: optionalText.describe("Alias tương thích: ngày cấp nếu model gửi nhầm field"),
  ngayHetHan: optionalText.describe("Ngày hết hạn, MM/YYYY hoặc YYYY"),
  maXacMinh: optionalText.describe("Mã xác minh"),
  credentialUrl: optionalText.describe("URL chứng chỉ"),
};

const certificateCreateSchema = z.union([
  z.object({ ...certificateCreateFields, tenChungChi: z.string().min(1).describe("Tên chứng chỉ") }).strict(),
  z.object({ ...certificateCreateFields, truong: z.string().min(1).describe("Tên chứng chỉ (alias)") }).strict(),
]);

export const cvSectionCreateSchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("hocVan"), items: z.array(educationCreateSchema).min(1).max(20) }).strict(),
  z.object({ section: z.literal("kinhNghiemLamViec"), items: z.array(experienceCreateSchema).min(1).max(20) }).strict(),
  z.object({ section: z.literal("duAn"), items: z.array(projectCreateSchema).min(1).max(20) }).strict(),
  z.object({ section: z.literal("kyNang"), items: z.array(skillCreateSchema).min(1).max(20) }).strict(),
  z.object({ section: z.literal("chungChi"), items: z.array(certificateCreateSchema).min(1).max(20) }).strict(),
]);

const upsertItem = <T extends z.ZodRawShape>(shape: T) => z.object({ id: optionalText, ...shape }).partial().strict();

export const cvSectionUpsertSchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("hocVan"), items: z.array(upsertItem(educationCreateSchema.shape)).min(1).max(20) }).strict(),
  z.object({ section: z.literal("kinhNghiemLamViec"), items: z.array(upsertItem(experienceCreateFields)).min(1).max(20) }).strict(),
  z.object({ section: z.literal("duAn"), items: z.array(upsertItem(projectCreateSchema.shape)).min(1).max(20) }).strict(),
  z.object({ section: z.literal("kyNang"), items: z.array(upsertItem(skillCreateSchema.shape)).min(1).max(20) }).strict(),
  z.object({ section: z.literal("chungChi"), items: z.array(upsertItem(certificateCreateFields)).min(1).max(20) }).strict(),
]);
