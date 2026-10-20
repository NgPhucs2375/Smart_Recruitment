import { redirect } from "next/navigation";

// Đã gom vào tab "Cá nhân" của màn hình Tài khoản (/tai-khoan).
export default function HoSoNhaTuyenDungPage() {
  redirect("/tai-khoan?tab=ca-nhan");
}
