import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailConfig } from '../interfaces/mail.config';

@Injectable()
export class MailConfigService implements MailConfig {
  constructor(private readonly configService: ConfigService) {}

  get provider(): string {
    return this.configService.get<string>('MAIL_PROVIDER', 'smtp');
  }

  get port(): number {
    return this.configService.get<number>('MAIL_PORT', 587);
  }

  get user(): string {
    return this.configService.get<string>('MAIL_USER', 'user@example.com');
  }

  get password(): string {
    return this.configService.get<string>('MAIL_PASSWORD', 'password');
  }
}
