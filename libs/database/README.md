# `libs/database`

## Propósito

`libs/database` es una **librería de infraestructura técnica** que proporciona una capa de abstracción para el acceso a bases de datos en un monorepo NestJS modular.

Su objetivo es desacoplar las aplicaciones de una tecnología concreta de base de datos, permitiendo cambiar entre diferentes implementaciones (MongoDB, PostgreSQL, etc.) sin modificar el código consumidor.

## Filosofía de arquitectura

Este monorepo **no es un sistema de microservicios**, sino un backend modular in-process donde:

- Cada app es dueña de su lógica de negocio y sus colecciones/tablas
- La comunicación entre apps ocurre in-process (no hay red)
- `libs/database` es infraestructura compartida, no dominio compartido

### Principios de diseño

1. **Abstracción mediante interfaces**: `DatabaseService` define el contrato técnico
2. **Implementaciones intercambiables**: Cambiar de MongoDB a PostgreSQL sin tocar las apps
3. **Configuración centralizada**: Integración con `@core/config` para gestión de variables de entorno
4. **Separation of Concerns**: Esta librería no conoce el dominio de las apps que la consumen

## ¿Qué ES `libs/database`?

- ✅ Una capa de abstracción para inicializar y gestionar conexiones a bases de datos
- ✅ Un punto único para configurar clientes/drivers de bases de datos
- ✅ Un contrato técnico estable (`DatabaseService`) consumible por todas las apps
- ✅ Un lugar donde viven tanto las **interfaces** como las **implementaciones concretas**
- ✅ Infraestructura técnica reutilizable

## ¿Qué NO es `libs/database`?

- ❌ **No define modelos de dominio** (users, families, tasks, etc.)
- ❌ **No contiene repositorios de negocio** (eso vive en cada app)
- ❌ **No contiene casos de uso** ni lógica de negocio
- ❌ **No decide ownership de colecciones/tablas** (cada app define sus esquemas)
- ❌ **No orquesta transacciones de negocio** (eso es responsabilidad de las apps)
- ❌ **No conoce el contexto de las apps** que la consumen

### Límite de responsabilidades

| Responsabilidad                                             | `libs/database` | Apps consumidoras |
| ----------------------------------------------------------- | --------------- | ----------------- |
| Inicializar conexión                                        | ✅              | ❌                |
| Gestionar ciclo de vida del cliente                         | ✅              | ❌                |
| Exponer API del driver (mongoose.Connection, pg.Pool, etc.) | ✅              | ❌                |
| Definir schemas/modelos de dominio                          | ❌              | ✅                |
| Implementar repositorios                                    | ❌              | ✅                |
| Lógica de negocio                                           | ❌              | ✅                |
| Ownership de datos (colecciones/tablas)                     | ❌              | ✅                |

## Estructura actual

```
libs/database/src/
├── database.interface.ts       # Contrato técnico + token de inyección
├── database.module.ts          # Módulo NestJS que registra la implementación activa
├── mongoose/
│   └── mongoose.service.ts    # Implementación concreta para MongoDB
└── index.ts                    # API pública exportada
```

### `database.interface.ts`

Define el contrato técnico que todas las implementaciones deben cumplir:

```typescript
export interface DatabaseService {
  connect(): Promise<void>; // Inicializa la conexión
  getDBConnection<T = any>(): T; // Retorna el cliente nativo (mongoose.Connection, pg.Pool, etc.)
  disconnect(): Promise<void>; // Cierra la conexión limpiamente
}

export const INJECT_DATABASE = Symbol('INJECT_DATABASE'); // Token para inyección de dependencias
```

### `database.module.ts`

Módulo NestJS que registra la implementación activa mediante el patrón Provider:

```typescript
@Module({
  imports: [CoreConfigModule], // Acceso a configuración de base de datos
  providers: [
    {
      provide: INJECT_DATABASE, // Token de inyección
      useClass: MongooseService, // Implementación activa (intercambiable)
    },
  ],
  exports: [INJECT_DATABASE], // Expone el token para consumo por apps
})
export class DatabaseModule {}
```

**Cambiar de implementación**: Modificar `useClass` por otra implementación (ej: `PostgresService`).

### `mongoose/mongoose.service.ts`

**Implementación actual para MongoDB** usando Mongoose:

- ✅ Implementa `DatabaseService`
- ✅ Lee configuración de `DatabaseConfigService` (`@core/config`)
- ✅ Gestiona el ciclo de vida de `mongoose.Connection`
- ✅ Usa logging básico con `console.log` (infraestructura, no negocio)

**Estado actual**: Implementación funcional lista para producción.

**Configuración requerida** (variables de entorno):

