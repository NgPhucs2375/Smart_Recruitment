import axios, {
     AxiosError,
     AxiosInstance,
     InternalAxiosRequestConfig
} from "axios";
import {
    ApiResponse,
    AuthResponse
} from "@/lib/types/Auth";

// ====**** Base Instance ****==== //
const API_BASE_URL = 
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers:{
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

// ====**** HELPER QL TOKEN (LOCAL STORAGE) ****==== //
// token jwt
export const getAccessToken = (): string | null =>{
    if(typeof window !== "undefined") return null;
    return localStorage.getItem("accessToken") || localStorage.getItem("jwtToken");
};

// refresh token 
export const getRefreshToken = (): string | null =>{
    if(typeof window !== "undefined") return null;
    return localStorage.getItem("refreshToken");
};

// 
export const setAuthTokens = (jwtToken: string, refreshToken: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", jwtToken);
  localStorage.setItem("jwtToken", jwtToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const clearAuthTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("refreshToken");
};

// ====**** Hang doi Mutex xu ly refresh token dong thoi ****==== //
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// ==========================================
// 4. REQUEST INTERCEPTOR (ATTACH JWT)
// ==========================================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

// ==========================================
// 5. RESPONSE INTERCEPTOR (401 & AUTO RETRY)
// ==========================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Nếu không phải lỗi 401 hoặc request này đã từng được thử lại
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(normalizeApiError(error));
    }

    // Tránh vòng lặp vô hạn khi endpoint Refresh Token hoặc Login bị 401
    const requestUrl = originalRequest.url || "";
    if (
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/auth/login")
    ) {
      clearAuthTokens();
      return Promise.reject(normalizeApiError(error));
    }

    // Nếu đang có 1 tiến trình Refresh Token chạy ngầm, đẩy các request sau vào Queue
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(normalizeApiError(err)));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    const jwtToken = getAccessToken();

    // Không có Refresh Token -> Xóa session và chuyển hướng đăng nhập
    if (!refreshToken) {
      isRefreshing = false;
      clearAuthTokens();
      redirectToLogin();
      return Promise.reject(normalizeApiError(error));
    }

    try {
      // Gọi trực tiếp axios instance độc lập để tránh bị interceptor chặn lặp
      const refreshResponse = await axios.post<ApiResponse<AuthResponse>>(
        `${API_BASE_URL}/auth/refresh-token`,
        {
          JwtToken: jwtToken,
          RefreshToken: refreshToken,
        }
      );

      const authData = refreshResponse.data?.Data;

      if (refreshResponse.data?.Succeeded && authData?.JwtToken) {
        setAuthTokens(authData.JwtToken, authData.RefreshToken);
        processQueue(null, authData.JwtToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${authData.JwtToken}`;
        }

        return apiClient(originalRequest);
      } else {
        throw new Error(refreshResponse.data?.Message || "Làm mới phiên thất bại.");
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthTokens();
      redirectToLogin();
      return Promise.reject(normalizeApiError(refreshError));
    } finally {
      isRefreshing = false;
    }
  }
);

// ==========================================
// 6. CHUẨN HÓA LỖI THEO FORMAT Response<T>
// ==========================================
export function normalizeApiError(error: unknown): ApiResponse<unknown> {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiResponse<unknown>;
    return {
      Succeeded: false,
      Message:
        data.Message ||
        error.message ||
        "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
      Errors: data.Errors || [error.message],
      Data: data.Data,
    };
  }

  return {
    Succeeded: false,
    Message:
      error instanceof Error
        ? error.message
        : "Không thể kết nối đến máy chủ Backend.",
    Errors: [error instanceof Error ? error.message : "Network/Unknown Error"],
  };
}

function redirectToLogin(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export default apiClient;