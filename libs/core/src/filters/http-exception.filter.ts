import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  AppException,
  ExceptionCode,
  ExceptionStatusCode,
} from '../exceptions';
import { errorResponse, ApiResponse } from '../responses';
import type { Logger } from '../logger';
import { INJECT_LOGGER } from '../logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(INJECT_LOGGER) private readonly logger: Logger) {}

  catch(exception: HttpException | AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let apiError: ApiResponse<null>;

    if (exception instanceof HttpException) {
      apiError = this.handleHttpException(exception);
      status = exception.getStatus();
    } else if (exception instanceof AppException) {
      apiError = this.handleAppException(exception);
      status = exception.statusCode || ExceptionStatusCode.GENERIC_ERROR;
    } else {
      apiError = this.handleGenericException();
      status = ExceptionStatusCode.GENERIC_ERROR;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    this.logger.error('Exception caught', {
      module: 'HttpExceptionFilter',
      path: request.url,
      method: request.method,
      statusCode: status,
      error: exception.message,
      ...(isProduction ? {} : { stack: exception.stack }),
    });

    response.status(status).json(apiError);
  }

  handleHttpException(exception: HttpException): ApiResponse<null> {
    const status = exception.getStatus();
    const message = exception.message || 'Unexpected error';

    return errorResponse(
      {
        code: ExceptionCode.HTTP_EXCEPTION,
        statusCode: status,
        message,
      },
      status,
    );
  }

  handleAppException(exception: AppException): ApiResponse<null> {
    const status = exception.statusCode || ExceptionStatusCode.GENERIC_ERROR;

    return errorResponse(
      {
        code: exception.code,
        statusCode: exception.statusCode,
        message: exception.message,
      },
      status,
    );
  }

  handleGenericException() {
    const status = ExceptionStatusCode.GENERIC_ERROR;

    return errorResponse(
      {
        code: ExceptionCode.GENERIC_ERROR,
        statusCode: ExceptionStatusCode.GENERIC_ERROR,
        message: 'Internal server error',
      },
      status,
    );
  }
}
