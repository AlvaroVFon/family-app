import { HttpException, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import {
  NotFoundException,
  UnauthorizedException,
  ExceptionCode,
} from '../exceptions';
import { Logger } from '../logger';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockLogger: jest.Mocked<Logger>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock request
    mockRequest = {
      url: '/test',
      method: 'GET',
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    filter = new HttpExceptionFilter(mockLogger);
  });

  describe('catch AppException', () => {
    it('should handle NotFoundException correctly', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Exception caught',
        expect.objectContaining({
          module: 'HttpExceptionFilter',
          path: '/test',
          method: 'GET',
          statusCode: 404,
          error: 'Resource not found',
        }),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: null,
        message: 'An unexpected error occurred',
        statusCode: 404,
        error: {
          code: ExceptionCode.NOT_FOUND,
          statusCode: 404,
          message: 'Resource not found',
        },
      });
    });

    it('should handle UnauthorizedException correctly', () => {
      const exception = new UnauthorizedException('Not authenticated');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: null,
        message: 'An unexpected error occurred',
        statusCode: 401,
        error: {
          code: ExceptionCode.UNAUTHORIZED,
          statusCode: 401,
          message: 'Not authenticated',
        },
      });
    });
  });

  describe('catch HttpException', () => {
    it('should handle NestJS HttpException', () => {
      const exception = new HttpException('Bad Request', 400);

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: null,
        message: 'An unexpected error occurred',
        statusCode: 400,
        error: {
          code: ExceptionCode.HTTP_EXCEPTION,
          statusCode: 400,
          message: 'Bad Request',
        },
      });
    });
  });

  describe('catch generic Error', () => {
    it('should handle unknown errors as 500', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception as any, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: null,
        message: 'An unexpected error occurred',
        statusCode: 500,
        error: {
          code: ExceptionCode.GENERIC_ERROR,
          statusCode: 500,
          message: 'Internal server error',
        },
      });
    });
  });

  describe('logging behavior', () => {
    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const exception = new NotFoundException('Test error');
      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Exception caught',
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const exception = new NotFoundException('Test error');
      filter.catch(exception, mockArgumentsHost);

      const logCall = mockLogger.error.mock.calls[0][1];
      expect(logCall).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
