import { Test, TestingModule } from '@nestjs/testing';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsModule } from './events.module';
import { INJECT_EVENT_BUS } from './interfaces/event-bus.interface';
import type { EventBus, DomainEvent } from '@events';

interface TestPayload {
  data: string;
}

@Injectable()
class TestListener {
  public receivedEvents: DomainEvent<TestPayload>[] = [];

  @OnEvent('test.integration')
  handleTestEvent(event: DomainEvent<TestPayload>) {
    this.receivedEvents.push(event);
  }
}

@Injectable()
class TestPublisher {
  constructor(@Inject(INJECT_EVENT_BUS) private readonly eventBus: EventBus) {}

  publishEvent(data: string) {
    const event: DomainEvent<TestPayload> = {
      eventName: 'test.integration',
      aggregateId: 'test-agg',
      payload: { data },
      occurredAt: new Date(),
    };

    this.eventBus.publish(event);
  }
}

describe('Events Integration', () => {
  let module: TestingModule;
  let publisher: TestPublisher;
  let listener: TestListener;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EventsModule],
      providers: [TestPublisher, TestListener],
    }).compile();

    await module.init();

    publisher = module.get<TestPublisher>(TestPublisher);
    listener = module.get<TestListener>(TestListener);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should publish and receive events end-to-end', async () => {
    // Act
    publisher.publishEvent('test data 1');
    publisher.publishEvent('test data 2');

    // Wait for async event processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert
    expect(listener.receivedEvents).toHaveLength(2);
    expect(listener.receivedEvents[0].payload.data).toBe('test data 1');
    expect(listener.receivedEvents[1].payload.data).toBe('test data 2');
  });

  it('should include event metadata in published events', async () => {
    // Arrange
    const eventBus = module.get<EventBus>(INJECT_EVENT_BUS);

    const eventWithMetadata: DomainEvent<TestPayload> = {
      eventName: 'test.integration',
      aggregateId: 'test-meta',
      payload: { data: 'metadata test' },
      occurredAt: new Date(),
      metadata: {
        userId: 'user-123',
        correlationId: 'corr-456',
      },
    };

    // Act
    eventBus.publish(eventWithMetadata);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert
    const receivedEvent = listener.receivedEvents.find(
      (e) => e.aggregateId === 'test-meta',
    );
    expect(receivedEvent).toBeDefined();
    expect(receivedEvent?.metadata).toEqual({
      userId: 'user-123',
      correlationId: 'corr-456',
    });
  });
});
