# Documentación Técnica — Sistema de Gestión de Citas Médicas

---

## 1. Descripción General

Sistema web fullstack para la gestión de turnos médicos. Permite a los pacientes reservar citas con diferentes especialistas, y a los administradores gestionar usuarios, ver reservas y recibir notificaciones en tiempo real.

El concepto técnico central es la prevención de **condiciones de carrera** mediante **bloqueo pesimista** (`SELECT FOR UPDATE`) en PostgreSQL.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Función |
|------|-----------|---------|---------|
| Base de datos | PostgreSQL | 14+ | Transacciones ACID |
| Backend | Node.js + Express | 18+ / 4.x | API REST |
| Driver BD | pg (node-postgres) | 8.x | Conexión nativa PostgreSQL |
| Seguridad | bcryptjs | 2.x | Hash de contraseñas |
| Documentación | Swagger (OpenAPI 3.0) | — | `/api-docs` |
| Frontend | Vue 3 (Composition API) | 3.5 | Interfaz reactiva |
| Lenguaje | TypeScript | 6.x | Tipado estático frontend |
| Estado global | Pinia | 4.x | Store de la aplicación |
| Navegación | Vue Router | 4.x | SPA con guards por rol |
| HTTP Client | Axios | 1.x | Peticiones REST |
| Build tool | Vite | 8.x | Dev server + proxy |

---

## 3. Arquitectura

```
FRONTEND (Vue 3) :5173
  └── Proxy Vite ──► BACKEND (Express) :3000
                          └── pg Pool ──► POSTGRESQL (BD: clase)
```

**Tablas:** `users` · `appointments` · `notifications`

---

## 4. Esquema de Base de Datos

```sql
-- Usuarios del sistema
CREATE TABLE users (
    id SERIAL PRIMARY KEY, name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turnos médicos
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY, doctor_name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100) NOT NULL, appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL, is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INT DEFAULT NULL, booked_at TIMESTAMPTZ DEFAULT NULL
);

-- Notificaciones para el admin
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY, user_id INT NOT NULL,
    user_name VARCHAR(150) NOT NULL, message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API REST

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login por nombre, email o `admin` |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar todos |
| POST | `/api/users` | Crear (hashea contraseña con bcrypt) |
| PUT | `/api/users/:id` | Actualizar |
| DELETE | `/api/users/:id` | Eliminar |

### Turnos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/appointments/available` | Lista de doctores |
| GET | `/api/appointments/doctor?name=X` | Slots de un doctor |
| GET | `/api/appointments/today` | Agenda del día (admin) |
| GET | `/api/appointments/my?userId=X` | Turnos del usuario |
| GET | `/api/appointments/booked` | Todos los reservados |
| POST | `/api/appointments/book` | **Reservar** con SELECT FOR UPDATE |
| DELETE | `/api/appointments/:id/cancel` | Cancelar |

### Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Todas + conteo no leídas |
| POST | `/api/notifications` | Crear |
| PATCH | `/api/notifications/read-all` | Marcar todas leídas |

---

## 6. Concepto Core: SELECT FOR UPDATE

Previene condiciones de carrera al reservar un turno concurrentemente.

```javascript
// appointment.model.js → bookSlot()
await client.query('BEGIN');

// Bloquea la fila — el segundo cliente espera aquí
await client.query(
  'SELECT is_booked FROM appointments WHERE id = $1 FOR UPDATE',
  [appointmentId]
);

// Verifica disponibilidad y una sola reserva por día
// UPDATE atómico si pasa las verificaciones
await client.query('UPDATE appointments SET is_booked = true ... WHERE id = $1');
await client.query('COMMIT');
```

---

## 7. Roles y Autenticación

| Rol | Acceso | Credenciales |
|-----|--------|-------------|
| `admin` | Panel completo | usuario: `admin` / clave: `1234` |
| `user` | Reservar turnos + perfil | nombre o email + contraseña |

La sesión se guarda en `sessionStorage`. El guard del router redirige según el rol en cada navegación.

---

## 8. Horarios de Atención

| Día | Horario |
|-----|---------|
| Lunes — Viernes | 08:00 — 17:00 |
| Sábado | 08:00 — 11:00 |
| Domingo | Cerrado |

El backend filtra turnos pasados usando zona horaria **América/Bogotá (UTC-5)**.

---

## 9. Reglas de Negocio

- **Un turno por día por paciente.** Si intenta reservar un segundo, el sistema ofrece cancelar el anterior y tomar el nuevo.
- **Notificaciones automáticas al admin** cuando un paciente cancela, cambia su turno o actualiza su perfil.
- **Turnos pasados** no aparecen disponibles (filtro en tiempo real por hora actual de Bogotá).

---

## 10. Cómo Ejecutar

```bash
# Variables de entorno: backweb/backweb/.env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clase
DB_USER=postgres
DB_PASSWORD=tu_contraseña
```

```bash
# Terminal 1 — Backend
cd "c:\...\backweb\backweb"
npm run dev

# Terminal 2 — Frontend
cd "c:\...\frontend"
npm run dev
```

Acceder en: `http://localhost:5173`

---

## 11. Repositorio

**GitHub:** https://github.com/senjo06/Proyecto-Citas-Medicas
