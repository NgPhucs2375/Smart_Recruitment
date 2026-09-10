// ============== *** AGENT AI *** ============== //
// Sync với CVStateSnapshot ở Backend
export type CVState = {
  fullName: string;
  summary: string;
  experience: string;
  skills: string[];
};

// Agent state type (giống smart project)
export type AgentState = {
  cv: CVState;
};


// ============== *** Auth type *** ============== //
export type User ={
  Id: string;
  UserName: string;
  Email:string;
  Roles: string[];
  IsVerified: boolean;
};

export type LoginRequest ={
  Email: string;
  Password: string;
};

export type RegisterRequest ={
  Role: string;
  Email: string;
  UserName: string;
  Password: string;
  ConfirmPassword: string;
  HoTen: string;
  SDT: string;
  // Options employee fields
  ChucVu: string;
  TenDoanhNghiep: string;
  DiaChi: string;
  MoTa: string;
  Website: string;
  LogoUrl: string;
};

export type AuthResponse = {
  Id:string;
  UserName: string;
  Email:string;
  Roles: string[];
  IsVerified: boolean;
  JwtToken: string;
  RefreshToken: string;
};

export type ApiResponse<T> = {
  Succeeded: boolean;
  Message?: string;
  Errors?: string[];
  Data?: T;
};