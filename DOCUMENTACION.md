# Documentación Técnica — Sistema de Gestión de Citas Médicas

**Versión:** 2.0  
**Última actualización:** Enero 2025

---

## 1. Descripción General

Sistema web fullstack para la gestión de turnos médicos con las siguientes características principales:

- Pacientes pueden **reservar citas** con diferentes especialistas
- **Búsqueda en tiempo real** de doctores por nombre o especialidad
- **Historial de citas** y recordatorios automáticos
- Administradores gestionan usuarios, doctores y ven todas las reservas
- **Notificaciones en tiempo real** con sonido cuando llega una nueva
- **Modo oscuro** con persistencia
- **Validaciones estrictas** de seguridad

El concepto técnico central es la prevención de **condiciones de carrera** mediante **bloqueo pesimista** (`SELECT FOR UPDATE`) en PostgreSQL.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Función |
|------|-----------|---------|---------|
| Base de datos | PostgreSQL | 14+ | Transacciones ACID |
| Backend | Node.js + Express | 18+ / 4.x | API REST |
| Driver BD | pg (node-postgres) | 8.x | Conexión nativa PostgreSQL |
| Seguridad | bcryptjs | 2.x | Hash de contraseñas (factor 8) |
| Documentación | Swagger (OpenAPI 3.0) | — | `/api-docs` |
| Frontend | Vue 3 (Composition API) | 3.5 | Interfaz reactiva |
| Lenguaje | TypeScript | 6.x | Tipado estático frontend |
| Estado global | Pinia | 4.x | Store de la aplicación |
| Navegación | Vue Router | 4.x | SPA con guards por rol |
| HTTP Client | Axios | 1.x | Peticiones REST |
| Build tool | Vite | 8.x | Dev server + HMR |

---

## 3. Arquitectura del Sistema

```
FRONTEND (Vue 3 + Vite) :5173
  │
  └─► Proxy /api/* ─► BACKEND (Express) :3000
                          │
                          └─► pg Pool ─► POSTGRESQL :5432
                                              │
                                              └─► BD: clase
```

**Tablas:** `users` · `appointments` · `notifications` · `doctors`

---

## 4. Esquema Completo de Base de Datos

### 4.1. Tabla `users` — Pacientes del sistema

```sql
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,        -- Hash bcrypt
    phone      VARCHAR(20)  NOT NULL,         -- Obligatorio desde v2.0
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Propósito:** Almacena pacientes registrados en el sistema.

**Validaciones (frontend + backend):**
- `email`: único, formato `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `password`: mínimo 8 caracteres, al menos 1 mayúscula, 1 número
- `phone`: obligatorio

**Indices:**
```sql
-- Índice único automático en email por la constraint UNIQUE
CREATE INDEX idx_users_email ON users (email);
```

---

### 4.2. Tabla `appointments` — Pool de turnos médicos

```sql
CREATE TABLE appointments (
    id               SERIAL PRIMARY KEY,
    doctor_name      VARCHAR(150) NOT NULL,
    specialty        VARCHAR(100) NOT NULL,
    appointment_date DATE         NOT NULL,
    appointment_time TIME         NOT NULL,
    is_booked        BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id          INT          DEFAULT NULL,
    booked_at        TIMESTAMPTZ  DEFAULT NULL
);
```

**Propósito:** Pool de turnos disponibles y reservados.

**Flujo de vida de un turno:**
1. **Creación**: Admin o sistema crea turnos con `is_booked = false`
2. **Reserva**: Paciente reserva → `is_booked = true`, `user_id = X`, `booked_at = NOW()`
3. **Cancelación**: → `is_booked = false`, `user_id = NULL`, `booked_at = NULL`

**Índices optimizados:**
```sql
-- Búsqueda rápida de turnos disponibles
CREATE INDEX idx_appointments_available 
  ON appointments (appointment_date, appointment_time) 
  WHERE is_booked = false;

-- Búsqueda de turnos de un usuario
CREATE INDEX idx_appointments_user 
  ON appointments (user_id, appointment_date) 
  WHERE is_booked = true;

-- Agenda del día (vista admin)
CREATE INDEX idx_appointments_today 
  ON appointments (appointment_date) 
  WHERE appointment_date = CURRENT_DATE;
```

