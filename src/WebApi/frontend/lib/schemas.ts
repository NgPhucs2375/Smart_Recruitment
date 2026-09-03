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
  companyName:z.string().optional(),
}).superRefine((data,ctx) => {
  // Kiểm tra xác nhận mật khẩu
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mật khẩu không khớp. Vui lòng xem lại!",
      path: ["confirmPassword"],
    });
  }

  // Kiểm tra tên doanh nghiệp đối với Người đại diện
  if (data.role === "NGUOI_DAI_DIEN" && (!data.companyName || data.companyName.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vui lòng nhập tên doanh nghiệp.",
      path: ["companyName"],
    });
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