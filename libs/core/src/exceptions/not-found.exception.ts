import { AppException } from './app.exception';
import { ExceptionCode, ExceptionStatusCode } from './exception-code.enum';

export class NotFoundException extends AppException {
  constructor(message: string, details?: any) {
    super(
      message,
      ExceptionCode.NOT_FOUND,
      ExceptionStatusCode.NOT_FOUND,
      details,
    );
  }
}
