import type {
  DataProvider,
  GetListParams,
  GetOneParams,
  CreateParams,
  UpdateParams,
  DeleteOneParams,
  CrudFilter,
  CrudSort,
} from "@refinedev/core";
// v2: bearer token auth via Authorization header (replaced cookie-based fetcher)
import { getAuthToken } from "./auth-provider";

// ─── Response types from .NET Clean Architecture backend ─────────────────────

/** GET /api/TodoLists */
interface TodosVm {
  priorityLevels: { id: number; name: string }[];
  lists: Record<string, unknown>[];
}

/** GET /api/TodoItems */
interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

/** GET /api/Invoices */
interface InvoicesVm {
  invoices: Record<string, unknown>[];
}

/** GET /api/RegulatoryRequests */
interface RegulatoryRequestsVm {
  requests: Record<string, unknown>[];
}

// ─── Helpers (pattern from core.f5s.loyalty) ─────────────────────────────────

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "An error occurred";
  const b = body as Record<string, unknown>;
  if (typeof b["Message"] === "string") return b["Message"];
  if (typeof b["title"] === "string") {
    const errors = b["errors"];
    if (errors && typeof errors === "object") {
      const details = Object.entries(errors as Record<string, unknown>)
        .map(([field, msgs]) => {
          const list = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
          return `${field}: ${list}`;
        })
        .join("; ");
      return `${b["title"]} — ${details}`;
    }
    return b["title"];
  }
  return "An error occurred";
}

async function safeParseJson(res: Response): Promise<unknown> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function processErrorResponse(res: Response): Promise<never> {
  if (res.status === 401) {
    return Promise.reject(
      Object.assign(new Error("Unauthorized"), { statusCode: 401 })
    );
  }
  if (res.status === 403) {
    return Promise.reject(
      Object.assign(new Error("Forbidden"), { statusCode: 403 })
    );
  }
  const body = await safeParseJson(res);
  return Promise.reject(
    new Error(extractErrorMessage(body))
  );
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

// Bearer token fetcher — token stored in localStorage by auth-provider.
const fetcher = (url: string, options?: RequestInit): Promise<Response> =>
  fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${getAuthToken() ?? ""}`,
      ...options?.headers,
    },
  });

// ─── Filter serialization ─────────────────────────────────────────────────────
// Maps Refine CrudFilter operators to the server's `_filter=field:OP_value` convention.
// Operators without an explicit backend mapping fall through to a best-effort `eq`.

function serializeFilters(filters: CrudFilter[]): string[] {
  const parts: string[] = [];

  for (const f of filters) {
    if (!("field" in f)) continue;
    const { field, operator, value } = f;

    switch (operator) {
      case "eq":
        parts.push(`${field}:=${value}`);
        break;
      case "ne":
        parts.push(`${field}:!=${value}`);
        break;
      case "lt":
        parts.push(`${field}:<${value}`);
        break;
      case "gt":
        parts.push(`${field}:>${value}`);
        break;
      case "lte":
        parts.push(`${field}:<=${value}`);
        break;
      case "gte":
        parts.push(`${field}:>=${value}`);
        break;
      case "contains":
        parts.push(`${field}:~${value}`);
        break;
      case "ncontains":
        parts.push(`${field}:!~${value}`);
        break;
      case "containss":
        parts.push(`${field}:=~${value}`);
        break;
      case "ncontainss":
        parts.push(`${field}:!=~${value}`);
        break;
      case "startswith":
        parts.push(`${field}:^${value}`);
        break;
      case "endswith":
        parts.push(`${field}:$${value}`);
        break;
      case "in":
        if (Array.isArray(value) && value.length > 0)
          parts.push(`${field}:${value.join(",")}`);
        break;
      case "nin":
        if (Array.isArray(value) && value.length > 0)
          parts.push(`${field}:!${value.join(",")}`);
        break;
      case "between":
        if (Array.isArray(value) && value.length === 2)
          parts.push(`${field}:${value[0]}#${value[1]}`);
        break;
      case "null":
        parts.push(`${field}:null`);
        break;
      case "nnull":
        parts.push(`${field}:!null`);
        break;
      default:
        parts.push(`${field}:=${value}`);
    }
  }

  return parts;
}

