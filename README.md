# Family App - Backend Monorepo

Aplicación familiar modular construida con NestJS, diseñada para gestionar usuarios, familias, tareas y notificaciones en un entorno backend-first.

## 🎯 Project Overview

Este proyecto es un **monorepo backend** que implementa una plataforma de gestión familiar. La arquitectura está diseñada para ser:

- **Modular**: Cada dominio (users, families, tasks) vive en su propia app o librería
- **Escalable**: Las apps se comunican mediante contratos claros
- **Type-safe**: TypeScript end-to-end con validación estricta
- **Testeable**: Cada módulo tiene tests unitarios y de integración

### Estado Actual

**✅ Implementado:**

- `libs/core` - Librería de infraestructura transversal (excepciones, responses, logger, filters, config)
- `libs/database` - Capa de abstracción de base de datos (MongoDB con Mongoose)

**📋 Previsto para MVP:**

- `libs/mail` - Servicio de envío de emails
- `apps/users` - Gestión de usuarios
- `apps/families` - Gestión de familias y miembros
- `apps/tasks` - Sistema de tareas compartidas
- `apps/auth` - Autenticación y autorización

---

## 📁 Monorepo Structure

```
family-app/
├── apps/                    # Aplicaciones independientes
│   └── [próximamente]       # users, families, tasks, auth
│
├── libs/                    # Librerías compartidas
│   ├── core/               ✅ Infraestructura base (excepciones, logger, responses, config)
│   │   └── README.md
│   └── database/           ✅ Abstracción de base de datos (MongoDB)
│       └── README.md
│
├── src/                    # App principal (bootstrap temporal)
├── test/                   # Tests e2e globales
└── package.json
```

### Filosofía de Organización

**`apps/`** - Microservicios o módulos principales

- Cada app gestiona su propio dominio de negocio
- Tienen sus propios controllers, services, y casos de uso
- Son dueñas de sus colecciones en la base de datos
- Pueden consumir libs compartidas

**`libs/`** - Código transversal reutilizable

- No contienen lógica de negocio específica
- Proporcionan utilidades, configuración, infraestructura
- Son dependencias de las apps, nunca al revés

---

## ⚙️ Core Lib

La librería `@core` es el **cimiento técnico común** del monorepo. Proporciona:

### Implementación Actual

✅ **Sistema de Excepciones**

```typescript
import { NotFoundException } from '@core/exceptions';
throw new NotFoundException('User not found');
```

✅ **Helpers de Respuestas HTTP**

```typescript
import { successResponse, paginatedResponse } from '@core/responses';
return successResponse(data);
```

✅ **Exception Filter Global**

- Captura y formatea todas las excepciones automáticamente
- Logging con contexto completo
- Oculta stack traces en producción

✅ **Logger Desacoplado**

```typescript
import { Inject } from '@nestjs/common';
import { Logger, INJECT_LOGGER } from '@core/logger';

constructor(@Inject(INJECT_LOGGER) private logger: Logger) {}
```

### Testing

```bash
pnpm test:core      # 37 tests unitarios
pnpm test:database  # 17 tests unitarios
```

📖 **[Ver documentación completa de @core](libs/core/README.md)**

---

## 🗄️ Database Lib

La librería `@database` proporciona una **capa de abstracción** para acceso a bases de datos.

### Implementación Actual

✅ **Interfaz `DatabaseService`**

```typescript
import { Inject } from '@nestjs/common';
import { INJECT_DATABASE, DatabaseService } from '@database';

constructor(@Inject(INJECT_DATABASE) private db: DatabaseService) {}
```

✅ **MongoDB con Mongoose**

- Gestión automática de conexiones
- Configuración vía variables de entorno
- Desacoplado de la implementación concreta

📖 **[Ver documentación completa de @database](libs/database/README.md)**

---

## 🚧 Planned Libs and Apps

### Librerías Previstas

**`libs/mail`**

- Cliente de email (Nodemailer, SendGrid, etc.)
- Templates de emails
- Queue de envío asíncrono

### Apps Previstas

**`apps/users`**

- CRUD de usuarios
- Perfiles y preferencias
- Owner de colección: `users`

**`apps/families`**

