import { z } from "zod";

export const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const loginSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+$/, "Email không hợp lệ"),
  password: z.string().min(1),
  remember: z.boolean(),
});

export const registerSchema = z.object({
  email:z.string().regex(/^[^\s@]+@[^\s@]+$/, "Email không hợp lệ"),
  password:z.string().min(6,"Mật khẩu phải tối thiểu 6 ký tự"),
  confirmPassword:z.string().min(1,"Vui lòng xác nhận lại mật khẩu"),
  role:z.enum(["UNG_VIEN","NGUOI_DAI_DIEN"]),
  hoTen:z.string().min(1,"Vui lòng nhập họ tên"),
  soDienThoai:z.string().min(1,"Vui lòng nhập số điện thoại"),
  tenDoanhNghiep:z.string().optional(),
  diaChiDoanhNghiep:z.string().optional(),
  chucVu:z.string().optional(),
}).superRefine((data,ctx) => {
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
  email:z.string().regex(/^[^\s@]+@[^\s@]+$/,"Email không hợp lệ"),
  role:z.enum(["UNG_VIEN","NGUOI_DAI_DIEN"]).optional(),
  hoTen:z.string().optional(),
  soDienThoai:z.string().optional(),
}).superRefine((data,ctx) =>{
  if(data.role === "NGUOI_DAI_DIEN" && (!data.hoTen || data.hoTen.trim() === "")){
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vui lòng nhập họ tên.",
      path: ["hoTen"],
    });
  }
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;