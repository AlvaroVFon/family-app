import { Test, TestingModule } from '@nestjs/testing';
import { EventsModule } from './events.module';
import { INJECT_EVENT_BUS } from './interfaces/event-bus.interface';
import { InMemoryEventBusService } from './services/in-memory-event-bus.service';

describe('EventsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EventsModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide EventBus through INJECT_EVENT_BUS token', () => {
    const eventBus = module.get(INJECT_EVENT_BUS);
    expect(eventBus).toBeDefined();
    expect(eventBus).toBeInstanceOf(InMemoryEventBusService);
  });

  it('should export EventBus provider', () => {
    const exports = Reflect.getMetadata('exports', EventsModule);
    expect(exports).toContain(INJECT_EVENT_BUS);
  });
});
