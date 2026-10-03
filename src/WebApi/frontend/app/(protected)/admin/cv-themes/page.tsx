import { redirect } from "next/navigation";

// Giữ backward-compat cho bookmark/log cũ.
export default function LegacyCvThemesRedirect() {
  redirect("/admin/cv/themes");
}
