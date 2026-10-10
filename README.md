# 🏥 Sistema de Gestión de Citas Médicas

Aplicación fullstack para la reserva de turnos médicos con manejo de **condiciones de carrera** mediante transacciones pesimistas (`SELECT FOR UPDATE`) en PostgreSQL.

---

## 📋 Tabla de contenidos

- [Descripción del proyecto](#descripción-del-proyecto)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y configuración](#instalación-y-configuración)
- [Uso](#uso)
- [API REST](#api-rest)
- [Concepto clave: SELECT FOR UPDATE](#concepto-clave-select-for-update)
- [Base de datos](#base-de-datos)

---

## Descripción del proyecto

Este proyecto demuestra cómo evitar **condiciones de carrera** en un sistema de reservas médicas concurrentes. El caso de uso central es: dos pacientes intentan reservar el mismo turno al mismo tiempo — solo uno puede ganar, y el sistema lo garantiza a nivel de base de datos usando bloqueo pesimista.

**Funcionalidades:**
- Ver turnos médicos disponibles en tiempo real
- Reservar un turno de forma atómica y segura
- CRUD completo de pacientes (usuarios)
- Contraseñas hasheadas con bcrypt
- Documentación Swagger interactiva

---

## Tecnologías utilizadas

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Entorno de ejecución |
| Express | 4.x | Framework HTTP |
| PostgreSQL | 14+ | Base de datos relacional |
| pg (node-postgres) | 8.x | Driver de PostgreSQL |
| bcryptjs | 2.x | Hash de contraseñas |
| cors | 2.x | Política de origen cruzado |
| dotenv | 16.x | Variables de entorno |
| swagger-jsdoc | 6.x | Generación de spec OpenAPI |
| swagger-ui-express | 5.x | Documentación interactiva |
| nodemon | 3.x | Recarga automática en desarrollo |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Vue 3 | 3.5 | Framework reactivo (Composition API) |
| TypeScript | 6.x | Tipado estático |
| Vue Router | 4.x | Navegación SPA |
| Pinia | 4.x | Manejo de estado global |
| Axios | 1.x | Cliente HTTP |
| Vite | 8.x | Build tool y dev server |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Vue 3 + TypeScript + Pinia + Vue Router (puerto 5173)      │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ HomeView │   │UsersView │   │MainLayout│               │
│  │(turnos)  │   │(CRUD)    │   │(navbar)  │               │
│  └────┬─────┘   └────┬─────┘   └──────────┘               │
│       │              │                                      │
│  ┌────▼──────────────▼────┐                                │
│  │    Stores (Pinia)       │ appointment.store / user.store │
│  └────────────┬────────────┘                               │
│               │ axios                                       │
│  ┌────────────▼────────────┐                               │
│  │    Services (TypeScript) │ appointment.service / user... │
│  └─────────────────────────┘                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP (proxy Vite → localhost:3000)
┌──────────────────▼──────────────────────────────────────────┐
│                        BACKEND                               │
│  Node.js + Express (puerto 3000)                            │
│                                                             │
│  /api/users        →  user.routes    → user.controller      │
│  /api/appointments →  appt.routes   → appt.controller      │
│  /api-docs         →  Swagger UI                           │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │  Middleware: cors / express.json / errorHandler │        │
│  └────────────────────────────────────────────────┘        │
└──────────────────┬──────────────────────────────────────────┘
                   │ pg Pool (conexiones)
┌──────────────────▼──────────────────────────────────────────┐
│                      POSTGRESQL                              │
│  Tabla: users         Tabla: appointments                   │
│  - id, name, email    - id, doctor_name, specialty          │
│  - password (bcrypt)  - appointment_date, appointment_time  │
│  - created_at         - is_booked, user_id, booked_at       │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura del proyecto

```
Proyecto-Citas Medicas/
│
├── backweb/backweb/              # Backend Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # Pool de conexiones PostgreSQL
│   │   │   ├── migrate.js        # Migraciones automáticas al arrancar
│   │   │   └── swagger.js        # Configuración OpenAPI/Swagger
│   │   ├── controllers/
│   │   │   ├── user.controller.js         # CRUD de usuarios
│   │   │   └── appointment.controller.js  # Reserva de turnos
│   │   ├── middleware/
│   │   │   └── errorHandler.js   # Manejo global de errores
│   │   ├── models/
│   │   │   ├── user.model.js         # Queries de usuarios con bcrypt
│   │   │   └── appointment.model.js  # SELECT FOR UPDATE (core)
│   │   ├── routes/
│   │   │   ├── user.routes.js         # GET/POST/PUT/DELETE /api/users
│   │   │   └── appointment.routes.js  # GET /available, POST /book
│   │   └── index.js              # Entrada del servidor
│   ├── .env                      # Variables de entorno (no se sube a git)
│   ├── .env.example              # Plantilla de variables de entorno
│   └── package.json
│
└── frontend/                     # Frontend Vue 3 + TypeScript
    ├── src/
    │   ├── layouts/
    │   │   └── MainLayout.vue    # Navbar + router-view + footer
    │   ├── views/
    │   │   ├── HomeView.vue      # Listado y reserva de turnos
    │   │   └── UsersView.vue     # CRUD de usuarios
    │   ├── stores/
    │   │   ├── appointment.store.ts  # Estado global de citas (Pinia)
    │   │   └── user.store.ts         # Estado global de usuarios (Pinia)
    │   ├── services/
    │   │   ├── appointment.service.ts  # Llamadas axios a /api/appointments
    │   │   └── user.service.ts         # Llamadas axios a /api/users
    │   ├── router/
    │   │   └── index.ts          # Rutas con MainLayout como padre
    │   ├── App.vue               # Raíz — solo contiene <router-view>
    │   ├── main.ts               # Registra Vue, Pinia y Router
    │   └── style.css             # Estilos globales (reset + base)
    ├── vite.config.ts            # Proxy /api → localhost:3000
    └── package.json
```

---

## Instalación y configuración

### Prerrequisitos
- Node.js 18 o superior
- PostgreSQL 14 o superior corriendo localmente
- npm 9+

### 1. Clonar el repositorio

```bash
git clone https://github.com/senjo06/Proyecto-Citas-Medicas.git
cd Proyecto-Citas-Medicas
```

### 2. Configurar el backend

```bash
cd backweb/backweb
npm install
```

Crear el archivo `.env` basándose en `.env.example`:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=clase
DB_USER=postgres
DB_PASSWORD=tu_contraseña
```

> La base de datos `clase` debe existir en PostgreSQL antes de arrancar.  
> Las tablas se crean automáticamente al iniciar el servidor.

### 3. Configurar el frontend

```bash
cd frontend
npm install
```

---

## Uso

Arrancar ambos servidores en terminales separadas:

**Terminal 1 — Backend:**
```bash
cd backweb/backweb
npm run dev
```
Salida esperada:
```
⏳ Iniciando migración de la base de datos...
✅ Migración completada. Tablas de usuarios y citas listas.
🚀 Servidor en   http://localhost:3000
📖 Swagger en    http://localhost:3000/api-docs
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Luego abrir el navegador en `http://localhost:5173`

---

## API REST

### Base URL
```
http://localhost:3000
```

### Turnos médicos — `/api/appointments`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/appointments/available` | Lista todos los turnos disponibles (`is_booked = false`) |
| `POST` | `/api/appointments/book` | Reserva un turno con `SELECT FOR UPDATE` |

**Body para reservar:**
```json
{
  "appointmentId": 1,
  "userId": 45
}
```

**Respuestas posibles:**
- `200 OK` — Turno reservado exitosamente
- `400 Bad Request` — Faltan campos requeridos
- `409 Conflict` — El turno ya fue reservado por otro paciente

### Usuarios — `/api/users`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/users` | Lista todos los usuarios |
| `GET` | `/api/users/:id` | Obtiene un usuario por ID |
| `POST` | `/api/users` | Crea un nuevo usuario |
| `PUT` | `/api/users/:id` | Actualiza nombre y email |
| `DELETE` | `/api/users/:id` | Elimina un usuario |

**Body para crear usuario:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@correo.com",
  "password": "micontraseña123"
}
```

> La documentación completa e interactiva está disponible en `http://localhost:3000/api-docs`

---

## Concepto clave: SELECT FOR UPDATE

El núcleo del proyecto es la prevención de condiciones de carrera. Sin bloqueo, si dos pacientes intentan reservar el mismo turno al mismo tiempo, ambos podrían leer `is_booked = false` y ambos procederían a reservarlo — resultando en una doble reserva.

### Flujo con bloqueo pesimista

```
Paciente A                    PostgreSQL                  Paciente B
    │                             │                            │
    ├── BEGIN ──────────────────► │                            │
    ├── SELECT ... FOR UPDATE ──► │ ◄─── SELECT ... FOR UPDATE ┤
    │                             │ ← Paciente B ESPERA        │
    ├── is_booked = false ───────►│                            │
    ├── UPDATE SET is_booked=true►│                            │
    ├── COMMIT ─────────────────► │                            │
    │                             │ ─── Paciente B continúa ──►│
    │                             │     is_booked = true       │
    │                             │ ─── ERROR 409 ────────────►│
```

### Código implementado en `appointment.model.js`

```javascript
async bookSlot(appointmentId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Bloquea la fila — otras transacciones deben esperar
    const { rows } = await client.query(
      'SELECT is_booked FROM appointments WHERE id = $1 FOR UPDATE',
      [appointmentId]
    );

    if (rows[0].is_booked) {
      throw new Error('Este turno ya fue reservado por otro paciente.');
    }

    await client.query(
      'UPDATE appointments SET is_booked = true, user_id = $2, booked_at = NOW() WHERE id = $1',
      [appointmentId, userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## Base de datos

### Tabla `users`
```sql
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,   -- hash bcrypt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `appointments`
```sql
CREATE TABLE appointments (
    id               SERIAL PRIMARY KEY,
    doctor_name      VARCHAR(150) NOT NULL,
    specialty        VARCHAR(100) NOT NULL,
    appointment_date DATE         NOT NULL,
    appointment_time TIME         NOT NULL,
    is_booked        BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id          INT          DEFAULT NULL,
    booked_at        TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
```

### Datos semilla
Al arrancar el servidor se insertan automáticamente 10 turnos de prueba con distintos especialistas y fechas, usando `ON CONFLICT (id) DO NOTHING` para que sean idempotentes.

---

> Proyecto desarrollado para la materia de Bases de Datos — Demostración de transacciones y concurrencia con PostgreSQL.
