import { ExceptionStatusCode } from '@core/exceptions';
import {
  ResponseStatusCode,
  ResponseMessage,
  ErrorMessage,
} from './responses.enum';
import {
  ApiResponse,
  ApiError,
  PaginatedResponse,
} from './responses.interfaces';

export function successResponse<T>(
  data: T | T[],
  message: ResponseMessage = ResponseMessage.SUCCESS,
  statusCode: ResponseStatusCode = ResponseStatusCode.SUCCESS,
): ApiResponse<T> {
  return {
    data,
    message,
    statusCode,
    error: null,
  };
}

export function errorResponse<T = null>(
  error: ApiError,
  statusCode: ExceptionStatusCode,
  message: ErrorMessage = ErrorMessage.GENERIC_ERROR,
): ApiResponse<T> {
  return {
    data: null,
    message,
    statusCode,
    error,
  };
}

export function paginatedResponse<T>(
  data: T[],
  totalCount: number,
  currentPage: number,
  pageSize: number,
  message: ResponseMessage = ResponseMessage.SUCCESS,
  statusCode: ResponseStatusCode = ResponseStatusCode.SUCCESS,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    message,
    statusCode,
    error: null,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
  };
}
