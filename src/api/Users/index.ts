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
import type { ApiMessageResponse, ApiRequest, UserListResponse, UserUpdatePayload } from "~/types/api";
import type { ID, User } from "~/types/models";

export class Users {
  static list(params?: Record<string, unknown>): ApiRequest<UserListResponse> {
    return Api.get<UserListResponse>("/users", { params });
  }

  static get(userId: ID): ApiRequest<User> {
    return Api.get<User>(`/users/${userId}`);
  }

  static update(userId: ID, payload: UserUpdatePayload): ApiRequest<User> {
    return Api.patch<User, UserUpdatePayload>(`/users/${userId}`, payload);
  }

  static delete(userId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/users/${userId}`);
  }
}