---

### 4.3. Tabla `notifications` — Sistema de notificaciones

```sql
CREATE TABLE notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INT          NOT NULL,
    user_name  VARCHAR(150) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);
```

**Propósito:** Notificaciones en tiempo real para el administrador.

**Se genera automáticamente cuando el paciente:**
- Reserva un turno
- Cancela un turno  
- Cambia un turno por otro
- Actualiza su perfil (nombre, email o contraseña)

**Índice optimizado:**
```sql
CREATE INDEX idx_notifications_unread 
  ON notifications (is_read, created_at DESC) 
  WHERE is_read = false;
```

**Frontend:** Polling cada 15 segundos desde `NotificationBell.vue` + sonido cuando aumenta el contador.

---

### 4.4. Tabla `doctors` — Catálogo de especialistas (v2.0)

```sql
CREATE TABLE doctors (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    specialty  VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);
```

**Propósito:** Catálogo centralizado de doctores del centro médico.

**Gestión:** CRUD completo desde el panel admin (ruta `/admin/doctores`).

**Roadmap:** Migrar `appointments.doctor_name` y `appointments.specialty` a una Foreign Key hacia esta tabla para evitar duplicación de datos.

---

## 5. API REST Completa

### 5.1. Autenticación (`/api/auth`)

#### `POST /api/auth/login`
Autentica un usuario por email/nombre o el admin especial.

**Request:**
```json
{
  "email": "admin",
  "password": "1234"
}
```

**Response (admin):**
```json
{
  "success": true,
  "role": "admin",
  "user": { "id": 0, "name": "Administrador", "email": "admin" }
}
```

**Response (paciente):**
```json
{
  "success": true,
  "role": "user",
  "user": { "id": 5, "name": "Juan Pérez", "email": "juan@correo.com" }
}
```

---

### 5.2. Usuarios (`/api/users`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar todos los usuarios |
| GET | `/api/users/:id` | Obtener un usuario por ID |
| POST | `/api/users` | Crear usuario (hashea contraseña con bcrypt) |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

**Validaciones v2.0:**
- Email único y válido (regex)
- Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 número
- Teléfono obligatorio

---

### 5.3. Turnos (`/api/appointments`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/appointments/available` | Lista única de doctores |
| GET | `/api/appointments/doctor?name=X` | Slots de un doctor (30 días futuros) |
| GET | `/api/appointments/today` | Agenda completa del día (admin) |
| GET | `/api/appointments/my?userId=X` | Turnos futuros del usuario |
| GET | `/api/appointments/history?userId=X` | Historial de citas pasadas (v2.0) |
| GET | `/api/appointments/reminder?userId=X` | Turnos de mañana (v2.0) |
| GET | `/api/appointments/booked` | Todos los turnos reservados |
| POST | `/api/appointments/book` | **Reservar turno** (con SELECT FOR UPDATE) |
| DELETE | `/api/appointments/:id/cancel` | Cancelar turno |

#### Lógica clave: `POST /api/appointments/book`

**Bloqueo pesimista para evitar doble reserva:**
```javascript
const client = await pool.connect();
await client.query('BEGIN');

// 1. Bloquea la fila — peticiones concurrentes esperan aquí
const { rows } = await client.query(
  'SELECT is_booked FROM appointments WHERE id = $1 FOR UPDATE',
  [appointmentId]
);

// 2. Verifica que no esté reservado
if (rows[0].is_booked) throw new Error('Ya reservado');

// 3. Verifica que el usuario no tenga otro turno a la misma hora ese día
const conflict = await client.query(`
  SELECT id FROM appointments
  WHERE user_id = $1
    AND appointment_date = (SELECT appointment_date FROM appointments WHERE id = $2)
    AND appointment_time = (SELECT appointment_time FROM appointments WHERE id = $2)
    AND is_booked = true
