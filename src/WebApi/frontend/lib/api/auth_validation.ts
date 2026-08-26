import { z } from "zod";

// ==========================================
// 1. REGEX PATTERNS CHUẨN DOANH NGHIỆP
// ==========================================
const PHONE_REGEX = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
const TAX_CODE_REGEX = /^[0-9]{10}(-[0-9]{3})?$/; // Chuẩn mã số thuế Việt Nam (10 hoặc 13 số)

// ==========================================
// 2. LOGIN SCHEMA
// ==========================================
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Định dạng email không hợp lệ."),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// 3. REGISTER SCHEMA (KÈM CONDITIONAL VALIDATION)
// ==========================================
export const registerSchema = z
  .object({
    role: z.enum(["UngVien", "NhaTuyenDung", "Candidate", "Employer"], {
      message: "Vui lòng chọn vai trò hợp lệ.",
    }),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email.")
      .email("Định dạng email không hợp lệ."),
    userName: z
      .string()
      .trim()
      .min(3, "Tên tài khoản phải có ít nhất 3 ký tự.")
      .max(50, "Tên tài khoản không được vượt quá 50 ký tự.")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Tên tài khoản chỉ được chứa chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang."
      ),
    hoTen: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
      .max(100, "Họ và tên không được vượt quá 100 ký tự."),
    soDienThoai: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập số điện thoại.")
      .regex(PHONE_REGEX, "Số điện thoại không đúng định dạng (VD: 0912345678)."),
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất một chữ cái in hoa.")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất một chữ số.")
      .regex(
        /[^a-zA-Z0-9]/,
        "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*)."
      ),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu."),

    // Các trường dành riêng cho Nhà tuyển dụng (Optional ở mức schema ban đầu)
    tenCongTy: z.string().trim().optional(),
    maSoThue: z.string().trim().optional(),
    diaChiCongTy: z.string().trim().optional(),
    website: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val),
        "Địa chỉ website không hợp lệ."
      ),
  })
  // 1. Kiểm tra khớp mật khẩu
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  })
  // 2. Kiểm tra bắt buộc Tên công ty nếu là Nhà tuyển dụng
  .refine(
    (data) => {
      if (data.role === "NhaTuyenDung" || data.role === "Employer") {
        return Boolean(data.tenCongTy && data.tenCongTy.trim().length >= 3);
      }
      return true;
    },
    {
      message: "Vui lòng nhập tên công ty (tối thiểu 3 ký tự).",
      path: ["tenCongTy"],
    }
  )
  // 3. Kiểm tra Mã số thuế hợp lệ nếu là Nhà tuyển dụng
  .refine(
    (data) => {
      if (data.role === "NhaTuyenDung" || data.role === "Employer") {
        return Boolean(data.maSoThue && TAX_CODE_REGEX.test(data.maSoThue.trim()));
      }
      return true;
    },
    {
      message: "Mã số thuế không đúng định dạng (10 hoặc 13 chữ số).",
      path: ["maSoThue"],
    }
  )
  // 4. Kiểm tra Địa chỉ trụ sở công ty nếu là Nhà tuyển dụng
  .refine(
    (data) => {
      if (data.role === "NhaTuyenDung" || data.role === "Employer") {
        return Boolean(data.diaChiCongTy && data.diaChiCongTy.trim().length >= 5);
      }
      return true;
    },
    {
      message: "Vui lòng nhập địa chỉ trụ sở công ty.",
      path: ["diaChiCongTy"],
    }
  );

export type RegisterFormData = z.infer<typeof registerSchema>;