# @database - Database Connection Layer

Librería de abstracción de base de datos que permite cambiar entre diferentes implementaciones (MongoDB, PostgreSQL, etc.) sin modificar el código consumidor.

## 🎯 Propósito

Proporciona una **interfaz unificada** para conexiones de base de datos siguiendo el patrón de inyección de dependencias.

**Ventajas:**

- ✅ **Desacoplado**: Cambiar de MongoDB a PostgreSQL sin tocar servicios
- ✅ **Testeable**: Mockear fácilmente en tests
- ✅ **Type-safe**: TypeScript end-to-end
- ✅ **Configurable**: Variables de entorno mediante `@core/config`

## 📂 Estructura

```
libs/database/src/
├── database.interface.ts    # Interfaz y token de inyección
├── database.module.ts        # Módulo NestJS
├── mongoose/
│   └── mongoose.service.ts  # Implementación MongoDB
└── index.ts                  # Exports públicos
```

## 🔧 Uso

### 1. Importar el módulo

```typescript
import { DatabaseModule } from '@database';

@Module({
  imports: [DatabaseModule],
  // ...
})
export class UsersModule {}
```

### 2. Inyectar en servicios

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService, INJECT_DATABASE } from '@database';

@Injectable()
export class UsersService {
  constructor(
    @Inject(INJECT_DATABASE) private readonly database: DatabaseService,
  ) {}

  async onModuleInit() {
    await this.database.connect();
  }

  getConnection() {
    // Para MongoDB, retorna mongoose.Connection
    const connection = this.database.getDBConnection();
    return connection;
  }
}
```

### 3. Usar con tipado específico

```typescript
import mongoose from 'mongoose';

// Si sabes que estás usando MongoDB
const mongoConnection = this.database.getDBConnection<mongoose.Connection>();
const User = mongoConnection.model('User', userSchema);
```

## 🔌 Implementaciones Disponibles

### MongoDB (MongooseService)

**Configuración (variables de entorno):**

```env
DB_HOST=localhost
DB_PORT=27017
DB_USERNAME=mongoUser
DB_PASSWORD=mongoPass
DB_NAME=family-app
```

Usa `@core/config/DatabaseConfigService` para leer la configuración.

## 🔄 Cambiar de implementación

Para usar otra base de datos (e.g., PostgreSQL):

1. Crea `libs/database/src/postgres/postgres.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database.interface';

@Injectable()
export class PostgresService implements DatabaseService {
  async connect(): Promise<void> {
    // Implementación PostgreSQL
  }

  getDBConnection<T>(): T {
    // Retorna pool de conexiones
  }

  async disconnect(): Promise<void> {
    // Cierra conexiones
  }
}
```

2. Cambia el provider en `database.module.ts`:

```typescript
@Module({
  imports: [CoreConfigModule, LoggerModule],
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

3. **¡Listo!** Ningún otro archivo necesita cambios.

## 🧪 Testing

Mock fácil en tests:

```typescript
const mockDatabase: DatabaseService = {
  connect: jest.fn().mockResolvedValue(undefined),
  getDBConnection: jest.fn().mockReturnValue(mockConnection),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

const module = await Test.createTestingModule({
  providers: [
    UsersService,
    {
      provide: INJECT_DATABASE,
      useValue: mockDatabase,
    },
  ],
}).compile();
```

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
```

Úsalo con `@Inject(INJECT_DATABASE)`.

## 🚀 Roadmap

- [ ] Implementación PostgreSQL
- [ ] Pool de conexiones configurable
- [ ] Métricas de conexión
- [ ] Reconnect automático
- [ ] Health checks

---

**Patrón seguido**: Inspirado en `@core/logger` para mantener consistencia arquitectónica.