`, [userId, appointmentId]);

if (conflict.rows.length > 0) {
  throw new Error('YA_TIENE_TURNO:' + conflict.rows[0].id);
}

// 4. Reserva atómica
await client.query(
  'UPDATE appointments SET is_booked = true, user_id = $2, booked_at = NOW() WHERE id = $1',
  [appointmentId, userId]
);

await client.query('COMMIT');
```

**Filtro de horarios en tiempo real:**
```sql
WHERE (
  appointment_date > CURRENT_DATE
  OR (
    appointment_date = CURRENT_DATE
    AND appointment_time > (NOW() AT TIME ZONE 'America/Bogota')::time
  )
)
```

Esto asegura que los turnos de hoy que ya pasaron no aparecen como disponibles.

---

### 5.4. Notificaciones (`/api/notifications`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Todas las notificaciones + conteo de no leídas |
| POST | `/api/notifications` | Crear notificación |
| PATCH | `/api/notifications/:id/read` | Marcar una como leída |
| PATCH | `/api/notifications/read-all` | Marcar todas como leídas |

**Polling desde frontend:** Cada 15 segundos desde `NotificationBell.vue`.

---

### 5.5. Doctores (`/api/doctors`) — **Nuevo en v2.0**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/doctors` | Listar todos los doctores |
| GET | `/api/doctors/:id` | Obtener un doctor por ID |
| POST | `/api/doctors` | Crear doctor |
| PUT | `/api/doctors/:id` | Actualizar doctor |
| DELETE | `/api/doctors/:id` | Eliminar doctor |

**Ejemplo:**
```json
// POST /api/doctors
{
  "name": "Dr. Carlos Ruiz",
  "specialty": "Cardiología"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Dr. Carlos Ruiz",
    "specialty": "Cardiología",
    "created_at": "2025-01-09T..."
  }
}
```

---

## 6. Reglas de Negocio

### 6.1. Reserva de turnos
- Un paciente puede tener **múltiples turnos el mismo día** siempre que sean en **horarios diferentes**
- Si intenta reservar la misma hora dos veces, el sistema detecta el conflicto y ofrece cancelar el turno anterior

### 6.2. Horarios de atención
| Día | Horario |
|-----|---------|
| Lunes — Viernes | 08:00 — 17:00 |
| Sábado | 08:00 — 11:00 |
| Domingo | Cerrado |

### 6.3. Notificaciones automáticas
El sistema notifica al admin cuando el paciente:
- Reserva un turno → "Juan Pérez reservó turno con Dr. X..."
- Cancela un turno → "Juan Pérez canceló su turno..."
- Cambia un turno → "Juan Pérez cambió su turno por otro horario..."
- Actualiza su perfil → "Juan Pérez actualizó: nombre, email"

**Tipos de cancelación:**
- `'cancel'` → genera notificación: "canceló su turno"
- `'change'` → genera notificación: "cambió su turno"
- `'silent'` → NO genera notificación (cancelación interna del sistema)

---

## 7. Mejoras Implementadas en v2.0

### 7.1. Búsqueda de doctor en tiempo real
**Ubicación:** `HomeView.vue`

```vue
<input v-model="searchQuery" placeholder="Buscar por nombre o especialidad..." />
```

```typescript
const doctors = computed(() => {
  let list = allDoctors.value;
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.specialty.toLowerCase().includes(q)
    );
  }
  return list;
});
```

**Función:** Filtra la lista de doctores mientras el usuario escribe.

---

### 7.2. Validaciones estrictas de seguridad
**Ubicación:** `RegisterView.vue`, `UsersView.vue`

**Email válido:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmailValid = computed(() => 
  !form.value.email || emailRegex.test(form.value.email)
);
```

**Contraseña fuerte:**
```typescript
const isPasswordStrong = computed(() => {
  const pw = form.value.password;
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
});
```

**Teléfono obligatorio:** El campo `phone` pasó de opcional a requerido.

---

### 7.3. Modo oscuro global
**Ubicación:** `MainLayout.vue`, `AdminLayout.vue`, `style.css`

**Variables CSS:**
```css
:root {
  --color-primary: #2563eb;
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-border: #e5e7eb;
}

