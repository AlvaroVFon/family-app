# @core - Librería de Infraestructura Transversal

Librería compartida de infraestructura que estandariza el manejo de excepciones, respuestas HTTP y logging en todas las aplicaciones del monorepo.

## 🎯 Propósito

`@core` proporciona los **cimientos técnicos comunes** para garantizar:

- **Consistencia**: Todas las apps responden con el mismo formato
- **Trazabilidad**: Logging estructurado y centralizado
- **Mantenibilidad**: Cambios en una sola librería afectan a todo el sistema
- **Type Safety**: Contratos TypeScript para errores y respuestas

## ⚠️ Qué NO es `@core`

- ❌ No contiene lógica de negocio
- ❌ No define casos de uso ni controllers
- ❌ No accede a base de datos ni servicios externos
- ❌ No es un módulo de dominio

## 📂 Estructura

```
libs/core/src/
├── exceptions/          # Sistema base de excepciones
│   ├── app.exception.ts
│   ├── exception-code.enum.ts
│   ├── not-found.exception.ts
│   ├── unauthorized.exception.ts
│   ├── forbidden.exception.ts
│   └── validation.exception.ts
├── responses/           # Formato estándar de respuestas HTTP
│   ├── responses.interfaces.ts
│   ├── responses.helper.ts
│   └── responses.enum.ts
├── filters/             # Manejo centralizado de errores
│   └── http-exception.filter.ts
├── logger/              # Sistema de logging desacoplado
│   ├── logger.interface.ts
│   ├── logger.module.ts
│   └── console-logger.service.ts
└── core.module.ts       # Módulo raíz exportable
```

---

## 🔥 Módulos

### 1. **Exceptions** - Sistema de Excepciones

Define una jerarquía de excepciones tipadas que se transforman automáticamente en respuestas HTTP consistentes.

#### Clase Base: `AppException`

```typescript
export class AppException extends Error {
  constructor(
    readonly message: string,
    readonly code: ExceptionCode,
    readonly statusCode: ExceptionStatusCode,
    readonly details?: any,
  ) {}
}
```

#### Excepciones Predefinidas

| Clase                   | Código HTTP | Uso                    |
| ----------------------- | ----------- | ---------------------- |
| `NotFoundException`     | 404         | Recurso no encontrado  |
| `UnauthorizedException` | 401         | Falta autenticación    |
| `ForbiddenException`    | 403         | Permisos insuficientes |
| `ValidationException`   | 400         | Error de validación    |

#### Ejemplo de Uso

```typescript
import { NotFoundException } from '@core/exceptions';

@Injectable()
export class UserService {
  async findById(id: string) {
    const user = await this.repo.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found', { userId: id });
    }
    return user;
  }
}
```

#### Enums Disponibles

```typescript
enum ExceptionCode {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  GENERIC_ERROR = 'GENERIC_ERROR',
}

enum ExceptionStatusCode {
  NOT_FOUND = 404,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  VALIDATION_ERROR = 400,
  GENERIC_ERROR = 500,
}
```

---

### 2. **Responses** - Formato Estándar de Respuestas

Helpers para generar respuestas HTTP consistentes y tipadas.

#### Estructura de Respuesta

```typescript
interface ApiResponse<T> {
  data: T | T[] | null;
  message: string;
  statusCode: number;
  error: ApiError | null;
}
```

#### Funciones Disponibles

##### `successResponse<T>(...)`

Genera una respuesta exitosa.

```typescript
import { successResponse, ResponseMessage } from '@core/responses';

@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.service.findById(id);
    return successResponse(user, ResponseMessage.SUCCESS, 200);
  }
}
```

**Respuesta:**

```json
{
  "data": { "id": "123", "name": "John" },
  "message": "Success",
  "statusCode": 200,
  "error": null
}
```

##### `paginatedResponse<T>(...)`

Genera una respuesta paginada.

```typescript
@Get()
async listUsers(@Query('page') page: number) {
  const users = await this.service.findAll(page);
  return paginatedResponse(users, 100, page, 10);
}
```

**Respuesta:**

```json
{
  "data": [...],
  "message": "Success",
  "statusCode": 200,
  "error": null,
  "totalCount": 100,
  "totalPages": 10,
  "currentPage": 1,
  "pageSize": 10
}
```

##### `errorResponse(...)`

⚠️ **Uso interno del `HttpExceptionFilter`.** No deberías usarlo directamente. Lanza una excepción en su lugar.

---

### 3. **Filters** - Manejo Global de Excepciones

El `HttpExceptionFilter` captura todas las excepciones y las convierte en respuestas estandarizadas.

#### Características

- ✅ Captura `AppException`, `HttpException` y errores genéricos
- ✅ Loggea todas las excepciones con contexto
- ✅ Oculta stack traces en producción
- ✅ Formatea respuestas según el contrato `ApiResponse<T>`

#### Configuración (automática)

El filtro se registra globalmente mediante `APP_FILTER` en tu `AppModule`:

