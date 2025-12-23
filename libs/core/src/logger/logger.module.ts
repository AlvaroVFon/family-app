import { Module } from '@nestjs/common';
import { ConsoleLogger } from './console-logger.service';
import { INJECT_LOGGER } from './logger.interface';
import { CoreConfigModule } from '../config/config.module';

@Module({
  imports: [CoreConfigModule],
  providers: [
    {
      provide: INJECT_LOGGER,
      useClass: ConsoleLogger,
    },
  ],
  exports: [INJECT_LOGGER],
})
export class LoggerModule {}
