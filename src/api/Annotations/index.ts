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
  AnnotationCreatePayload,
  AnnotationReviewPayload,
  AnnotationSubmitResponse,
  AnnotationUpdatePayload,
  AnnotationsResponse,
  ApiMessageResponse,
  ApiRequest,
  ReviewQueueResponse,
} from "~/types/api";
import type { Annotation, AnnotationReview, ID } from "~/types/models";

export class Annotations {
  static create(itemId: ID, payload: AnnotationCreatePayload): ApiRequest<Annotation> {
    return Api.post<Annotation, AnnotationCreatePayload>(`/items/${itemId}/annotations`, payload);
  }

  static listByItem(itemId: ID): ApiRequest<AnnotationsResponse> {
    return Api.get<AnnotationsResponse>(`/items/${itemId}/annotations`);
  }

  static get(annotationId: ID): ApiRequest<Annotation> {
    return Api.get<Annotation>(`/annotations/${annotationId}`);
  }

  static update(annotationId: ID, payload: AnnotationUpdatePayload): ApiRequest<Annotation> {
    return Api.patch<Annotation, AnnotationUpdatePayload>(`/annotations/${annotationId}`, payload);
  }

  static delete(annotationId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/annotations/${annotationId}`);
  }

  static submit(annotationId: ID): ApiRequest<AnnotationSubmitResponse> {
    return Api.post<AnnotationSubmitResponse>(`/annotations/${annotationId}/submit`);
  }

  static reviewQueue(projectId: ID, params?: Record<string, unknown>): ApiRequest<ReviewQueueResponse> {
    return Api.get<ReviewQueueResponse>(`/projects/${projectId}/review-queue`, { params });
  }

  static review(annotationId: ID, payload: AnnotationReviewPayload): ApiRequest<AnnotationReview> {
    return Api.post<AnnotationReview, AnnotationReviewPayload>(`/annotations/${annotationId}/review`, payload);
  }
}