function serializeSorters(sorters: CrudSort[]): Record<string, string> {
  if (sorters.length === 0) return {};
  return {
    _sort: sorters.map((s) => s.field).join(","),
    _order: sorters.map((s) => s.order).join(","),
  };
}

// ─── Field helpers ────────────────────────────────────────────────────────────

// Case-insensitive field access for camelCase DTO keys (e.g. "vendorName" ↔ "VendorName")
function getCaseInsensitive(obj: Record<string, unknown>, key: string): unknown {
  if (key in obj) return obj[key];
  const lk = key.toLowerCase();
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === lk) return obj[k];
  }
  return undefined;
}

// ─── Resource-specific query builders ────────────────────────────────────────
// The Clean Architecture backend uses per-resource pagination params.
// TodoItems → PageNumber / PageSize + ListId
// TodoLists → no pagination (returns full list)

function buildTodoItemsParams(
  page: number,
  pageSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: Record<string, any> | undefined,
  filters: CrudFilter[],
  sorters: CrudSort[]
): URLSearchParams {
  const p = new URLSearchParams();
  p.set("PageNumber", String(page));
  p.set("PageSize", String(pageSize));
  if (meta?.listId != null) p.set("ListId", String(meta.listId));

  for (const f of serializeFilters(filters)) p.append("_filter", f);
  Object.entries(serializeSorters(sorters)).forEach(([k, v]) => p.set(k, v));

  return p;
}

// ─── Data Provider factory ────────────────────────────────────────────────────