```typescript
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '@core/filters';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

#### Comportamiento

| Tipo de Error            | Respuesta HTTP                            |
| ------------------------ | ----------------------------------------- |
| `AppException`           | Usa `code` y `statusCode` de la excepción |
| `HttpException` (NestJS) | Convierte a formato estándar              |
| Error genérico           | 500 con mensaje "Internal server error"   |

**Ejemplo de respuesta de error:**

```json
{
  "data": null,
  "message": "An unexpected error occurred",
  "statusCode": 404,
  "error": {
    "code": "NOT_FOUND",
    "statusCode": 404,
    "message": "User not found"
  }
}
```

---

### 4. **Logger** - Sistema de Logging Desacoplado

Interfaz de logging inyectable mediante Dependency Injection, con implementación por defecto en consola.

#### Interfaz

```typescript
interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

interface LogContext {
  module?: string;
  requestId?: string;
  [key: string]: unknown;
}
```

#### Uso con Dependency Injection

```typescript
import { Inject } from '@nestjs/common';
import { Logger, INJECT_LOGGER } from '@core/logger';

@Injectable()
export class UserService {
  constructor(@Inject(INJECT_LOGGER) private readonly logger: Logger) {}

  async createUser(data: CreateUserDto) {
    this.logger.info('Creating user', {
      module: 'UserService',
      email: data.email,
    });

    try {
      const user = await this.repo.save(data);
      this.logger.info('User created', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', {
        module: 'UserService',
        error: error.message,
      });
      throw error;
    }
  }
}
```

#### Formato de Logs

Salida en JSON estructurado:

```json
{
  "timestamp": "2025-12-23T10:30:00.000Z",
  "level": "info",
  "message": "Creating user",
  "module": "UserService",
  "email": "user@example.com"
}
```

#### Importar el Logger

```typescript
import { LoggerModule } from '@core/logger';

@Module({
  imports: [LoggerModule],
  providers: [UserService],
})
export class UserModule {}
```

O importa directamente `CoreModule` que ya incluye todo:

```typescript
import { CoreModule } from '@core/core.module';

@Module({
  imports: [CoreModule],
})
export class AppModule {}
```

---

## 🚀 Instalación en tu App

### 1. Importa `CoreModule` en tu `AppModule`

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CoreModule } from '@core/core.module';
import { HttpExceptionFilter } from '@core/filters';

@Module({
  imports: [CoreModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### 2. Usa las excepciones en tus servicios

```typescript
import { NotFoundException } from '@core/exceptions';

throw new NotFoundException('Resource not found');
```

### 3. Usa los helpers de respuesta en tus controllers

```typescript
import { successResponse } from '@core/responses';

return successResponse(data);
```

### 4. Inyecta el logger donde lo necesites

```typescript
import { Inject } from '@nestjs/common';
import { Logger, INJECT_LOGGER } from '@core/logger';

constructor(@Inject(INJECT_LOGGER) private logger: Logger) {}
```

---

## 📏 Reglas y Buenas Prácticas

### ✅ **DO**

- Lanza excepciones de `@core/exceptions` en servicios
- Usa `successResponse()` y `paginatedResponse()` en controllers
- Inyecta el logger con `@Inject(INJECT_LOGGER)`
- Proporciona contexto rico en logs (`module`, `requestId`, etc.)
- Añade `details` a las excepciones para facilitar debugging

### ❌ **DON'T**

- No uses `errorResponse()` directamente (es interno del filter)
- No captures excepciones solo para loggearlas y volver a lanzarlas
- No uses `console.log` directamente, siempre usa el logger
- No modifiques las clases base de excepción
- No mezcles lógica de negocio en `@core`

---

## 🔧 Extensibilidad

### Crear nuevas excepciones

```typescript
import {
  AppException,
  ExceptionCode,
  ExceptionStatusCode,
} from '@core/exceptions';

export class PaymentRequiredException extends AppException {
  constructor(message: string, details?: any) {
    super(
      message,
      ExceptionCode.PAYMENT_REQUIRED, // Añadir al enum
      402,
      details,
    );
  }
}
```

### Reemplazar el logger

El logger usa un token (`INJECT_LOGGER`), por lo que puedes reemplazar la implementación:

```typescript
import { Module } from '@nestjs/common';
import { INJECT_LOGGER } from '@core/logger';
import { WinstonLogger } from './winston-logger.service';

@Module({
  providers: [
    {
      provide: INJECT_LOGGER,
      useClass: WinstonLogger, // Tu implementación personalizada
    },
  ],
  exports: [INJECT_LOGGER],
})
export class CustomLoggerModule {}
```

---

## 🔍 Stack Traces en Producción

El `HttpExceptionFilter` **oculta automáticamente** los stack traces cuando `NODE_ENV=production`.

- **Desarrollo**: Stack traces completos para debugging
- **Producción**: Sin stack traces para evitar exposición de información sensible

---

## 📦 Resumen de Exports

```typescript
// Excepciones
export {
  AppException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ValidationException,
} from '@core/exceptions';
export { ExceptionCode, ExceptionStatusCode } from '@core/exceptions';

// Responses
export { successResponse, paginatedResponse } from '@core/responses';
export { ApiResponse, PaginatedResponse } from '@core/responses';
export { ResponseMessage, ResponseStatusCode } from '@core/responses';

// Logger
export { Logger, LogContext, INJECT_LOGGER } from '@core/logger';
export { LoggerModule } from '@core/logger';

// Filters
export { HttpExceptionFilter } from '@core/filters';

// Módulo principal
export { CoreModule } from '@core/core.module';
```

---

## 📄 Licencia

Este código es parte del monorepo interno del proyecto. No redistribuir.
