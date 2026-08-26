"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
} from "@/lib/types";
import {
  apiClient,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  normalizeApiError,
} from "@/lib/api";

// ==========================================
// 1. ĐỊNH NGHĨA CONTEXT INTERFACE
// ==========================================
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// 2. AUTH PROVIDER COMPONENT
// ==========================================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const router = useRouter();

  // Đăng xuất: Dọn dẹp session và chuyển hướng
  const logout = useCallback(() => {
    clearAuthTokens();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      router.push("/login");
    }
  }, [router]);

  // Khởi tạo và kiểm tra phiên xác thực khi ứng dụng mount
  useEffect(() => {
    const initializeAuthSession = async () => {
      const storedAccessToken = getAccessToken();
      const storedRefreshToken = getRefreshToken();

      if (!storedAccessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get<ApiResponse<User>>("/account/me");
        const apiResponse = response.data;

        if (apiResponse.Succeeded && apiResponse.Data) {
          setUser(apiResponse.Data);
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuthSession();
  }, [logout]);

  // Xử lý đăng nhập
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const payload: LoginRequest = {
        Email: email,
        Password: password,
      };

      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/account/authenticate",
        payload
      );

      const apiResult = response.data;

      if (apiResult.Succeeded && apiResult.Data) {
        const authData = apiResult.Data;

        // Lưu trữ Token vào localStorage
        setAuthTokens(authData.JwtToken, authData.RefreshToken);

        // Cập nhật State nội bộ
        setAccessToken(authData.JwtToken);
        setRefreshToken(authData.RefreshToken);

        const authenticatedUser: User = {
          Id: authData.Id,
          UserName: authData.UserName,
          Email: authData.Email,
          Roles: authData.Roles,
          IsVerified: authData.IsVerified,
        };

        setUser(authenticatedUser);
        setIsAuthenticated(true);
      } else {
        throw new Error(apiResult.Message || "Xác thực tài khoản không thành công.");
      }
    } catch (error) {
      throw normalizeApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng ký tài khoản
  const register = async (data: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<ApiResponse<string>>(
        "/account/register",
        data
      );

      const apiResult = response.data;

      if (apiResult.Succeeded) {
        router.push("/login");
      } else {
        throw new Error(apiResult.Message || "Đăng ký tài khoản không thành công.");
      }
    } catch (error) {
      throw normalizeApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// 3. CUSTOM HOOK EXPORT
// ==========================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong phạm vi của AuthProvider.");
  }
  return context;
};