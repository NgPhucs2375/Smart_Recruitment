import { redirect } from "next/navigation";

// /dashboard/cv-builder is deprecated — CV editor lives at /CV
// Keep this route as redirect to avoid dead links from old dashboard
export default function DeprecatedCvBuilderPage() {
  redirect("/CV");
}
