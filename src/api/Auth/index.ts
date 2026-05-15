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

import Api from "~/helpers/api";
import type { ApiRequest, AuthResponse, LoginPayload, PasswordChangePayload, RegisterPayload } from "~/types/api";
import type { User } from "~/types/models";

export class Auth {
  static register(payload: RegisterPayload): ApiRequest<AuthResponse> {
    return Api.post<AuthResponse, RegisterPayload>("/auth/register", payload, { withAuth: false });
  }

  static login(payload: LoginPayload): ApiRequest<AuthResponse> {
    return Api.post<AuthResponse, LoginPayload>("/auth/login", payload, { withAuth: false });
  }

  static me(): ApiRequest<User> {
    return Api.get<User>("/auth/me");
  }

  static changePassword(payload: PasswordChangePayload): ApiRequest<User> {
    return Api.post<User, PasswordChangePayload>("/auth/password/change", payload);
  }
}
