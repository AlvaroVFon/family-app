# Events Library

> Librería de comunicación basada en eventos para desacoplamiento de módulos en arquitectura de Monolito Modular

## Tabla de Contenidos

- [Filosofía](#filosofía)
- [Contratos Técnicos](#contratos-técnicos)
- [Implementación](#implementación)
- [Reglas de Ownership](#reglas-de-ownership)
- [Guía de Uso](#guía-de-uso)
- [Evolución y Escalabilidad](#evolución-y-escalabilidad)

---

## Filosofía

Esta librería implementa un **Event-Driven Architecture (EDA)** dentro de un monolito modular, permitiendo el **desacoplamiento total entre módulos** mediante comunicación asíncrona basada en eventos.

### Principios Fundamentales

| Principio                     | Descripción                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Desacoplamiento**           | El emisor (publisher) no conoce a los receptores (subscribers). No hay dependencias directas entre módulos.             |
| **Past Tense**                | Los eventos representan **hechos que ya ocurrieron**. Ejemplo: `user.registered`, `order.created`, `payment.processed`. |
| **Contrato Ligero**           | Los payloads contienen únicamente IDs y datos mínimos del cambio, nunca entidades completas de base de datos.           |
| **Inversión de Dependencias** | Los módulos dependen de abstracciones (`EventBus`), no de implementaciones concretas.                                   |

### Beneficios

- ✅ **Escalabilidad**: Añadir nuevos listeners no requiere modificar el publisher
- ✅ **Testabilidad**: Cada módulo se puede probar de forma aislada
- ✅ **Mantenibilidad**: Los cambios en un módulo no impactan a otros
- ✅ **Flexibilidad**: Permite migrar a sistemas distribuidos sin cambiar el código de negocio

---

## Contratos Técnicos

### DomainEvent Interface

```typescript
export interface DomainEvent<T = any> {
  eventName: Events | string; // Nombre del evento en formato namespaced (ej: 'user.registered')
  aggregateId: string; // ID de la entidad principal afectada
  payload: T; // Datos específicos del evento (tipado genérico)
  occurredAt: Date; // Timestamp del evento
  metadata?: {
    // Metadatos opcionales para trazabilidad
    userId?: string; // ID del usuario que originó el evento
    correlationId?: string; // ID para rastrear flujos complejos
  };
}
```

### EventBus Interface

```typescript
export interface EventBus {
  publish<T>(event: DomainEvent<T>): void;
}
```

**Injection Token:**

```typescript
export const INJECT_EVENT_BUS = Symbol('INJECT_EVENT_BUS');
```

---

## Implementación

### Arquitectura

```
┌─────────────────────────────────────────────────┐
│           EventsModule (@Global)                │
├─────────────────────────────────────────────────┤
│  EventBus Interface (Abstracción)               │
│           ▲                                     │
│           │ implements                          │
│           │                                     │
│  InMemoryEventBusService                        │
│           ▲                                     │
│           │ delegates to                        │
│           │                                     │
│  EventEmitter2 (@nestjs/event-emitter)          │
└─────────────────────────────────────────────────┘
```

### Módulo Global

El `EventsModule` está decorado con `@Global()`, lo que significa que:

- ✅ Se registra una única vez en `AppModule`
- ✅ El `EventBus` está disponible en todos los módulos sin necesidad de reimportarlo
- ✅ Garantiza una única instancia del bus de eventos en toda la aplicación

```typescript
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
```

### Implementación In-Memory

Actualmente usamos `EventEmitter2` de NestJS, que proporciona:

- **Comunicación in-process**: Ideal para monolito modular
- **Ejecución síncrona por defecto**: Los listeners se ejecutan secuencialmente
- **Soporte para wildcards**: Puedes escuchar patrones de eventos (`user.*`)
- **Sin dependencias externas**: No requiere Redis, RabbitMQ, etc.

```typescript
@Injectable()
export class InMemoryEventBusService implements EventBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish<T>(event: DomainEvent<T>): void {
    this.eventEmitter.emit(event.eventName, event);
  }
}
```

---

## Reglas de Ownership

### 📋 Dónde Definir Qué

| Componente        | Ubicación                                                 | Razón                                         |
| ----------------- | --------------------------------------------------------- | --------------------------------------------- |
| **Event Names**   | `libs/events/src/enums/events.enum.ts`                    | Contrato compartido, evita strings mágicos    |
| **Payload Types** | `libs/events/src/interfaces/`                             | Evita dependencias circulares entre apps      |
| **Publishers**    | Módulo que ejecuta la acción (ej: `apps/users`)           | El que conoce el cambio es quien lo publica   |
| **Subscribers**   | Módulo que reacciona al evento (ej: `apps/notifications`) | La reacción es responsabilidad del consumidor |

### ⚠️ Antipatrones a Evitar

#### ❌ NO: Enviar entidades completas

```typescript
// MAL - Crea acoplamiento a la estructura de base de datos
eventBus.publish({
  eventName: 'user.registered',
  aggregateId: user.id,
  payload: user, // ❌ Entidad completa con todos los campos
  occurredAt: new Date(),
});
```

#### ✅ SÍ: Enviar payloads ligeros

```typescript
// BIEN - Solo datos necesarios
interface UserRegisteredPayload {
  userId: string;
  email: string;
  registeredAt: Date;
}

eventBus.publish<UserRegisteredPayload>({
  eventName: Events.USER_REGISTERED,
  aggregateId: userId,
  payload: {
    userId,
    email: user.email,
    registeredAt: new Date(),
  },
  occurredAt: new Date(),
});
```

### 📦 Estructura Recomendada

```
libs/events/
├── src/
│   ├── enums/
│   │   └── events.enum.ts          # ✅ Nombres de eventos
│   ├── interfaces/
│   │   ├── domain-event.interface.ts
│   │   ├── event-bus.interface.ts
│   │   └── payloads/               # ✅ Tipos de payloads
│   │       ├── user-events.payloads.ts
│   │       ├── order-events.payloads.ts
│   │       └── index.ts
```

---

## Guía de Uso

### 1. Registrar el Módulo (una sola vez)

```typescript
// apps/main/src/app.module.ts
import { EventsModule } from '@events';

@Module({
  imports: [
    EventsModule, // @Global - disponible en toda la app
    UsersModule,
    OrdersModule,
    // ...
  ],
})
export class AppModule {}
```

### 2. Definir el Evento

#### 2.1. Nombre del Evento

```typescript
// libs/events/src/enums/events.enum.ts
export enum Events {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_EMAIL_VERIFIED = 'user.email_verified',

  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_CANCELLED = 'order.cancelled',
}
```

#### 2.2. Tipo del Payload

```typescript
// libs/events/src/interfaces/payloads/user-events.payloads.ts
export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name: string;
  registeredAt: Date;
}

export interface UserEmailVerifiedPayload {
  userId: string;
  email: string;
  verifiedAt: Date;
}
```

### 3. Publicar el Evento (Publisher)

```typescript
// apps/users/src/users.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { INJECT_EVENT_BUS, EventBus, DomainEvent, Events } from '@events';
import { UserRegisteredPayload } from '@events/interfaces/payloads/user-events.payloads';

@Injectable()
export class UsersService {
  constructor(@Inject(INJECT_EVENT_BUS) private readonly eventBus: EventBus) {}

  async register(dto: RegisterDto) {
    // 1. Ejecutar la lógica de negocio
    const user = await this.usersRepository.create(dto);

    // 2. Publicar el evento de dominio
    const event: DomainEvent<UserRegisteredPayload> = {
      eventName: Events.USER_REGISTERED,
      aggregateId: user.id,
      payload: {
        userId: user.id,
        email: user.email,
        name: user.name,
        registeredAt: new Date(),
      },
      occurredAt: new Date(),
      metadata: {
        userId: user.id,
        correlationId: dto.correlationId, // Si está disponible
      },
    };

    this.eventBus.publish<UserRegisteredPayload>(event);

    return user;
  }
}
```

### 4. Escuchar el Evento (Subscriber)

```typescript
// apps/notifications/src/notifications.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, Events } from '@events';
import { UserRegisteredPayload } from '@events/interfaces/payloads/user-events.payloads';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent(Events.USER_REGISTERED)
  async handleUserRegistered(event: DomainEvent<UserRegisteredPayload>) {
    this.logger.log(
      `Processing ${event.eventName} for user ${event.aggregateId}`,
    );

    try {
      await this.emailService.sendWelcomeEmail({
        to: event.payload.email,
        name: event.payload.name,
      });

      this.logger.log(`Welcome email sent to ${event.payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email: ${error.message}`,
        error.stack,
      );
      // Aquí podrías publicar un evento de compensación o reintento
    }
  }

  @OnEvent(Events.USER_EMAIL_VERIFIED)
  async handleEmailVerified(event: DomainEvent<UserEmailVerifiedPayload>) {
    this.logger.log(`Email verified for user ${event.aggregateId}`);
    // Lógica de reacción...
  }
}
```

### 5. Múltiples Listeners para el Mismo Evento

```typescript
// apps/analytics/src/analytics.listener.ts
@Injectable()
export class AnalyticsListener {
  @OnEvent(Events.USER_REGISTERED)
  async trackUserRegistration(event: DomainEvent<UserRegisteredPayload>) {
    // Trackear en Google Analytics, Mixpanel, etc.
    await this.analytics.track('User Registered', {
      userId: event.payload.userId,
      email: event.payload.email,
      timestamp: event.occurredAt,
    });
  }
}

// apps/gamification/src/gamification.listener.ts
@Injectable()
export class GamificationListener {
  @OnEvent(Events.USER_REGISTERED)
  async awardWelcomePoints(event: DomainEvent<UserRegisteredPayload>) {
    // Otorgar puntos de bienvenida
    await this.pointsService.award({
      userId: event.payload.userId,
      points: 100,
      reason: 'Welcome bonus',
    });
  }
}
```

**Resultado:** Un solo `eventBus.publish()` desencadena automáticamente:

- ✉️ Envío de email de bienvenida
- 📊 Registro en analytics
- 🎮 Otorgamiento de puntos

### 6. Testing

#### Test del Publisher

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: INJECT_EVENT_BUS,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    eventBus = module.get<EventBus>(INJECT_EVENT_BUS);
  });

  it('should publish USER_REGISTERED event after successful registration', async () => {
    const dto = { email: 'test@example.com', name: 'Test User' };

    await service.register(dto);

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: Events.USER_REGISTERED,
        payload: expect.objectContaining({
          email: dto.email,
          name: dto.name,
        }),
      }),
    );
  });
});
```

#### Test del Subscriber

```typescript
// notifications.listener.spec.ts
describe('NotificationsListener', () => {
  let listener: NotificationsListener;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsListener,
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<NotificationsListener>(NotificationsListener);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should send welcome email on USER_REGISTERED event', async () => {
    const event: DomainEvent<UserRegisteredPayload> = {
      eventName: Events.USER_REGISTERED,
      aggregateId: 'user-123',
      payload: {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        registeredAt: new Date(),
      },
      occurredAt: new Date(),
    };

    await listener.handleUserRegistered(event);

    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'Test User',
    });
  });
});
```

---

## Evolución y Escalabilidad

### Fase 1: In-Memory (Actual)

**Estado:** ✅ Implementado

**Características:**

- Comunicación sincrónica in-process
- Ideal para monolito modular
- Sin latencia de red
- Simplicidad operativa

**Limitaciones:**

- No hay persistencia de eventos
- No hay reintentos automáticos
- No hay distribución entre instancias

### Fase 2: BullMQ (Futuro)

**Cuándo migrar:**

- Necesitas persistencia de eventos
- Requieres reintentos automáticos con backoff
- Quieres procesamiento asíncrono real
- Necesitas priorización de eventos

**Cambios requeridos:**

```typescript
// libs/events/src/services/bullmq-event-bus.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventBus, DomainEvent } from '@events';

