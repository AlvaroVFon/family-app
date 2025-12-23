import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { INJECT_EVENT_BUS } from './interfaces/event-bus.interface';
import { InMemoryEventBusService } from './services/in-memory-event-bus.service';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    {
      provide: INJECT_EVENT_BUS,
      useClass: InMemoryEventBusService,
    },
  ],
  exports: [INJECT_EVENT_BUS],
})
export class EventsModule {}
