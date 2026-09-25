export interface MetricItem {
  Key: string;
  Label: string;
  Value: number;
  ChangePercent: number | null;
}

export interface GrowthPoint {
  Date: string;
  Users: number;
  Jobs: number;
  Applications: number;
  Cvs: number;
}

export interface NamedValue {
  Name: string;
  Value: number;
}

export interface SkillDemand {
  Name: string;
  Demand: number;
  Supply: number;
  Gap: number;
}

export interface SalaryItem {
  Name: string;
  Average: number;
}

export interface ActivityItem {
  At: string;
  Type: string;
  Description: string;
  Entity: string;
}

export interface AdminDashboardData {
  GeneratedAtUtc: string;
  PeriodDays: number;
  Summary: MetricItem[];
  Growth: GrowthPoint[];
  JobStatus: NamedValue[];
  ApplicationStatus: NamedValue[];
  UserRoles: NamedValue[];
  Geography: NamedValue[];
  TopCategories: NamedValue[];
  SkillDemand: SkillDemand[];
  SalaryByCategory: SalaryItem[];
  CvMethods: NamedValue[];
  CvProcessing: { Successful: number; Failed: number; Pending: number };
  Recommendation: { Total: number; AverageMatchPercent: number | null; HighMatchCount: number };
  Moderation: { AdminPending: number; SystemPending: number; RepresentativePending: number; LockedJobs: number };
  Security: { LockedAccounts: number; AccountsWithFailedAccess: number; UnconfirmedEmails: number; TwoFactorEnabled: number };
  Health: { Name: string; Status: string; IsTracked: boolean }[];
  RecentActivity: ActivityItem[];
  DataLimitations: string[];
}

export type DashboardPeriod = 7 | 30 | 90 | 365;
