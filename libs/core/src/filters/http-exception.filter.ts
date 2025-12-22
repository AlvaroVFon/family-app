import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AppException,
  ExceptionCode,
  ExceptionStatusCode,
} from '@core/exceptions';
import { errorResponse, ApiResponse } from '@core/responses';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

    //TODO: Add Logging using @core/logger

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
