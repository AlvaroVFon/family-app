import { DomainEvent } from './domain-event.interface';

export const INJECT_EVENT_BUS = Symbol('INJECT_EVENT_BUS');

export interface EventBus {
  publish<T>(event: DomainEvent<T>): void;
}
