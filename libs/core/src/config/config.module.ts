import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  AppConfigService,
  DatabaseConfigService,
  LoggerConfigService,
} from './services';

@Module({
  imports: [ConfigModule],
  providers: [AppConfigService, LoggerConfigService, DatabaseConfigService],
  exports: [AppConfigService, LoggerConfigService, DatabaseConfigService],
})
export class CoreConfigModule {}