export function createDataProvider(apiUrl: string): DataProvider {
  return {
    getApiUrl: () => apiUrl,

    // ── getList ──────────────────────────────────────────────────────────────
    getList: async ({
      resource,
      pagination,
      filters = [],
      sorters = [],
      meta,
    }: GetListParams) => {
      const page = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;

      // ── TodoLists: fetch all then apply filter/sort/page in-memory
      // (backend has no server-side pagination for this resource)
      if (resource === "TodoLists") {
        const res = await fetcher(`${apiUrl}/TodoLists`);
        if (!res.ok) return processErrorResponse(res);
        const vm = (await res.json()) as TodosVm;

        type Row = Record<string, unknown>;
        let rows = vm.lists as Row[];

        // Client-side filter
        for (const f of filters) {
          if (!("field" in f)) continue;
          const { field, operator, value } = f as {
            field: string;
            operator: string;
            value: unknown;
          };
          if (value === undefined || value === null || value === "") continue;
          const key = field.toLowerCase();
          rows = rows.filter((row) => {
            const cell = row[key];
            if (operator === "contains")
              return String(cell ?? "").toLowerCase().includes(String(value).toLowerCase());
            if (operator === "eq")
              return String(cell ?? "").toLowerCase() === String(value).toLowerCase();
            return true;
          });
        }

        // Client-side sort
        if (sorters.length > 0) {
          rows = [...rows].sort((a, b) => {
            for (const s of sorters) {
              const key = s.field.toLowerCase();
              let aVal: unknown = a[key];
              let bVal: unknown = b[key];
              // Sort arrays by length (e.g. items count)
              if (Array.isArray(aVal)) aVal = aVal.length;
              if (Array.isArray(bVal)) bVal = bVal.length;
              let cmp = 0;
              if (typeof aVal === "number" && typeof bVal === "number") {
                cmp = aVal - bVal;
              } else {
                cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
              }
              if (cmp !== 0) return s.order === "asc" ? cmp : -cmp;
            }
            return 0;
          });
        }

        const total = rows.length;
        const start = (page - 1) * pageSize;
        return { data: rows.slice(start, start + pageSize) as never[], total };
      }

      // ── Invoices: fetch all then apply filter/sort/page in-memory
      if (resource === "Invoices") {
        const res = await fetcher(`${apiUrl}/Invoices`);
        if (!res.ok) return processErrorResponse(res);
        const vm = (await res.json()) as InvoicesVm;

        type Row = Record<string, unknown>;
        let rows: Row[] = vm.invoices ?? [];

        // Client-side filter (contains / eq)
        for (const f of filters) {
          if (!("field" in f)) continue;
          const { field, operator, value } = f as {
            field: string;
            operator: string;
            value: unknown;
          };
          if (value === undefined || value === null || value === "") continue;
          rows = rows.filter((row) => {
            const cell = getCaseInsensitive(row, field);
            if (operator === "contains")
              return String(cell ?? "").toLowerCase().includes(String(value).toLowerCase());
            if (operator === "eq")
              return String(cell ?? "").toLowerCase() === String(value).toLowerCase();
            return true;
          });
        }

        // Client-side sort — date-aware for ISO strings (e.g. "created")
        if (sorters.length > 0) {
          rows = [...rows].sort((a, b) => {
            for (const s of sorters) {
              const aRaw = getCaseInsensitive(a, s.field);
              const bRaw = getCaseInsensitive(b, s.field);
              let cmp = 0;
              if (typeof aRaw === "number" && typeof bRaw === "number") {
                cmp = aRaw - bRaw;
              } else {
                const aMs = typeof aRaw === "string" ? Date.parse(aRaw) : NaN;
                const bMs = typeof bRaw === "string" ? Date.parse(bRaw) : NaN;
                if (!isNaN(aMs) && !isNaN(bMs)) {
                  cmp = aMs - bMs;
                } else {
                  cmp = String(aRaw ?? "").localeCompare(String(bRaw ?? ""));
                }
              }
              if (cmp !== 0) return s.order === "asc" ? cmp : -cmp;
            }
            return 0;
          });
        }

        const total = rows.length;
        const start = (page - 1) * pageSize;
        return { data: rows.slice(start, start + pageSize) as never[], total };
      }

      // ── RegulatoryRequests: fetch all, client-side filter/sort/page
      if (resource === "RegulatoryRequests") {
        const res = await fetcher(`${apiUrl}/RegulatoryRequests`);
        if (!res.ok) return processErrorResponse(res);
        const vm = (await res.json()) as RegulatoryRequestsVm;

        type Row = Record<string, unknown>;
        let rows: Row[] = vm.requests ?? [];

        for (const f of filters) {
          if (!("field" in f)) continue;
          const { field, operator, value } = f as { field: string; operator: string; value: unknown };
          if (value === undefined || value === null || value === "") continue;
          rows = rows.filter((row) => {
            const cell = getCaseInsensitive(row, field);
            if (operator === "contains")
              return String(cell ?? "").toLowerCase().includes(String(value).toLowerCase());
            if (operator === "eq")
              return String(cell ?? "").toLowerCase() === String(value).toLowerCase();
            return true;
          });
        }

        if (sorters.length > 0) {
          rows = [...rows].sort((a, b) => {
            for (const s of sorters) {
              const aRaw = getCaseInsensitive(a, s.field);
              const bRaw = getCaseInsensitive(b, s.field);
              let cmp = 0;
              if (typeof aRaw === "number" && typeof bRaw === "number") {
                cmp = aRaw - bRaw;
              } else {
                const aMs = typeof aRaw === "string" ? Date.parse(aRaw) : NaN;
                const bMs = typeof bRaw === "string" ? Date.parse(bRaw) : NaN;
                if (!isNaN(aMs) && !isNaN(bMs)) cmp = aMs - bMs;
                else cmp = String(aRaw ?? "").localeCompare(String(bRaw ?? ""));
              }
              if (cmp !== 0) return s.order === "asc" ? cmp : -cmp;
            }
            return 0;
          });
        }

        const total = rows.length;
        const start = (page - 1) * pageSize;
        return { data: rows.slice(start, start + pageSize) as never[], total };
      }

      // ── TodoItems: GET /api/TodoItems?PageNumber=&PageSize=&ListId=
      if (resource === "TodoItems") {
        const params = buildTodoItemsParams(page, pageSize, meta, filters, sorters);
        const res = await fetcher(`${apiUrl}/TodoItems?${params}`);
        if (!res.ok) return processErrorResponse(res);
        const paged = (await res.json()) as PaginatedList<Record<string, unknown>>;
        return { data: paged.items as never[], total: paged.totalCount };
      }

      // ── Generic: _start/_end pagination + _filter + _sort/_order
      const params = new URLSearchParams();
      params.set("_start", String((page - 1) * pageSize));
      params.set("_end", String(page * pageSize));
      for (const f of serializeFilters(filters)) params.append("_filter", f);
      Object.entries(serializeSorters(sorters)).forEach(([k, v]) => params.set(k, v));

      const res = await fetcher(`${apiUrl}/${resource}?${params}`);
      if (!res.ok) return processErrorResponse(res);
      const body = await res.json();

      // Supports both raw array and wrapped { _data, _total } response
      if (Array.isArray(body)) {
        return { data: body as never[], total: body.length };
      }
      const data = body?._data ?? body?.Data?._data ?? [];
      const total = body?._total ?? body?.Data?._total ?? data.length;
      return { data, total };
    },

    // ── getOne ───────────────────────────────────────────────────────────────
    // TodoLists uses GET /{id} (Minimal API); other resources follow the
    // reference-project convention GET /show/{id} (MVC controllers).
    getOne: async ({ resource, id }: GetOneParams) => {
      const url =
        resource === "TodoLists"
          ? `${apiUrl}/${resource}/${id}`
          : `${apiUrl}/${resource}/show/${id}`;
      const res = await fetcher(url);
      if (!res.ok) return processErrorResponse(res);
      const body = await res.json();
      const data = body?.Data ?? body;
      return { data: data as never };
    },

    // ── create ───────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async ({ resource, variables }: CreateParams<any>) => {
      const res = await fetcher(`${apiUrl}/${resource}`, {
        method: "POST",
        body: JSON.stringify(variables),
      });
      if (!res.ok) return processErrorResponse(res);

      // Some endpoints return 201 Created with just the new ID (int)
      const body = await safeParseJson(res);
      if (body === null || body === undefined) {
        return { data: { ...(variables as object) } as never };
      }
      const data =
        typeof body === "number"
          ? { id: body, ...(variables as object) }
          : (body as object);
      return { data: data as never };
    },

    // ── update ───────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async ({ resource, id, variables }: UpdateParams<any>) => {
      const res = await fetcher(`${apiUrl}/${resource}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...(variables as object) }),
      });
      if (!res.ok) return processErrorResponse(res);

      const body = await safeParseJson(res);
      const data =
        body === null || body === undefined
          ? { id, ...(variables as object) }
          : (body as object);
      return { data: data as never };
    },

    // ── deleteOne ─────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteOne: async ({ resource, id }: DeleteOneParams<any>) => {
      const res = await fetcher(`${apiUrl}/${resource}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) return processErrorResponse(res);
      return { data: { id } as never };
    },

    // ── custom ────────────────────────────────────────────────────────────────
    // Refine v5 spreads config into this call, so config.query arrives as `query`
    custom: async ({ url, method, payload, headers, query }) => {
      // Append config.query as URL search params (e.g. ?entityType=Invoice&state=Active)
      let fullUrl = url;
      if (query && typeof query === "object" && Object.keys(query).length > 0) {
        const entries = Object.entries(query as Record<string, unknown>)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)] as [string, string]);
        if (entries.length > 0) {
          fullUrl = `${url}?${new URLSearchParams(entries).toString()}`;
        }
      }
      const res = await fetcher(fullUrl, {
        method: method?.toUpperCase() ?? "GET",
        body: payload ? JSON.stringify(payload) : undefined,
        headers: headers as HeadersInit | undefined,
      });
      if (!res.ok) return processErrorResponse(res);
      const body = await safeParseJson(res);
      return { data: (body ?? {}) as never };
    },
  };
}
