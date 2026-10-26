import { PAGE_SIZE } from '@/features/jobs/constants';
import { normalizeJob, USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { MOCK_JOBS } from '@/features/jobs/mock-jobs';
import type { Job } from '@/features/jobs/types';
import type { Company } from '@/features/companies/types';
import { apiRequest } from '@/services/api/client';
import { asNumber, asRecord, asText, unwrapData, unwrapList } from '@/services/api/parse';

/** Danh sách doanh nghiệp — mirror doanh-nghiep-api.ts của Web. */
const COMPANIES_PATH = 'doanhnghieps';

/** Demo 6 doanh nghiệp (tên lấy từ web demo companies + mock jobs). */
export const DEMO_COMPANIES: Company[] = [
  {
    id: 1,
    name: 'NextWave Digital',
    description:
      'Công ty phần mềm tập trung vào sản phẩm số hoá cho tuyển dụng và thương mại điện tử, môi trường hybrid năng động.',
    website: 'https://nextwave.example.vn',
    address: 'Quận 1, TP. Hồ Chí Minh',
    logoUrl: '',
    taxCode: '0312000123',
    industry: 'Công nghệ thông tin',
    size: '50 - 100 nhân sự',
  },
  {
    id: 2,
    name: 'Blue River Solutions',
    description:
      'Nhà cung cấp giải pháp doanh nghiệp .NET và cloud, chuyên gia lâu năm trong phát triển hệ thống ngân hàng và logistics.',
    website: 'https://blueriver.example.vn',
    address: 'Cầu Giấy, Hà Nội',
    logoUrl: '',
    taxCode: '0108000456',
    industry: 'Phần mềm doanh nghiệp',
    size: '100 - 250 nhân sự',
  },
  {
    id: 3,
    name: 'Sao Viet Technology',
    description:
      'Đội ngũ sản phẩm trẻ xây dựng ứng dụng web/mobile cho thị trường Đông Nam Á, chú trọng trải nghiệm người dùng.',
    website: 'https://saoviet.example.vn',
    address: 'Thủ Đức, TP. Hồ Chí Minh',
    logoUrl: '',
    taxCode: '0315000789',
    industry: 'Sản phẩm số',
    size: '20 - 50 nhân sự',
  },
  {
    id: 4,
    name: 'Orbit Software',
    description:
      'Tập trung vào kiểm thử tự động và DevOps, hợp tác cùng các đối tác Nhật Bản và châu Âu.',
    website: 'https://orbit.example.vn',
    address: 'Liên Chiểu, Đà Nẵng',
    logoUrl: '',
    taxCode: '0402000321',
    industry: 'Xuất khẩu phần mềm',
    size: '50 - 100 nhân sự',
  },
  {
    id: 5,
    name: 'Mango Labs',
    description:
      'Studio thiết kế sản phẩm và nghiên cứu người dùng, xây dựng design system cho các startup trong khu vực.',
    website: 'https://mangolabs.example.vn',
    address: 'Hải Châu, Đà Nẵng',
    logoUrl: '',
    taxCode: '0401000654',
    industry: 'Thiết kế sản phẩm',
    size: '10 - 20 nhân sự',
  },
  {
    id: 6,
    name: 'GreenField Commerce',
    description:
      'Nền tảng thương mại điện tử xanh, kết hợp phân tích dữ liệu và vận hành chuỗi cung ứng bền vững.',
    website: 'https://greenfield.example.vn',
    address: 'Bình Thạnh, TP. Hồ Chí Minh',
    logoUrl: '',
    taxCode: '0318000987',
    industry: 'Thương mại điện tử',
    size: '250 - 500 nhân sự',
  },
];

export type CompanyListParams = {
  page: number;
  pageSize?: number;
  keyword?: string;
};

export type CompanyListPage = {
  companies: Company[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
};

/** Câu seed thô cần ẩn — mirror cleanCompanyDescription của Web. */
const SEED_DESC_PATTERNS = [/demo gắn với/i, /@seed\.local/i, /dùng để kiểm thử/i];

export function cleanCompanyDescription(moTa: string, linhVuc: string): string {
  const text = moTa.trim();
  if (!text || SEED_DESC_PATTERNS.some((re) => re.test(text))) {
    const field = linhVuc.trim() || 'đa ngành';
    return `Doanh nghiệp hoạt động trong lĩnh vực ${field}, cam kết môi trường làm việc sáng tạo và chuyên nghiệp.`;
  }
  return text;
}

export function normalizeCompany(value: unknown): Company | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asNumber(raw.id ?? raw.Id);
  if (id <= 0) return null;

  const industry = asText(raw.linhVucHoatDong ?? raw.LinhVucHoatDong);
  return {
    id,
    name: asText(raw.tenDoanhNghiep ?? raw.TenDoanhNghiep, `Doanh nghiệp #${id}`),
    description: cleanCompanyDescription(asText(raw.moTa ?? raw.MoTa), industry),
    website: asText(raw.website ?? raw.Website),
    address: asText(raw.diaChi ?? raw.DiaChi),
    logoUrl: asText(raw.logoUrl ?? raw.LogoUrl),
    taxCode: asText(raw.maSoThue ?? raw.MaSoThue),
    industry,
    size: asText(raw.quyMoNhanSu ?? raw.QuyMoNhanSu),
  };
}

function demoJobsForCompany(company: Company): Job[] {
  return MOCK_JOBS.filter(
    (job) => job.company.toLocaleLowerCase('vi') === company.name.toLocaleLowerCase('vi'),
  );
}

function filterDemoCompanies(keyword?: string): Company[] {
  const query = keyword?.trim().toLocaleLowerCase('vi') ?? '';
  if (!query) return DEMO_COMPANIES;
  return DEMO_COMPANIES.filter((company) =>
    `${company.name} ${company.industry} ${company.address} ${company.description}`
      .toLocaleLowerCase('vi')
      .includes(query),
  );
}

function buildListQuery(params: CompanyListParams): URLSearchParams {
  const page = Math.max(1, params.page);
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const query = new URLSearchParams({
    _start: String((page - 1) * pageSize),
    _end: String(page * pageSize),
  });
  if (params.keyword?.trim()) query.set('_filter', params.keyword.trim());
  return query;
}

export const companiesApi = {
  /** Browse paged — Web list endpoint: doanhnghieps?_start&_end&_filter. */
  async getCompanies(params: CompanyListParams): Promise<CompanyListPage> {
    const page = Math.max(1, params.page);
    const pageSize = params.pageSize ?? PAGE_SIZE;

    if (USE_MOCK_JOBS) {
      const filtered = filterDemoCompanies(params.keyword);
      const start = (page - 1) * pageSize;
      const companies = filtered.slice(start, start + pageSize);
      return {
        companies,
        totalCount: filtered.length,
        page,
        pageSize,
        hasNext: start + companies.length < filtered.length,
      };
    }

    try {
      const payload = await apiRequest<unknown>(`${COMPANIES_PATH}?${buildListQuery(params).toString()}`);
      const rows = unwrapList(payload);
      const companies = rows
        .map(normalizeCompany)
        .filter((company): company is Company => company !== null);
      const envelope = asRecord(payload);
      const totalCount = asNumber(envelope?.TotalCount ?? envelope?.totalCount, companies.length);
      const hasNextValue = envelope?.HasNext ?? envelope?.hasNext;
      const hasNext =
        typeof hasNextValue === 'boolean' ? hasNextValue : page * pageSize < totalCount;

      return {
        companies,
        totalCount,
        page: asNumber(envelope?.PageNumber ?? envelope?.pageNumber, page),
        pageSize: asNumber(envelope?.PageSize ?? envelope?.pageSize, pageSize),
        hasNext,
      };
    } catch {
      const filtered = filterDemoCompanies(params.keyword);
      const start = (page - 1) * pageSize;
      const companies = filtered.slice(start, start + pageSize);
      return {
        companies,
        totalCount: filtered.length,
        page,
        pageSize,
        hasNext: start + companies.length < filtered.length,
      };
    }
  },

  /** Detail — Web: doanhnghieps/show/{id}. */
  async getCompanyById(id: number): Promise<Company | null> {
    if (USE_MOCK_JOBS) {
      return DEMO_COMPANIES.find((company) => company.id === id) ?? null;
    }

    try {
      const payload = await apiRequest<unknown>(
        `${COMPANIES_PATH}/show/${encodeURIComponent(String(id))}`,
      );
      const data = unwrapData(payload);
      const company = normalizeCompany(data);
      if (company) return company;
      return unwrapList(payload)
        .map(normalizeCompany)
        .find((item): item is Company => item !== null) ?? null;
    } catch {
      return DEMO_COMPANIES.find((company) => company.id === id) ?? null;
    }
  },

  /** Việc đang tuyển của công ty — Web: tintuyendungs?...&DoanhNghiepId={id}. */
  async getCompanyJobs(companyId: number): Promise<Job[]> {
    if (USE_MOCK_JOBS) {
      const company = DEMO_COMPANIES.find((item) => item.id === companyId);
      return company ? demoJobsForCompany(company) : [];
    }

    try {
      const payload = await apiRequest<unknown>(
        `tintuyendungs?_start=0&_end=100&DoanhNghiepId=${encodeURIComponent(String(companyId))}`,
      );
      return unwrapList(payload)
        .map(normalizeJob)
        .filter((job): job is Job => job !== null);
    } catch {
      const company = DEMO_COMPANIES.find((item) => item.id === companyId);
      return company ? demoJobsForCompany(company) : [];
    }
  },
};

/** Chữ cái logo (Web companyInitials) — fallback khi không có logoUrl. */
export function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CT';
  if (parts.length === 1) return (parts[0] as string).slice(0, 2).toUpperCase();
  return `${(parts[0] as string)[0]}${(parts[parts.length - 1] as string)[0]}`.toUpperCase();
}
