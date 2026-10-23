# Documentación técnica — Proyecto Citas Médicas

## 1. Visión general

Este proyecto es una aplicación web para gestionar citas médicas de forma segura y escalable. Permite a los usuarios consultar turnos disponibles, reservar citas, ver su historial y recibir notificaciones; además, ofrece un panel administrativo para revisar reservas y controlar la operación del sistema.

La idea principal del desarrollo no es solo la interfaz, sino también la integridad de los datos en entornos concurrentes. El backend utiliza transacciones PostgreSQL con bloqueo pesimista mediante `SELECT ... FOR UPDATE` para evitar reservas duplicadas en el mismo turno.

---

## 2. Objetivos del sistema

- Gestionar usuarios y autenticación por roles.
- Permitir la reserva de citas con validación de disponibilidad.
- Evitar condiciones de carrera en operaciones concurrentes.
- Mantener un flujo de administración y notificaciones.
- Exponer una API REST documentada con Swagger.

---

## 3. Funcionalidades principales

### Usuario normal
- Iniciar sesión con email y contraseña.
- Consultar turnos disponibles por médico y fecha.
- Reservar una cita médica.
- Ver sus citas activas.
- Cancelar una reserva.
- Actualizar perfil.

### Administrador
- Iniciar sesión con credenciales fijas: `admin` / `1234`.
- Consultar citas reservadas del día.
- Revisar agenda médica.
- Ver reservas por usuario y especialidad.
- Gestionar notificaciones internas.

### Sistema
- Base de datos relacional PostgreSQL.
- Migraciones automáticas al iniciar la API.
- Swagger para explorar endpoints.
- Notificaciones automáticas para cambios relevantes en reservas.

---

## 4. Stack tecnológico

### Backend
- Node.js 18+
- Express 4.x
- PostgreSQL 14+
- pg (node-postgres)
- bcryptjs
- dotenv
- cors
- swagger-jsdoc
- swagger-ui-express
- nodemon

### Frontend
- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Axios

---

## 5. Arquitectura

```text
+---------------------+        HTTP        +----------------------+
|                     | -----------------> |                      |
| Frontend (Vue 3)   |                    | Backend (Express)    |
| Puerto 5173        | <----------------- | Puerto 3000         |
|                     |                    |                      |
+---------+-----------+                    +----------+-----------+
          |                                               |
          | Axios / API REST                              | pg Pool
          v                                               v
+---------------------+                    +----------------------+
| Pinia stores        |                    | PostgreSQL           |
| Vue Router         |                    | usuarios / citas /  |
| Auth / appointments|                    | notificaciones       |
+---------------------+                    +----------------------+
```

El flujo general es:
1. El frontend realiza peticiones al backend en `http://localhost:3000`.
2. El backend valida datos, ejecuta lógica de negocio y consulta Postgres.
3. La base de datos guarda usuarios, citas y notificaciones.
4. El frontend renderiza la información según el rol autenticado.

---

## 6. Estructura del proyecto

```text
Proyecto-Citas-Medicas/
├── README.md
├── DOCUMENTACION.md
├── backweb/
│   └── backweb/
│       ├── src/
│       │   ├── config/
│       │   │   ├── db.js
│       │   │   ├── migrate.js
│       │   │   └── swagger.js
│       │   ├── controllers/
│       │   │   ├── appointment.controller.js
│       │   │   └── user.controller.js
│       │   ├── middleware/
│       │   │   └── errorHandler.js
│       │   ├── models/
│       │   │   ├── appointment.model.js
│       │   │   ├── notification.model.js
│       │   │   └── user.model.js
│       │   ├── routes/
│       │   │   ├── appointment.routes.js
│       │   │   ├── auth.routes.js
│       │   │   ├── notification.routes.js
│       │   │   └── user.routes.js
│       │   └── index.js
│       ├── package.json
│       └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── proyectoxample/
│   └── ...
└── ...
```

> La carpeta `proyectoxample/` es un proyecto de referencia y no forma parte del flujo principal de la app médica.

---

## 7. Base de datos

El proyecto usa PostgreSQL con un conjunto básico de tablas:

### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `appointments`
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  doctor_name VARCHAR(150) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  user_id INT DEFAULT NULL,
  booked_at TIMESTAMPTZ DEFAULT NULL
);
```

### `notifications`
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

El backend ejecuta migraciones automáticamente al iniciar, lo que permite crear las tablas necesarias sin pasos manuales extra.

---

## 8. Reglas y flujo de negocio

### Autenticación
- El login soporta dos tipos de acceso:
  - `admin` con usuario `admin` y contraseña `1234`
  - usuario registrado con email y contraseña
- El backend compara la contraseña usando `bcryptjs`.
- La sesión se guarda en `sessionStorage` en el frontend.

### Reservas de citas
- Un turno puede estar disponible o reservado.
- La reserva se hace por ID de turno y usuario.
- Antes de confirmar la operación, el backend ejecuta `SELECT ... FOR UPDATE` para bloquear la fila.
- Si otro usuario ya reservó el mismo turno, se responde con error de conflicto.

### Notificaciones
- Cuando un usuario cancela o cambia una cita, se registra una notificación para el administrador.
- Se maneja un estado `is_read` para leer o marcar como leídas.

---

## 9. API REST

La API principal vive bajo `http://localhost:3000`.

### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Autentica un usuario o al administrador |

### Usuarios
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/users` | Lista usuarios |
| `GET` | `/api/users/:id` | Obtiene un usuario por ID |
| `POST` | `/api/users` | Crea un nuevo usuario |
| `PUT` | `/api/users/:id` | Actualiza un usuario |
| `DELETE` | `/api/users/:id` | Elimina un usuario |

### Citas
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/appointments/available` | Muestra turnos disponibles |
| `GET` | `/api/appointments/doctor` | Filtra turnos por doctor |
| `GET` | `/api/appointments/today` | Agenda del día |
| `GET` | `/api/appointments/my` | Citas del usuario actual |
| `GET` | `/api/appointments/booked` | Citas ya reservadas |
| `POST` | `/api/appointments/book` | Reserva un turno |
| `DELETE` | `/api/appointments/:id/cancel` | Cancela una reserva |

### Notificaciones
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/notifications` | Trae todas las notificaciones |
| `POST` | `/api/notifications` | Crea una notificación |
| `PATCH` | `/api/notifications/read-all` | Marca todo como leído |
| `PATCH` | `/api/notifications/:id/read` | Marca una por ID como leída |

Documentación interactiva: `http://localhost:3000/api-docs`

---

## 10. Manejo de concurrencia

El componente más importante del backend es la reserva segura de turnos. El proyecto usa PostgreSQL y transacciones para evitar que dos usuarios reserven el mismo horario simultáneamente.

```javascript
const client = await pool.connect();
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

### ¿Qué hace esto?
- La fila del turno queda bloqueada mientras se valida disponibilidad.
- Otro proceso que intente reservar el mismo turno debe esperar.
- Cuando la primera transacción termina, la segunda detecta que ya no está disponible y falla de forma controlada.

Esto evita la condición de carrera conocida como "double booking".

---

## 11. Requisitos previos

- Node.js 18 o superior
- npm o pnpm
- PostgreSQL 14 o superior
- Git

---

## 12. Configuración del entorno

### Backend
Crea un archivo `.env` dentro de `backweb/backweb/` con este contenido:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clase
DB_USER=postgres
DB_PASSWORD=tu_contraseña
```

Asegúrate de que la base de datos `clase` exista antes de ejecutar la aplicación.

---

## 13. Ejecución del proyecto

### 1) Instalar dependencias del backend
```bash
cd backweb/backweb
npm install
```

### 2) Instalar dependencias del frontend
```bash
cd frontend
npm install
```

### 3) Iniciar backend
```bash
cd backweb/backweb
npm run dev
```

### 4) Iniciar frontend
```bash
cd frontend
npm run dev
```

### 5) Abrir la aplicación
- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:3000/api-docs`

---

## 14. Roles y flujo de acceso

### Usuario normal
- Debe autenticarse con email y contraseña.
- Tiene acceso a la sección de reservas y perfil.

### Administrador
- Debe autenticarse con `admin` / `1234`.
- Puede consultar la agenda y manejar revisión de reservas.

El router del frontend protege rutas por rol y redirige a login o a panel según corresponda.

---

## 15. Buenas prácticas y mantenimiento

- Mantener la base de datos conectada antes de arrancar el backend.
- Evitar cambios directos en la lógica de disponibilidad sin ajustar pruebas de concurrencia.
- Revisar Swagger cuando se agregan o modifican endpoints.
- No subir credenciales reales al repositorio.
- Mantener la lógica de reserva en transacciones para preservar la integridad.

---

## 16. Repositorio

- GitHub: https://github.com/senjo06/Proyecto-Citas-Medicas

---

## 17. Conclusión

Este proyecto combina una interfaz moderna en Vue con una API REST en Express y una capa de persistencia robusta en PostgreSQL. Su valor principal es demostrar cómo manejar correctamente la concurrencia en un sistema de reservas médicas, garantizando que un turno no pueda ser reservado dos veces al mismo tiempo.
