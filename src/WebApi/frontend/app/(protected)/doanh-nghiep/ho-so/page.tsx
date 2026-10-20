import { redirect } from "next/navigation";

// Đã gom vào tab "Công ty" của màn hình Tài khoản (/tai-khoan).
export default function HoSoDoanhNghiepPage() {
  redirect("/tai-khoan?tab=cong-ty");
}