@Injectable()
export class BullMQEventBusService implements EventBus {
  constructor(@InjectQueue('events') private readonly queue: Queue) {}

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    await this.queue.add(event.eventName, event, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

**Impacto en el código de aplicación:** ✅ **CERO** - Solo cambias el provider en `EventsModule`.

### Fase 3: RabbitMQ / Kafka (Arquitectura Distribuida)

**Cuándo migrar:**

- Migración a microservicios
- Múltiples instancias de la aplicación
- Comunicación entre servicios diferentes
- Necesitas event sourcing completo

**Cambios requeridos:**

```typescript
// libs/events/src/services/rabbitmq-event-bus.service.ts
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventBus, DomainEvent } from '@events';

@Injectable()
export class RabbitMQEventBusService implements EventBus {
  constructor(private readonly client: ClientProxy) {}

  publish<T>(event: DomainEvent<T>): void {
    this.client.emit(event.eventName, event);
  }
}
```

**Impacto en el código de aplicación:** ✅ **CERO** - Solo cambias el provider en `EventsModule`.

---

## Testing

### Ejecutar Tests

```bash
# Ejecutar todos los tests de la librería
pnpm test:events
```

### Estructura de Tests

La librería incluye tres niveles de testing:

#### 1. **Tests Unitarios** (`*.spec.ts`)

**InMemoryEventBusService**

```typescript
describe('InMemoryEventBusService', () => {
  it('should emit event through EventEmitter2', () => {
    const event: DomainEvent<{ test: string }> = {
      eventName: 'test.event',
      aggregateId: 'test-123',
      payload: { test: 'data' },
      occurredAt: new Date(),
    };

    service.publish(event);

    expect(eventEmitter.emit).toHaveBeenCalledWith('test.event', event);
  });
});
```

**EventsModule**

```typescript
describe('EventsModule', () => {
  it('should provide EventBus through INJECT_EVENT_BUS token', () => {
    const eventBus = module.get(INJECT_EVENT_BUS);
    expect(eventBus).toBeDefined();
    expect(eventBus).toBeInstanceOf(InMemoryEventBusService);
  });
});
```

#### 2. **Tests de Integración** (`*.integration.spec.ts`)

Probar el flujo completo: Publisher → EventBus → Listener

```typescript
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

@Injectable()
class TestListener {
  public receivedEvents: DomainEvent<TestPayload>[] = [];

  @OnEvent('test.integration')
  handleTestEvent(event: DomainEvent<TestPayload>) {
    this.receivedEvents.push(event);
  }
}

it('should publish and receive events end-to-end', async () => {
  publisher.publishEvent('test data');
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(listener.receivedEvents).toHaveLength(1);
  expect(listener.receivedEvents[0].payload.data).toBe('test data');
});
```

#### 3. **Mocking en Tests de Aplicación**

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let eventBus: EventBus;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: INJECT_EVENT_BUS,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    eventBus = module.get(INJECT_EVENT_BUS);
  });

  it('should publish USER_REGISTERED event', async () => {
    await service.register({ email: 'test@test.com' });

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: Events.USER_REGISTERED,
        payload: expect.objectContaining({
          email: 'test@test.com',
        }),
      }),
    );
  });
});
```

### Cobertura de Código

```
File                             | % Stmts | % Branch | % Funcs | % Lines
---------------------------------|---------|----------|---------|--------
libs/events/src                  |     100 |      100 |     100 |     100
  events.module.ts               |     100 |      100 |     100 |     100
  event-bus.interface.ts         |     100 |      100 |     100 |     100
  in-memory-event-bus.service.ts |     100 |      100 |     100 |     100
