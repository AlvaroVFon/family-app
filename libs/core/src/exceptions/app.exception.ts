import { ExceptionCode, ExceptionStatusCode } from './exception-code.enum';

export class AppException extends Error {
  constructor(
    readonly message: string,
    readonly code: ExceptionCode,
    readonly statusCode: ExceptionStatusCode = ExceptionStatusCode.GENERIC_ERROR,
    readonly details?: any,
  ) {
    super(message);
    this.name = 'AppException';
  }
}