```env
DB_HOST=localhost
DB_PORT=27017
DB_USERNAME=mongoUser
DB_PASSWORD=mongoPass
DB_NAME=family-app
```

> **Nota**: `MongooseService` usa `authSource=admin` para compatibilidad con MongoDB 8.

## Cómo consumir la librería

### Paso 1: Importar el módulo en tu app

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';

@Module({
  imports: [DatabaseModule], // Registra la conexión
  // ...
})
export class UsersModule {}
```

### Paso 2: Inyectar DatabaseService en tus repositorios

**Arquitectura recomendada**: Service → Repository → DatabaseModule

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService, INJECT_DATABASE } from '@database';
import mongoose from 'mongoose';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(INJECT_DATABASE) private readonly database: DatabaseService,
  ) {}

  async onModuleInit() {
    // Inicializa la conexión cuando el módulo arranca
    await this.database.connect();
  }

  getConnection(): mongoose.Connection {
    // Obtén el cliente nativo de MongoDB
    return this.database.getDBConnection<mongoose.Connection>();
  }

  async createUser(data: any) {
    const connection = this.getConnection();
    const User = connection.model('User', userSchema);
    return User.create(data);
  }
}
```

### Paso 3: Define tus modelos en la app consumidora

**Importante**: Los schemas/modelos de dominio NO viven en `libs/database`, sino en cada app.

```typescript
// apps/users/src/models/user.schema.ts
import { Schema } from 'mongoose';

export const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
```

Cada app es **dueña de sus colecciones/tablas** y define sus propios esquemas.

## Ownership de datos

### Regla conceptual

En este monorepo modular:

- **Cada app es dueña de sus datos**: Define sus schemas, colecciones/tablas y reglas de acceso
- **No hay colecciones compartidas**: Si múltiples apps necesitan acceder a los mismos datos, una de ellas debe ser la dueña y exponer APIs in-process
- **Comunicación in-process**: Las apps se comunican mediante importación de servicios (no hay red)

### Ejemplo de ownership

```
apps/users/        → Dueña de colección `users`
apps/families/     → Dueña de colección `families`
apps/tasks/        → Dueña de colección `tasks`
```

Si `families` necesita información de usuarios:

- ❌ NO debe acceder directamente a la colección `users`
- ✅ SÍ debe llamar a `UsersService` exportado por `apps/users`

**`libs/database` no impone ni gestiona estas reglas**: Es responsabilidad arquitectónica de las apps.

## Añadir una nueva implementación

Para soportar PostgreSQL (ejemplo):

### 1. Crear el servicio concreto

```typescript
// libs/database/src/postgres/postgres.service.ts
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseConfigService } from '@core/config';
import { DatabaseService } from '../database.interface';

@Injectable()
export class PostgresService implements DatabaseService {
  private pool: Pool | null = null;

  constructor(private readonly config: DatabaseConfigService) {}

  async connect(): Promise<void> {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.databaseName,
    });
    console.log('[PostgresService] Connected to PostgreSQL');
  }

  getDBConnection<T = Pool>(): T {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool as T;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('[PostgresService] Disconnected from PostgreSQL');
    }
  }
}
```

### 2. Cambiar el provider en `database.module.ts`

```typescript
import { PostgresService } from './postgres/postgres.service';

@Module({
  imports: [CoreConfigModule],
  providers: [
    {
      provide: INJECT_DATABASE,
      useClass: PostgresService, // 👈 Cambio aquí
    },
  ],
  exports: [INJECT_DATABASE],
})
export class DatabaseModule {}
```

### 3. Listo

Ninguna app necesita cambios. El contrato `DatabaseService` sigue siendo el mismo.

## Testing

Mock de `DatabaseService` en tests unitarios:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INJECT_DATABASE, DatabaseService } from '@database';