```

### Best Practices de Testing

| Práctica                      | Descripción                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| **Mock EventBus**             | En tests unitarios, siempre mockea el EventBus para aislar la lógica               |
| **Verificar Llamadas**        | Usa `toHaveBeenCalledWith()` para validar que se publiquen los eventos correctos   |
| **Tests Asíncronos**          | Los listeners son asíncronos, usa `async/await` o timeouts en tests de integración |
| **No Testear Implementación** | Testea el contrato (EventBus interface), no la implementación (EventEmitter2)      |
| **Eventos Reales**            | En integration tests, usa eventos reales del enum `Events`                         |

---

## Best Practices

### ✅ DO

- **Usar past tense para nombres de eventos**: `user.registered`, no `user.register`
- **Incluir timestamp**: Siempre poblar `occurredAt`
- **Payloads mínimos**: Solo IDs + datos del cambio
- **Handlers idempotentes**: Los listeners deben poder ejecutarse múltiples veces sin efectos secundarios
- **Logging exhaustivo**: Traza cada publicación y recepción de eventos
- **Tipado fuerte**: Usa TypeScript generics para los payloads

### ❌ DON'T

- **No enviar entidades completas**: Rompe el desacoplamiento
- **No acoplar listeners**: Un listener no debe llamar directamente a otro
- **No hacer operaciones síncronas pesadas**: Los listeners deben ser rápidos
- **No lanzar excepciones sin control**: Captura errores y registra, considera eventos de compensación
- **No usar strings mágicos**: Usa el enum `Events`

---

## Troubleshooting

### El evento no llega al listener

1. ✅ Verifica que el módulo esté importando `EventsModule`
2. ✅ Verifica que el listener esté decorado con `@Injectable()` y registrado como provider
3. ✅ Verifica que el `eventName` coincida exactamente con el `@OnEvent()`
4. ✅ Revisa los logs para confirmar que el evento se está publicando

### Múltiples ejecuciones del mismo listener

- EventEmitter2 ejecuta listeners síncronamente, no debería haber duplicados
- Verifica que no tengas múltiples instancias del listener registradas
- Revisa que el módulo no esté importado múltiples veces

### Errores en listeners no se propagan

- **Por diseño**: Un error en un listener no debe detener la ejecución de otros
- Implementa manejo de errores robusto dentro de cada listener
- Considera publicar eventos de compensación en caso de fallo

---

## Referencias

- [NestJS Event Emitter Documentation](https://docs.nestjs.com/techniques/events)
- [EventEmitter2 GitHub](https://github.com/EventEmitter2/EventEmitter2)
- [Domain Events Pattern - Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

---

## Licencia

MIT © Family App
