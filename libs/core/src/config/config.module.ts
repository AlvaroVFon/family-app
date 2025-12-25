import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  AppConfigService,
  DatabaseConfigService,
  LoggerConfigService,
  MailConfigService,
} from './services';

@Module({
  imports: [ConfigModule],
  providers: [
    AppConfigService,
    LoggerConfigService,
    DatabaseConfigService,
    MailConfigService,
  ],
  exports: [
    AppConfigService,
    LoggerConfigService,
    DatabaseConfigService,
    MailConfigService,
  ],
})
export class CoreConfigModule {}
