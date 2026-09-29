import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyAbout({ description }: { description: string }) {
  return <Card><CardHeader><CardTitle className="text-lg">Về doanh nghiệp</CardTitle></CardHeader><CardContent><p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{description || "Doanh nghiệp chưa cập nhật phần giới thiệu."}</p></CardContent></Card>;
}
