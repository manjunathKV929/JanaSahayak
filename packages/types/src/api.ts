export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ApiMeta {
  requestId: string;
}

export interface ApiPaginationMeta extends ApiMeta {
  nextCursor?: string;
  hasMore: boolean;
}

export interface ApiSuccessResponse<T, M extends ApiMeta = ApiMeta> {
  data: T;
  meta: M;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
  meta: ApiMeta;
}

export interface HealthCheckPayload {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
}

export interface ReadinessCheckPayload {
  status: 'ready' | 'not_ready';
  service: string;
  version: string;
  timestamp: string;
  checks: {
    database: 'up' | 'down' | 'not_configured';
  };
}