:root.dark {
  --color-primary: #3b82f6;
  --color-bg: #111827;
  --color-surface: #1f2937;
  --color-text: #f9fafb;
  --color-border: #374151;
}
```

**Toggle en navbar:**
```typescript
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};
```

**Persistencia:** Al montar el layout, lee `localStorage.getItem('theme')` y aplica la clase `dark` si corresponde.

---

### 7.4. Sonido en notificaciones
**Ubicación:** `NotificationBell.vue`

```typescript
const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZF...');

const fetchNotifications = async () => {
  const oldCount = unreadCount.value;
  const { data } = await axios.get('/api/notifications');
  unreadCount.value = data.unreadCount;
  
  // Reproduce sonido solo si aumentó el contador
  if (unreadCount.value > oldCount && oldCount > 0) {
    audio.play().catch(() => {});
  }
};
```

**Función:** Reproduce un sonido breve (beep) cuando llega una notificación nueva.

---

### 7.5. Historial de citas
**Backend:** `GET /api/appointments/history?userId=X`

```javascript
async getHistory(userId) {
  const { rows } = await pool.query(
    `SELECT id, doctor_name, specialty, appointment_date, appointment_time, booked_at
     FROM appointments
     WHERE user_id = $1 AND is_booked = true AND appointment_date < CURRENT_DATE
     ORDER BY appointment_date DESC, appointment_time DESC`,
    [userId]
  );
  return rows;
}
```

**Frontend:** Vista `HistoryView.vue` accesible desde `/citas/historial`.

**Función:** Muestra todas las citas médicas pasadas del paciente en una tabla con doctor, especialidad, fecha, hora y fecha de reserva.

---

### 7.6. Recordatorio de turno
**Backend:** `GET /api/appointments/reminder?userId=X`

```javascript
async getReminder(userId) {
  const { rows } = await pool.query(
    `SELECT id, doctor_name, specialty, appointment_date, appointment_time
     FROM appointments
     WHERE user_id = $1 AND is_booked = true
       AND appointment_date = CURRENT_DATE + INTERVAL '1 day'
     ORDER BY appointment_time ASC`,
    [userId]
  );
  return rows;
}
```

**Frontend:** Banner amarillo en `HomeView.vue` si tiene turnos mañana:

```vue
<div v-if="reminder.length > 0" class="reminder-banner">
  <span>🔔</span>
  <div>
    <strong>Recordatorio:</strong> Mañana tenés {{ reminder.length }} turno(s): 
    Dr. X (Cardiología) a las 09:00 hs.
  </div>
</div>
```

**Función:** Alerta visual cuando el paciente tiene citas programadas para el día siguiente.

---

### 7.7. Gestión de doctores (CRUD completo)
**Backend:**
- Modelo: `doctor.model.js` (findAll, findById, create, update, delete)
- Controlador: `doctor.controller.js`
- Rutas: `doctor.routes.js` → `/api/doctors`

**Frontend (en desarrollo):**
- Service: `doctor.service.ts`
- Store: `doctor.store.ts`
- Vista: `DoctorsView.vue` (estructura creada, falta integrar al router)

**Función:** Permite al admin agregar, editar y eliminar especialistas médicos sin acceder directamente a la base de datos.

**Pendiente:** Agregar ruta en `router/index.ts` y link en `AdminLayout.vue`.

---

## 8. Cómo Ejecutar el Proyecto

### 8.1. Requisitos previos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 8.2. Variables de entorno
**Archivo:** `backweb/backweb/.env`

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clase
DB_USER=postgres
DB_PASSWORD=tu_contraseña
```

### 8.3. Instalación y arranque

```bash
# ── Backend ──
cd backweb/backweb
npm install
npm run dev
# Servidor en http://localhost:3000
# Swagger en http://localhost:3000/api-docs

# ── Frontend (otra terminal) ──
cd frontend
npm install
npm run dev
# App en http://localhost:5173 (o 5174, 5175...)
```

