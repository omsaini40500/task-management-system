const BASE_URL = "https://backend-4f8z.onrender.com/api/v1";

export interface ApiError {
  detail: string;
  status?: number;
}

class ApiClient {
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    customHeaders?: Record<string, string>,
    _isRetry = false
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      ...customHeaders,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json"
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (res.status === 401 && !_isRetry) {
      // Try silent refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request(method, path, body, customHeaders, true);
      }
      throw new Error("Session expired");
    }

    const text = await res.text();

    if (!res.ok) {
      let err: ApiError = { detail: "Request failed" };
      if (text) {
        err = JSON.parse(text) as ApiError;
      }
      err.status = res.status;
      throw err;
    }

    if (res.status === 204 || !text) {
      return undefined as unknown as T;
    }

    return JSON.parse(text) as T;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }
  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

export const api = new ApiClient();
