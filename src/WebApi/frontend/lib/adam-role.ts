/** Role bucket used to gate Adam UI, frontend tools and navigation targets. */
export type AdamRole = "candidate" | "recruiter" | "blocked";

const CANDIDATE_ROLE = "UNG_VIEN";
const RECRUITER_ROLES = ["NHAN_SU", "NGUOI_DAI_DIEN"];

/**
 * Mirrors the backend ScopedRecommenAdamAgent role switch:
 * - UNG_VIEN -> candidate
 * - NHAN_SU / NGUOI_DAI_DIEN -> recruiter
 * - everyone else (including QUAN_TRI_VIEN) -> blocked
 */
export function resolveAdamRole(roles: readonly string[] | null | undefined): AdamRole {
  if (!roles || roles.length === 0) return "blocked";
  if (roles.includes(CANDIDATE_ROLE)) return "candidate";
  if (RECRUITER_ROLES.some((role) => roles.includes(role))) return "recruiter";
  return "blocked";
}
