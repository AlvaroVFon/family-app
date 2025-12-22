import { ExceptionCode, ExceptionStatusCode } from '@core/exceptions';
import { ResponseStatusCode } from './responses.enum';

export interface ApiError {
  code: ExceptionCode;
  statusCode: ExceptionStatusCode;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  data: T | T[] | null;
  message: string;
  statusCode: ResponseStatusCode | ExceptionStatusCode;
  error: ApiError | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
