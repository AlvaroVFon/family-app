import { AppException } from './app.exception';
import { ExceptionCode, ExceptionStatusCode } from './exception-code.enum';

export class UnauthorizedException extends AppException {
  constructor(message: string, details?: any) {
    super(
      message,
      ExceptionCode.UNAUTHORIZED,
      ExceptionStatusCode.UNAUTHORIZED,
      details,
    );
  }
}
