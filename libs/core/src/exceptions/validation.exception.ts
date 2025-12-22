import { AppException } from './app.exception';
import { ExceptionCode, ExceptionStatusCode } from './exception-code.enum';

export class ValidationException extends AppException {
  constructor(message: string, details?: any) {
    super(
      message,
      ExceptionCode.VALIDATION_ERROR,
      ExceptionStatusCode.VALIDATION_ERROR,
      details,
    );
  }
}
