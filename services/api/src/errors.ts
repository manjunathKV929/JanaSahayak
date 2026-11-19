import type {
  ApiErrorCode,
  ApiErrorDetail,
  ApiErrorResponse,
  ApiMeta,
  ApiSuccessResponse,
} from '@janasahayak/types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function buildSuccessResponse<T, M extends ApiMeta = ApiMeta>(
  data: T,
  meta: M,
): ApiSuccessResponse<T, M> {
  return { data, meta };
}

export function buildErrorResponse(
  code: ApiErrorCode,
  message: string,
  requestId: string,
  details: ApiErrorDetail[] = [],
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId,
    },
  };
}

export function mapStatusCodeToErrorCode(statusCode: number): ApiErrorCode {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_ERROR';
  }
}
