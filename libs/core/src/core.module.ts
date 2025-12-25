import { Module } from '@nestjs/common';
import { LoggerModule } from './logger';
import { CoreConfigModule } from './config';

@Module({
  imports: [LoggerModule, CoreConfigModule],
  providers: [],
  exports: [LoggerModule, CoreConfigModule],
})
export class CoreModule {}
