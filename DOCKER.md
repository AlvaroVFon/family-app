# 🐳 Docker Deployment Guide

Guía para levantar la aplicación completa con Docker Compose.

## 📋 Prerrequisitos

- Docker Engine 20.10+
- Docker Compose V2

## 🚀 Quick Start

```bash
# Levantar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (borra datos de MongoDB)
docker compose down -v
```

## 🏗️ Arquitectura

```
┌─────────────┐         ┌──────────────┐
│   family-app│────────▶│   MongoDB 8  │
│   (Node 24) │         │              │
│   Port 3000 │         │  Port 27017  │
└─────────────┘         └──────────────┘
```

### Servicios

| Servicio    | Imagen                  | Puerto | Health Check |
| ----------- | ----------------------- | ------ | ------------ |
| **app**     | family-app-app (custom) | 3000   | HTTP GET /   |
| **mongodb** | mongo:8                 | 27017  | mongosh ping |

## ⚙️ Variables de Entorno

Configuradas en `docker-compose.yml`:

### Application

- `NODE_ENV=production`
- `PORT=3000`
- `SERVICE_NAME=family-app`

### Database

- `DB_HOST=mongodb`
- `DB_PORT=27017`
- `DB_USERNAME=mongoUser`
- `DB_PASSWORD=mongoPass`
- `DB_NAME=family-app`

### Logger

- `LOG_LEVEL=info`
- `LOG_FORMAT=json`
- `LOG_INCLUDE_TIMESTAMP=true`

## 🔧 Comandos Útiles

### Ver estado de servicios

```bash
docker compose ps
```

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo la app
docker compose logs -f app

# Solo MongoDB
docker compose logs -f mongodb
```

### Rebuild después de cambios

```bash
docker compose up --build -d
```

### Acceder a MongoDB

```bash
docker compose exec mongodb mongosh -u mongoUser -p mongoPass --authenticationDatabase admin
```

### Reiniciar un servicio específico

```bash
docker compose restart app
```

### Ver recursos utilizados

```bash
docker compose stats
```

## 🧪 Testing

### Health Checks

Ambos servicios tienen health checks configurados:

```bash
# App
curl http://localhost:3000

# MongoDB (desde el contenedor)
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Endpoints Disponibles

```bash
# Root endpoint
curl http://localhost:3000
# Response: Hello World!
```

## 🐛 Troubleshooting

### La app no conecta a MongoDB

**Síntoma**: `Authentication failed` en logs

**Solución**:

```bash
# Eliminar volúmenes y recrear
docker compose down -v
docker compose up -d
```

### Ver logs de error detallados

```bash
docker compose logs app | grep -i error
```

### Contenedor en restart loop

```bash
# Ver últimos logs antes del crash
docker compose logs --tail=50 app
```

### Puerto 3000 o 27017 ya en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :3000
lsof -i :27017

# Matar proceso
kill -9 <PID>
```

## 📦 Volúmenes

### MongoDB Data

Los datos de MongoDB se persisten en un volumen Docker:

```bash
# Listar volúmenes
docker volume ls | grep family-app

# Inspeccionar volumen
docker volume inspect family-app_mongodb_data

# Backup (ejemplo)
docker compose exec mongodb mongodump --out=/tmp/backup
docker compose cp mongodb:/tmp/backup ./backup
```

## 🛠️ Desarrollo

Para desarrollo local, puedes montar el código como volumen:

```yaml
# docker-compose.dev.yml (crear si necesitas)
services:
  app:
    build:
      target: development # Agregar stage en Dockerfile
    volumes:
      - ./src:/app/src
      - ./libs:/app/libs
    environment:
      NODE_ENV: development
      LOG_LEVEL: debug
```

## 🔐 Seguridad

⚠️ **Para producción**:

1. Cambiar credenciales por defecto:

   ```yaml
   DB_USERNAME: ${DB_USERNAME}
   DB_PASSWORD: ${DB_PASSWORD}
   ```

2. Usar `.env` file:

   ```bash
   cp .env.example .env
   # Editar .env con valores seguros
   docker compose --env-file .env up -d
   ```

3. No exponer puerto de MongoDB:
   ```yaml
   mongodb:
     # ports: # Comentar para uso interno solo
     #   - "27017:27017"
   ```

## 📊 Monitoring

### Logs estructurados

La app logea en formato JSON para fácil parsing:

```bash
docker compose logs app | jq .
```

### Métricas de containers

```bash
docker compose stats
```

## 🔄 CI/CD

Ejemplo para GitHub Actions:

```yaml
- name: Build and test
  run: |
    docker compose up -d
    docker compose exec -T app pnpm test
    docker compose down
```

---

**Autor**: Family App Team  
**Última actualización**: 23 de diciembre de 2025
