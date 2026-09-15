"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFollowedCompanies } from "@/hooks/use-followed-companies";
import { CompanyCard } from "./company-card";
import { doanhNghiepApi, type DoanhNghiepVm } from "./doanh-nghiep-api";

type SortKey = "name" | "newest";

function distinct(values: (string | undefined)[]): string[] {
  return [...new Set(values.map((v) => (v || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "vi")
  );
}

/**
 * Candidate company discovery. Uses only the existing list endpoint
 * (keyword via _filter); location/size/field dropdowns are derived
 * client-side from loaded records — no invented backend filters,
 * no fabricated rankings.
 */
export function DoanhNghiepView() {
  const [companies, setCompanies] = useState<DoanhNghiepVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [field, setField] = useState("all");
  const [location, setLocation] = useState("all");
  const [size, setSize] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");
  const { isFollowed, toggle } = useFollowedCompanies();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDenied(false);
    setLoadError(null);
    doanhNghiepApi
      .list(appliedKeyword || undefined)
      .then((list) => {
        if (!cancelled) setCompanies(list);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const code = (e as { code?: string })?.code;
        if (code === "forbidden") setDenied(true);
        else setLoadError(e instanceof Error ? e.message : "Không tải được danh sách công ty.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedKeyword]);

  const fields = useMemo(() => distinct(companies.map((c) => c.linhVucHoatDong)), [companies]);
  const locations = useMemo(() => distinct(companies.map((c) => c.diaChi)), [companies]);
  const sizes = useMemo(() => distinct(companies.map((c) => c.quyMoNhanSu)), [companies]);

  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = companies.filter((c) => {
      if (field !== "all" && c.linhVucHoatDong !== field) return false;
      if (location !== "all" && c.diaChi !== location) return false;
      if (size !== "all" && c.quyMoNhanSu !== size) return false;
      if (kw) {
        const hay = `${c.tenDoanhNghiep} ${c.linhVucHoatDong} ${c.diaChi} ${c.moTa}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) =>
      sort === "newest"
        ? b.id - a.id
        : a.tenDoanhNghiep.localeCompare(b.tenDoanhNghiep, "vi")
    );
  }, [companies, keyword, field, location, size, sort]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">
          <Building2 className="size-3.5" /> Doanh nghiệp
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          Khám phá công ty
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">
          Duyệt danh bạ công ty, theo dõi để nhận tin tuyển dụng mới từ họ.
        </p>
      </div>

      <form
        className="flex flex-col gap-2.5 rounded-2xl border border-linen bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedKeyword(keyword);
        }}
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên công ty, lĩnh vực, địa điểm..."
            aria-label="Tìm công ty"
            className="h-11 rounded-xl border-input bg-white pl-10 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={field} onValueChange={(v) => setField(v ?? "all")}>
            <SelectTrigger aria-label="Lĩnh vực" className="h-10 rounded-xl bg-white">
              <SelectValue placeholder="Lĩnh vực" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi lĩnh vực</SelectItem>
              {fields.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={(v) => setLocation(v ?? "all")}>
            <SelectTrigger aria-label="Địa điểm" className="h-10 rounded-xl bg-white">
              <SelectValue placeholder="Địa điểm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi địa điểm</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={size} onValueChange={(v) => setSize(v ?? "all")}>
            <SelectTrigger aria-label="Quy mô" className="h-10 rounded-xl bg-white">
              <SelectValue placeholder="Quy mô" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi quy mô</SelectItem>
              {sizes.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "name")}>
            <SelectTrigger aria-label="Sắp xếp" className="h-10 rounded-xl bg-white">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Tên A–Z</SelectItem>
              <SelectItem value="newest">Mới thêm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải danh sách công ty...
        </div>
      ) : denied ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-10 text-center">
          <ShieldAlert className="size-8 text-amber-600" />
          <p className="text-sm font-semibold text-amber-900">Chưa xem được danh bạ công ty</p>
          <p className="max-w-md text-xs leading-5 text-amber-800">
            Tài khoản của bạn chưa được cấp quyền đọc danh sách doanh nghiệp (máy chủ từ chối).
            Cần backend bổ sung policy đọc cho vai trò Ứng viên.
          </p>
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          {loadError}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-linen bg-card px-4 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Building2 className="size-6" />
          </span>
          <p className="text-sm font-medium text-foreground">Không tìm thấy công ty phù hợp</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Thử từ khóa khác hoặc xóa bộ lọc.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Tìm thấy {visible.length} công ty
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <CompanyCard key={c.id} company={c} followed={isFollowed(c.id)} onToggleFollow={toggle} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
