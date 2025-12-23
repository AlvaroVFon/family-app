import { Module } from '@nestjs/common';
import { AppConfigService, LoggerConfigService } from './services';

@Module({
  providers: [AppConfigService, LoggerConfigService],
  exports: [AppConfigService, LoggerConfigService],
})
export class CoreConfigModule {}
