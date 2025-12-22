import { Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { LoggerModule } from './logger';

@Module({
  imports: [LoggerModule],
  providers: [CoreService],
  exports: [CoreService, LoggerModule],
})
export class CoreModule {}
