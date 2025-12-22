import { AppException } from './app.exception';
import { ExceptionCode, ExceptionStatusCode } from './exception-code.enum';

export class ForbiddenException extends AppException {
  constructor(message: string, details?: any) {
    super(
      message,
      ExceptionCode.FORBIDDEN,
      ExceptionStatusCode.FORBIDDEN,
      details,
    );
  }
}
