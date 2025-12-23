import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService, LoggerConfigService } from './services';

@Module({
  imports: [ConfigModule],
  providers: [AppConfigService, LoggerConfigService],
  exports: [AppConfigService, LoggerConfigService],
})
export class CoreConfigModule {}