const mockDatabase: DatabaseService = {
  connect: jest.fn().mockResolvedValue(undefined),
  getDBConnection: jest.fn().mockReturnValue(mockConnection),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    UserRepository,
    {
      provide: INJECT_DATABASE,
      useValue: mockDatabase,
    },
  ],
}).compile();
```

## Dependencias externas

`libs/database` depende de:

- **`@core/config`**: Para leer configuración de base de datos (`DatabaseConfigService`)
- **Drivers específicos**:
  - `mongoose` (para MongoDB)
  - `pg` (si se añade PostgreSQL)

**Decisión arquitectónica**: La dependencia de `@core/config` es aceptable porque ambas son librerías de infraestructura transversal.

## Estado actual del código

- ✅ **Interfaz `DatabaseService`**: Estable y lista para producción
- ✅ **Implementación MongoDB (`MongooseService`)**: Funcional y testeada en Docker
- ✅ **Integración con `@core/config`**: Completa
- ⚠️ **Otras implementaciones** (PostgreSQL, MySQL, etc.): No implementadas aún (preparadas para futuro)

## Logging

`libs/database` usa `console.log` directamente para logging de infraestructura (conexión/desconexión).

**Decisión de diseño**: No depende de `@core/logger` para evitar acoplamiento innecesario. El logging de negocio debe hacerse en las apps consumidoras (Services/Repositories), no en la capa de infraestructura.

## Preguntas frecuentes

### ¿Dónde defino mis modelos/schemas?

En tu app consumidora, no en `libs/database`.

**Ejemplo**: `apps/users/src/models/user.schema.ts`

### ¿Cómo gestiono transacciones?

Usando el cliente nativo que retorna `getDBConnection()`:

```typescript
const connection = this.database.getDBConnection<mongoose.Connection>();
const session = await connection.startSession();
session.startTransaction();
// ... tu lógica transaccional
await session.commitTransaction();
```

### ¿Puedo tener múltiples conexiones simultáneas?

**No en la implementación actual**. `DatabaseModule` registra una única instancia de `DatabaseService`.

Si necesitas múltiples conexiones (ej: MongoDB + PostgreSQL simultáneos), deberías:

1. Crear módulos separados (`MongoModule`, `PostgresModule`)
2. O extender `DatabaseModule` para soportar múltiples providers con tokens diferentes

**Estado actual**: Caso de uso no soportado (out of scope para MVP).

### ¿Por qué no usar directamente Mongoose en mis apps?

Podrías, pero perderías:

- Flexibilidad para cambiar de base de datos sin reescribir código
- Testabilidad mediante mocks
- Centralización de convenciones de conexión

`libs/database` es un punto único de configuración y abstracción.

## Resumen ejecutivo

| Aspecto                   | Descripción                                         |
| ------------------------- | --------------------------------------------------- |
| **Tipo**                  | Librería de infraestructura técnica                 |
| **Responsabilidad**       | Abstraer acceso a base de datos mediante interfaces |
| **No hace**               | Modelos, repositorios, lógica de negocio            |
| **Implementación actual** | MongoDB via Mongoose (producción ready)             |
| **Extensibilidad**        | Preparada para PostgreSQL, MySQL, etc.              |
| **Dependencias**          | `@core/config`, drivers de BD específicos           |
| **Coupling**              | Bajo (apps consumen interfaz, no implementación)    |
| **Testing**               | Fácilmente mockeable                                |
| **Ownership de datos**    | Responsabilidad de cada app, no de esta lib         |

      useValue: mockDatabase,
    },

],
}).compile();

````

## 📋 API

### `DatabaseService` interface

| Método              | Retorno         | Descripción                   |
| ------------------- | --------------- | ----------------------------- |
| `connect()`         | `Promise<void>` | Establece conexión            |
| `getDBConnection()` | `T` (genérico)  | Obtiene instancia de conexión |
| `disconnect()`      | `Promise<void>` | Cierra la conexión            |

### Token de inyección

```typescript
export const INJECT_DATABASE = Symbol('INJECT_DATABASE');
````

Úsalo con `@Inject(INJECT_DATABASE)`.

## 🧪 Testing

La librería incluye **17 tests unitarios** que cubren los aspectos críticos:

### Ejecutar tests

```bash
# Tests de libs/database
pnpm test:database

# Todos los tests del proyecto
pnpm test
```

### Cobertura de tests

**`MongooseService` (14 tests):**

- ✅ Construcción correcta de URI de conexión
- ✅ Manejo de errores de conexión
- ✅ Gestión de estado (conectado/desconectado)
- ✅ Validación de `getDBConnection()` sin conexión
- ✅ Ciclo de vida completo (connect → use → disconnect)
- ✅ Reconexión después de desconectar

**`DatabaseModule` (3 tests):**

- ✅ Registro correcto del provider `INJECT_DATABASE`
- ✅ Integración con `CoreConfigModule`
- ✅ Inyección de dependencias funcional

### Ejemplo de mock en tests de apps

```typescript
const mockDatabase: DatabaseService = {
  connect: jest.fn().mockResolvedValue(undefined),
  getDBConnection: jest.fn().mockReturnValue(mockConnection),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

const module = await Test.createTestingModule({
  providers: [
    YourService,
    { provide: INJECT_DATABASE, useValue: mockDatabase },
  ],
}).compile();
```

## 🚀 Roadmap

- [ ] Implementación PostgreSQL
- [ ] Pool de conexiones configurable
- [ ] Métricas de conexión
- [ ] Reconnect automático
- [ ] Health checks

---

**Patrón seguido**: Inspirado en `@core/logger` para mantener consistencia arquitectónica.
