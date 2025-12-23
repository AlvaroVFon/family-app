import {
  AppException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ValidationException,
  ExceptionCode,
  ExceptionStatusCode,
} from './index';

describe('AppException', () => {
  it('should create exception with all properties', () => {
    const exception = new AppException(
      'Test error',
      ExceptionCode.GENERIC_ERROR,
      ExceptionStatusCode.GENERIC_ERROR,
      { extra: 'data' },
    );

    expect(exception.message).toBe('Test error');
    expect(exception.code).toBe(ExceptionCode.GENERIC_ERROR);
    expect(exception.statusCode).toBe(ExceptionStatusCode.GENERIC_ERROR);
    expect(exception.details).toEqual({ extra: 'data' });
    expect(exception.name).toBe('AppException');
  });

  it('should create exception without details', () => {
    const exception = new AppException(
      'Test error',
      ExceptionCode.NOT_FOUND,
      ExceptionStatusCode.NOT_FOUND,
    );

    expect(exception.details).toBeUndefined();
  });
});

describe('NotFoundException', () => {
  it('should create with correct code and status', () => {
    const exception = new NotFoundException('Resource not found');

    expect(exception.message).toBe('Resource not found');
    expect(exception.code).toBe(ExceptionCode.NOT_FOUND);
    expect(exception.statusCode).toBe(ExceptionStatusCode.NOT_FOUND);
    expect(exception.statusCode).toBe(404);
  });

  it('should accept details parameter', () => {
    const exception = new NotFoundException('User not found', {
      userId: '123',
    });

    expect(exception.details).toEqual({ userId: '123' });
  });
});

describe('UnauthorizedException', () => {
  it('should create with correct code and status', () => {
    const exception = new UnauthorizedException('Not authenticated');

    expect(exception.message).toBe('Not authenticated');
    expect(exception.code).toBe(ExceptionCode.UNAUTHORIZED);
    expect(exception.statusCode).toBe(ExceptionStatusCode.UNAUTHORIZED);
    expect(exception.statusCode).toBe(401);
  });
});

describe('ForbiddenException', () => {
  it('should create with correct code and status', () => {
    const exception = new ForbiddenException('Access denied');

    expect(exception.message).toBe('Access denied');
    expect(exception.code).toBe(ExceptionCode.FORBIDDEN);
    expect(exception.statusCode).toBe(ExceptionStatusCode.FORBIDDEN);
    expect(exception.statusCode).toBe(403);
  });
});

describe('ValidationException', () => {
  it('should create with correct code and status', () => {
    const exception = new ValidationException('Invalid input', {
      fields: ['email', 'password'],
    });

    expect(exception.message).toBe('Invalid input');
    expect(exception.code).toBe(ExceptionCode.VALIDATION_ERROR);
    expect(exception.statusCode).toBe(ExceptionStatusCode.VALIDATION_ERROR);
    expect(exception.statusCode).toBe(400);
    expect(exception.details).toEqual({ fields: ['email', 'password'] });
  });
});
