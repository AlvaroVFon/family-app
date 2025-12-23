import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../interfaces';

@Injectable()
export class AppConfigService implements AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get env(): 'development' | 'production' | 'test' {
    return this.configService.getOrThrow<'development' | 'production' | 'test'>(
      'NODE_ENV',
    );
  }

  get serviceName(): string {
    return this.configService.getOrThrow<string>('SERVICE_NAME');
  }

  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }
}
