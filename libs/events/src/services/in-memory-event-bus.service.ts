import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '../interfaces/event-bus.interface';
import { DomainEvent } from '@events/interfaces/domain-event.interface';

@Injectable()
export class InMemoryEventBusService implements EventBus {
  constructor(private eventEmitter: EventEmitter2) {}

  publish<T>(event: DomainEvent<T>): void {
    this.eventEmitter.emit(event.eventName, event);
  }
}
