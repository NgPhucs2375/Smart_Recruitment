import { CongTyDetailView } from "@/features/doanh-nghiep/cong-ty-detail-view";

export default async function CongTyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CongTyDetailView id={Number(id)} />;
}
