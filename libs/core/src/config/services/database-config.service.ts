import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../interfaces/database.config';

@Injectable()
export class DatabaseConfigService implements DatabaseConfig {
  constructor(private readonly configService: ConfigService) {}

  get host(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }

  get port(): number {
    return this.configService.get<number>('DB_PORT', 27017);
  }

  get username(): string {
    return this.configService.get<string>('DB_USERNAME', 'mongoUser');
  }

  get password(): string {
    return this.configService.get<string>('DB_PASSWORD', 'mongoPass');
  }

  get databaseName(): string {
    return this.configService.get<string>('DB_NAME', 'family-app');
  }
}
