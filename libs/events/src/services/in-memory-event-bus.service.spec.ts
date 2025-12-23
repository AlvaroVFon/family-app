import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InMemoryEventBusService } from './in-memory-event-bus.service';
import { DomainEvent } from '../interfaces/domain-event.interface';

describe('InMemoryEventBusService', () => {
  let service: InMemoryEventBusService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InMemoryEventBusService,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<InMemoryEventBusService>(InMemoryEventBusService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should emit event through EventEmitter2', () => {
      // Arrange
      const event: DomainEvent<{ test: string }> = {
        eventName: 'test.event',
        aggregateId: 'test-123',
        payload: { test: 'data' },
        occurredAt: new Date(),
      };

      // Act
      service.publish(event);

      // Assert
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith('test.event', event);
    });

    it('should publish event with metadata', () => {
      // Arrange
      const event: DomainEvent<{ userId: string }> = {
        eventName: 'user.registered',
        aggregateId: 'user-456',
        payload: { userId: 'user-456' },
        occurredAt: new Date(),
        metadata: {
          userId: 'admin-123',
          correlationId: 'corr-789',
        },
      };

      // Act
      service.publish(event);

      // Assert
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.registered', event);
    });

    it('should handle multiple event publications', () => {
      // Arrange
      const event1: DomainEvent<any> = {
        eventName: 'first.event',
        aggregateId: 'agg-1',
        payload: {},
        occurredAt: new Date(),
      };

      const event2: DomainEvent<any> = {
        eventName: 'second.event',
        aggregateId: 'agg-2',
        payload: {},
        occurredAt: new Date(),
      };

      // Act
      service.publish(event1);
      service.publish(event2);

      // Assert
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenNthCalledWith(
        1,
        'first.event',
        event1,
      );
      expect(eventEmitter.emit).toHaveBeenNthCalledWith(
        2,
        'second.event',
        event2,
      );
    });
  });
});
