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
import type {
  ApiMessageResponse,
  ApiRequest,
  ProjectCreatePayload,
  ProjectListResponse,
  ProjectMemberCreatePayload,
  ProjectMemberUpdatePayload,
  ProjectMembersResponse,
  ProjectPurgeResponse,
  ProjectUpdatePayload,
} from "~/types/api";
import type { ID, Project, ProjectMember } from "~/types/models";

export class Projects {
  static create(payload: ProjectCreatePayload): ApiRequest<Project> {
    return Api.post<Project, ProjectCreatePayload>("/projects", payload);
  }

  static list(params?: Record<string, unknown>): ApiRequest<ProjectListResponse> {
    return Api.get<ProjectListResponse>("/projects", { params });
  }

  static get(projectId: ID): ApiRequest<Project> {
    return Api.get<Project>(`/projects/${projectId}`);
  }

  static update(projectId: ID, payload: ProjectUpdatePayload): ApiRequest<Project> {
    return Api.patch<Project, ProjectUpdatePayload>(`/projects/${projectId}`, payload);
  }

  static delete(projectId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/projects/${projectId}`);
  }

  static purge(projectId: ID): ApiRequest<ProjectPurgeResponse> {
    return Api.delete<ProjectPurgeResponse>(`/projects/${projectId}/purge`);
  }

  static activate(projectId: ID): ApiRequest<Project> {
    return Api.post<Project>(`/projects/${projectId}/activate`);
  }

  static archive(projectId: ID): ApiRequest<Project> {
    return Api.post<Project>(`/projects/${projectId}/archive`);
  }

  static listMembers(projectId: ID): ApiRequest<ProjectMembersResponse> {
    return Api.get<ProjectMembersResponse>(`/projects/${projectId}/members`);
  }

  static addMember(projectId: ID, payload: ProjectMemberCreatePayload): ApiRequest<ProjectMember> {
    return Api.post<ProjectMember, ProjectMemberCreatePayload>(`/projects/${projectId}/members`, payload);
  }

  static updateMember(projectId: ID, memberId: ID, payload: ProjectMemberUpdatePayload): ApiRequest<ProjectMember> {
    return Api.patch<ProjectMember, ProjectMemberUpdatePayload>(`/projects/${projectId}/members/${memberId}`, payload);
  }

  static removeMember(projectId: ID, memberId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/projects/${projectId}/members/${memberId}`);
  }
}
