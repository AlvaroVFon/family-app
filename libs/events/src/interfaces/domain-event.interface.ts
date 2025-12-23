import { Events } from '@events/enums/events.enum';

export interface DomainEvent<T = any> {
  eventName: Events | string;
  aggregateId: string;
  payload: T;
  occurredAt: Date;
  metadata?: {
    userId?: string;
    correlationId?: string;
  };
}
