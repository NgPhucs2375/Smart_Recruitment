"use client";

import Link from "next/link";
import { ArrowUpRight, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { getValidToken } from "@/lib/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type MarketingBannerData = {
  title: string;
  description: string;
  mediaType: string;
  linkUrl: string;
  mediaUrl: string;
};

function isVideo(mediaType: string) {
  return mediaType.toLowerCase().startsWith("video/");
}

export function MarketingBanner() {
  const [banner, setBanner] = useState<MarketingBannerData | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getValidToken();
      const response = await fetch("/api/dotnet/marketingbanners/active", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) return;
      const body = await response.json().catch(() => null);
      const data = body?.Data ?? body?.data;
      if (!cancelled && data?.mediaUrl) setBanner(data as MarketingBannerData);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner) return null;

  const content = (
    <Card className="group relative min-h-44 overflow-hidden border-border/80 bg-slate-950 shadow-sm sm:min-h-52">
      {isVideo(banner.mediaType) ? (
        <video
          className="absolute inset-0 size-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
          src={banner.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-label={banner.title || "Video giới thiệu"}
        />
      ) : (
        <img
          className="absolute inset-0 size-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
          src={banner.mediaUrl}
          alt={banner.title || "Banner giới thiệu"}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
      <div className="relative flex min-h-44 max-w-xl flex-col justify-center p-6 text-white sm:min-h-52 sm:p-8">
        <Badge className="w-fit gap-1 border-white/20 bg-white/15 text-[10px] uppercase tracking-[0.16em] text-white hover:bg-white/20">
          <Megaphone className="size-3" /> Tin nổi bật
        </Badge>
        <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{banner.title}</h2>
        {banner.description && <p className="mt-2 line-clamp-2 text-sm text-white/75">{banner.description}</p>}
        {banner.linkUrl && <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white">Xem thêm <ArrowUpRight className="size-3.5" /></span>}
      </div>
    </Card>
  );

  if (!banner.linkUrl) return content;
  if (banner.linkUrl.startsWith("/")) return <Link href={banner.linkUrl}>{content}</Link>;
  return <a href={banner.linkUrl} target="_blank" rel="noreferrer">{content}</a>;
}
