// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : index.ts
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Friday May 15 2026
//
// =============================================================

import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL, API_TIMEOUT } from "~/constants/app";
import { readStorage } from "~/helpers/Storage";
import type { AuthSession } from "~/types/auth";
import type { ApiErrorResponse, ApiRequest, ApiRequestConfig } from "~/types/api";

const AUTH_STORAGE_KEY = "auth.session";

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

class ApiHelper {
  private readonly instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  constructor() {
    this.instance.interceptors.request.use((config) => this.handleRequest(config));

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && error.config?.withAuth !== false) {
          unauthorizedHandler?.();
        }

        return Promise.reject(error);
      },
    );
  }

  private handleRequest(config: InternalAxiosRequestConfig & ApiRequestConfig) {
    const nextConfig = config;
    const session = readStorage<AuthSession>(AUTH_STORAGE_KEY);
    const token = session?.access_token;

    if (nextConfig.withAuth !== false && token) {
      nextConfig.headers.set("Authorization", `Bearer ${token}`);
    }

    return nextConfig;
  }

  get<T>(url: string, config?: ApiRequestConfig): ApiRequest<T> {
    return this.instance.get<T>(url, config);
  }

  post<T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig): ApiRequest<T> {
    return this.instance.post<T>(url, data, config);
  }

  put<T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig): ApiRequest<T> {
    return this.instance.put<T>(url, data, config);
  }

  patch<T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig): ApiRequest<T> {
    return this.instance.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: ApiRequestConfig): ApiRequest<T> {
    return this.instance.delete<T>(url, config);
  }

  getClient() {
    return this.instance;
  }
}

const Api = new ApiHelper();

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;

  const candidate = error as {
    message?: unknown;
    response?: {
      data?: ApiErrorResponse;
    };
  };

  const standardMessage = candidate.response?.data?.error?.message;

  if (typeof standardMessage === "string" && standardMessage.trim()) {
    return standardMessage;
  }

  const detail = candidate.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  const message = candidate.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  return fallback;
}

export function withNoCache(config?: ApiRequestConfig): ApiRequestConfig {
  return {
    ...config,
    headers: {
      ...config?.headers,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    },
    params: {
      ...config?.params,
      _: Date.now(),
    },
  };
}

export default Api;