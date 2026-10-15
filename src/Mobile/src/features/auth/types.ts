export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  userName: string;
  fullname: string;
  roles: string[];
  avatarUrl?: string;
};
