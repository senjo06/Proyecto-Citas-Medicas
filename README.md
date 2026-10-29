# 🏥 Sistema de Gestión de Citas Médicas

Aplicación fullstack para reservar citas médicas con control de concurrencia, autenticación por roles y administración de turnos.

Este proyecto combina un frontend en Vue con un backend en Express y una base de datos PostgreSQL, y su objetivo principal es asegurar que dos pacientes no puedan reservar el mismo turno al mismo tiempo.

## ✨ Características principales

- Reserva de citas médicas por especialista y fecha.
- Gestión de usuarios con autenticación.
- Panel para administrador con vista de turnos reservados.
- Notificaciones internas para cambios en citas.
- Seguridad con contraseñas hasheadas usando `bcryptjs`.
- API REST documentada con Swagger.
- Prevención de condiciones de carrera con `SELECT FOR UPDATE` en PostgreSQL.

## 🧩 Stack tecnológico

### Backend
- Node.js
- Express
- PostgreSQL
- pg
- bcryptjs
- Swagger

### Frontend
- Vue 3
- TypeScript
- Pinia
- Vue Router
- Axios
- Vite

## 🏗️ Arquitectura

```text
Frontend (Vue 3) :5173
    │
    ├── Pinia stores
    ├── Vue Router
    └── Axios
        │
        ▼
Backend (Express) :3000
    │
    ├── routes/
    ├── controllers/
    ├── models/
    └── middleware/
        │
        ▼
PostgreSQL
    ├── users
    ├── appointments
    └── notifications
```

## 📁 Estructura principal

```text
Proyecto-Citas-Medicas/
├── README.md
├── DOCUMENTACION.md
├── backweb/
│   └── backweb/
│       ├── src/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── models/
│       │   ├── routes/
│       │   └── index.js
│       ├── package.json
│       └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── proyectoxample/
    └── ...
```

## ⚙️ Requisitos previos

- Node.js 18 o superior
- PostgreSQL 14 o superior
- npm
- Git

## 🚀 Instalación y ejecución

### 1) Clonar el repositorio

```bash
git clone https://github.com/senjo06/Proyecto-Citas-Medicas.git
cd Proyecto-Citas-Medicas
```

### 2) Configurar el backend

```bash
cd backweb/backweb
npm install
```

Crear un archivo `.env` con esta estructura:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clase
DB_USER=postgres
DB_PASSWORD=tu_contraseña
```

### 3) Configurar el frontend

```bash
cd ../..
cd frontend
npm install
```

### 4) Ejecutar la aplicación

Terminal 1 - Backend:
```bash
cd backweb/backweb
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Importante: mantené abiertas las dos terminales. El frontend en `5173` no inicia la API; el inicio de sesión requiere que el backend también esté ejecutándose en `3000`.

Abrir en el navegador:
- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:3000/api-docs`

## 🔐 Roles y autenticación

### Administrador
- Usuario: `admin`
- Contraseña: `1234`

### Usuario normal
- Puede autenticarse con email o nombre registrado y su contraseña.

La sesión del usuario se guarda en `sessionStorage` y el router redirige según el rol.

## 🩺 API REST principal

### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Login del sistema |

### Usuarios
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/users` | Listar usuarios |
| `POST` | `/api/users` | Crear usuario |
| `PUT` | `/api/users/:id` | Actualizar usuario |
| `DELETE` | `/api/users/:id` | Eliminar usuario |

### Citas
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/appointments/available` | Ver turnos disponibles |
| `GET` | `/api/appointments/doctor` | Ver turnos por doctor |
| `GET` | `/api/appointments/today` | Agenda del día |
| `GET` | `/api/appointments/my` | Citas del usuario |
| `GET` | `/api/appointments/booked` | Citas reservadas |
| `POST` | `/api/appointments/book` | Reservar turno |
| `DELETE` | `/api/appointments/:id/cancel` | Cancelar turno |

### Notificaciones
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/notifications` | Ver notificaciones |
| `POST` | `/api/notifications` | Crear notificación |
| `PATCH` | `/api/notifications/read-all` | Marcar todas como leídas |

## 🧠 Concurrencia y bloqueo

La lógica central del proyecto es la reserva segura de turnos. Cuando un paciente intenta reservar una cita, el backend bloquea la fila correspondiente con `SELECT ... FOR UPDATE` antes de confirmar la operación. Esto evita que dos usuarios reserven el mismo turno al mismo tiempo.

Un paciente puede reservar varios turnos, incluso el mismo día, siempre que no coincidan en la misma fecha y hora. El backend también serializa las reservas por paciente para evitar que dos solicitudes simultáneas infrinjan esta regla.

```javascript
await client.query('BEGIN');
const result = await client.query(
  'SELECT is_booked FROM appointments WHERE id = $1 FOR UPDATE',
  [appointmentId]
);

if (result.rows[0].is_booked) {
  throw new Error('Este turno ya fue reservado');
}

await client.query(
  'UPDATE appointments SET is_booked = true, user_id = $2, booked_at = NOW() WHERE id = $1',
  [appointmentId, userId]
);

await client.query('COMMIT');
```

## 📘 Documentación completa

La documentación técnica ampliada está disponible en:

- [DOCUMENTACION.md](./DOCUMENTACION.md)

## 🔗 Repositorio

- GitHub: https://github.com/senjo06/Proyecto-Citas-Medicas

## ✅ Nota final

Este proyecto está pensado como una demostración práctica de arquitectura fullstack, autenticación por roles, manejo de reservas médicas y gestión de concurrencia en bases de datos relacionales.
