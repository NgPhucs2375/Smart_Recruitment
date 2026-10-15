import { z } from "zod";
import {
  MSG_EMAIL,
  MSG_PHONE,
  MSG_URL,
  isValidEmail,
  isValidHttpUrl,
  isValidVnPhone,
} from "@/features/tao-cv/validation";

export const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

/** Email: trim + giới hạn + format chuẩn (thay regex lỏng cũ). */
const emailField = (requiredMsg = "Vui lòng nhập email") =>
  z
    .string()
    .trim()
    .min(1, requiredMsg)
    .max(100, "Email tối đa 100 ký tự.")
    .refine(isValidEmail, { message: MSG_EMAIL });

/** SĐT di động VN: 0 + đầu 3/5/7/8/9 + 8 số (đồng bộ form CV). */
const phoneField = (requiredMsg = "Vui lòng nhập số điện thoại") =>
  z
    .string()
    .trim()
    .min(1, requiredMsg)
    .max(20, "Số điện thoại tối đa 20 ký tự.")
    .refine(isValidVnPhone, { message: MSG_PHONE });

/** Text thường: trim (diệt "   ") + giới hạn độ dài. */
const textField = (requiredMsg: string, max = 100) =>
  z.string().trim().min(1, requiredMsg).max(max, `Tối đa ${max} ký tự.`);

/** URL tùy chọn: trống cho qua, có thì phải đúng dạng http(s). */
export const optionalUrlField = () =>
  z
    .string()
    .trim()
    .max(255, "Link tối đa 255 ký tự.")
    .refine((v) => v === "" || isValidHttpUrl(v), { message: MSG_URL });

/** Mã số thuế: 10 hoặc 13 chữ số (trống cho qua khi optional). */
export const taxCodeField = () =>
  z
    .string()
    .trim()
    .max(20, "Mã số thuế tối đa 20 ký tự.")
    .refine((v) => v === "" || /^\d{10}(\d{3})?$/.test(v), {
      message: "Mã số thuế gồm 10 hoặc 13 chữ số.",
    });

const passwordField = (minMsg: string) =>
  z.string().min(6, minMsg).max(100, "Mật khẩu tối đa 100 ký tự.");

export const loginSchema = z.object({
  email: emailField(),
  password: z.string().min(1),
  remember: z.boolean(),
});

export const registerSchema = z.object({
  email: emailField(),
  password: passwordField("Mật khẩu phải tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
  role: z.enum(["UNG_VIEN", "NGUOI_DAI_DIEN"]),
  hoTen: textField("Vui lòng nhập họ tên"),
  soDienThoai: phoneField(),
  tenDoanhNghiep: z.string().optional(),
  diaChiDoanhNghiep: z.string().optional(),
  chucVu: z.string().optional(),
  inviteToken: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mật khẩu không khớp. Vui lòng xem lại!",
      path: ["confirmPassword"],
    });
  }

  if (data.role === "NGUOI_DAI_DIEN") {
    if (!data.tenDoanhNghiep || data.tenDoanhNghiep.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập tên doanh nghiệp.",
        path: ["tenDoanhNghiep"],
      });
    }

    if (!data.diaChiDoanhNghiep || data.diaChiDoanhNghiep.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập địa chỉ doanh nghiệp.",
        path: ["diaChiDoanhNghiep"],
      });
    }

    if (!data.chucVu || data.chucVu.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập chức vụ.",
        path: ["chucVu"],
      });
    }
  }
});

export const magicLinkSchema = z.object({
  email: emailField(),
  role: z.enum(["UNG_VIEN", "NGUOI_DAI_DIEN"]).optional(),
  hoTen: z.string().optional(),
  soDienThoai: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "NGUOI_DAI_DIEN" && (!data.hoTen || data.hoTen.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vui lòng nhập họ tên.",
      path: ["hoTen"],
    });
  }
});

/** Lời mời nhân sự (form tay nhan-su): email chuẩn + tên/chức vụ gọn. */
export const inviteSchema = z.object({
  email: emailField("Email không được để trống"),
  hoTen: z.string().trim().max(100, "Họ tên tối đa 100 ký tự."),
  chucVu: z.string().trim().max(100, "Chức vụ tối đa 100 ký tự."),
});

export const forgotPasswordSchema = z.object({
  email: emailField(),
});

export const resetPasswordSchema = z.object({
  password: passwordField("Mật khẩu phải tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mật khẩu không khớp.",
      path: ["confirmPassword"],
    });
  }
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: passwordField("Mật khẩu mới phải tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mật khẩu mới không khớp.",
      path: ["confirmPassword"],
    });
  }
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;
export type InviteFormData = z.infer<typeof inviteSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