### 8.4. Credenciales de acceso

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `1234` |
| Paciente | Crear desde `/registro` | — |

### 8.5. Migraciones automáticas
Al arrancar el backend, `migrate.js` crea automáticamente:
- Las 4 tablas
- Todos los índices optimizados
- Inserta 7 turnos de ejemplo (con `ON CONFLICT DO NOTHING` para que sea idempotente)

---

## 9. Estructura del Proyecto

```
Proyecto-Citas-Medicas/
├── backweb/backweb/          # Backend Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Pool de PostgreSQL
│   │   │   ├── migrate.js         # Migraciones + índices + semilla
│   │   │   └── swagger.js         # Configuración OpenAPI
│   │   ├── models/
│   │   │   ├── user.model.js      # CRUD usuarios
│   │   │   ├── appointment.model.js # CRUD turnos + SELECT FOR UPDATE
│   │   │   ├── notification.model.js # CRUD notificaciones
│   │   │   └── doctor.model.js    # CRUD doctores (v2.0)
│   │   ├── controllers/
│   │   │   ├── user.controller.js
│   │   │   ├── appointment.controller.js
│   │   │   └── doctor.controller.js (v2.0)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── appointment.routes.js
│   │   │   ├── notification.routes.js
│   │   │   └── doctor.routes.js (v2.0)
│   │   ├── middleware/
│   │   │   └── errorHandler.js    # Captura errores globales
│   │   └── index.js               # Entry point del servidor
│   ├── package.json
│   └── .env
│
├── frontend/                 # Frontend Vue 3 + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   └── NotificationBell.vue # Campana con polling + sonido
│   │   ├── layouts/
│   │   │   ├── MainLayout.vue     # Layout paciente + toggle tema
│   │   │   └── AdminLayout.vue    # Layout admin + toggle tema
│   │   ├── router/
│   │   │   └── index.ts           # Vue Router + guards por rol
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   └── doctor.service.ts (v2.0)
│   │   ├── stores/
│   │   │   ├── auth.store.ts      # Maneja sessionStorage
│   │   │   ├── user.store.ts
│   │   │   ├── appointment.store.ts
│   │   │   └── doctor.store.ts (v2.0)
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue   # Validaciones v2.0
│   │   │   ├── HomeView.vue       # Reserva turnos + búsqueda + recordatorio
│   │   │   ├── HistoryView.vue    # Historial (v2.0)
│   │   │   ├── ProfileView.vue
│   │   │   ├── UsersView.vue      # Validaciones v2.0
│   │   │   ├── BookedView.vue
│   │   │   ├── DoctorPanelView.vue
│   │   │   └── DoctorsView.vue    # Gestión doctores (v2.0 - parcial)
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── style.css              # Variables CSS + modo oscuro
│   ├── package.json
│   ├── vite.config.ts             # Proxy /api/* → :3000
│   └── .env
│
├── DOCUMENTACION.md               # Este archivo
└── README.md
```

---

## 10. Roadmap (Pendientes v2.1+)

Mejoras planificadas:

- [ ] **Terminar DoctorsView** — Agregar ruta y link en AdminLayout
- [ ] **Confirmar asistencia** — Marcar si el paciente asistió o no
- [ ] **Reportes con gráficos** — Ocupación por doctor/día con Chart.js
- [ ] **Exportar a PDF/Excel** — Lista de reservas del día
- [ ] **JWT para auth** — Reemplazar sessionStorage por tokens con expiración
- [ ] **Cambiar password admin** — Desde la app en vez de hardcodeado
- [ ] **Notificación al paciente** — Cuando admin cancela su turno
- [ ] **Paginación en tablas** — UsersView, BookedView si crecen mucho
- [ ] **Caché de doctores** — Guardar en localStorage para reducir llamadas

---

## 11. Repositorio

**GitHub:** https://github.com/senjo06/Proyecto-Citas-Medicas

---

**Fin de la documentación técnica v2.0**