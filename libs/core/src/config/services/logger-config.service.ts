import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerConfig } from '../interfaces';

@Injectable()
export class LoggerConfigService implements LoggerConfig {
  constructor(private readonly configService: ConfigService) {}

  get level(): 'debug' | 'info' | 'warn' | 'error' {
    return this.configService.get<'debug' | 'info' | 'warn' | 'error'>(
      'LOG_LEVEL',
      'info',
    );
  }

  get format(): 'json' | 'pretty' {
    return this.configService.get<'json' | 'pretty'>('LOG_FORMAT', 'json');
  }

  get includeTimestamp(): boolean {
    const value = this.configService.get<string>(
      'LOG_INCLUDE_TIMESTAMP',
      'true',
    );
    return value === 'true' || value === '1';
  }
}