- Gestión de familias (crear, invitar miembros)
- Roles dentro de la familia
- Owner de colección: `families`

**`apps/tasks`**

- Sistema de tareas compartidas
- Asignación y seguimiento
- Owner de colección: `tasks`

**`apps/auth`**

- Login/Signup con JWT
- Refresh tokens
- Middleware de autenticación

---

## 🔐 Ownership Rules

### Regla de Oro

> **Cada app es dueña de sus propias colecciones de base de datos.**

- `apps/users` es dueña de `users`
- `apps/families` es dueña de `families` y `family_members`
- `apps/tasks` es dueña de `tasks` y `task_assignments`

### Comunicación entre Apps

**✅ Permitido:**

- Leer datos de otra app mediante su API/servicio exportado
- Emitir eventos que otras apps consumen
- Compartir DTOs e interfaces mediante libs

**❌ Prohibido:**

- Escribir directamente en colecciones de otra app
- Importar servicios internos de otra app
- Compartir lógica de negocio entre apps

### Ejemplo de Integración

```typescript
// ✅ CORRECTO
// apps/tasks necesita info de un usuario
import { UsersService } from '@apps/users';

@Injectable()
export class TasksService {
  constructor(private usersService: UsersService) {}

  async assignTask(taskId: string, userId: string) {
    const user = await this.usersService.findById(userId);
    // ...
  }
}

// ❌ INCORRECTO
// apps/tasks modifica directamente users
import { UserModel } from '@apps/users/models';
await UserModel.updateOne({ _id: userId }, { ... }); // NO
```

---

## 🚀 Getting Started

### Requisitos

- Node.js 18+
- pnpm 8+
- MongoDB (cuando se implemente `libs/database`)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd family-app

# Instalar dependencias
pnpm install
```

### Desarrollo

```bash
# Levantar app en modo desarrollo
pnpm start:dev

# Ejecutar tests de core
pnpm test:core

# Build del proyecto
pnpm build

# Linting
pnpm lint
```

### Variables de Entorno

(Próximamente - cuando se implemente database y auth)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/family-app
JWT_SECRET=your-secret-key
```

---

## 📊 Diagrama de Estado Actual

```
┌─────────────────────────────────────┐
│         family-app (root)           │
└─────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼────┐      ┌────▼─────┐
    │ apps/  │      │  libs/   │
    └───┬────┘      └────┬─────┘
        │                │
        │                │
    [vacío]         ┌────▼────────┐
                    │  ✅ core    │
                    │  - exceptions
                    │  - responses
                    │  - filters
                    │  - logger
                    └─────────────┘
```

---

## 📝 Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev          # Levantar app en watch mode
pnpm start:debug        # Modo debug con inspector

# Testing
pnpm test               # Todos los tests
pnpm test:core          # Tests de @core únicamente
pnpm test:watch         # Tests en watch mode
pnpm test:cov           # Coverage report

# Build y producción
pnpm build              # Compilar proyecto
pnpm start:prod         # Ejecutar build de producción

# Calidad de código
pnpm lint               # Ejecutar ESLint
pnpm format             # Formatear con Prettier
```

---

## 🤝 Contributing

### Convenciones

- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branches**: `feature/nombre`, `bugfix/nombre`, `docs/nombre`
- **PRs**: Requerir revisión antes de merge a `main`

### Agregar Nueva App

```bash
# Generar app con CLI de Nest
nest generate app <nombre>

# Configurar paths en tsconfig.json
{
  "paths": {
    "@apps/<nombre>": ["apps/<nombre>/src"]
  }
}
```

### Agregar Nueva Lib

```bash
# Generar librería
nest generate library <nombre>

# Configurar paths
{
  "paths": {
    "@libs/<nombre>": ["libs/<nombre>/src"]
  }
}
```

---

## 📖 Documentación Adicional

- [Core Library](libs/core/README.md) - Infraestructura base
- [NestJS Docs](https://docs.nestjs.com) - Framework oficial
- (Próximamente) Database Setup
- (Próximamente) Authentication Flow
- (Próximamente) API Documentation (Swagger)

---

## 📄 License

Este proyecto es privado y propietario. No redistribuir.
