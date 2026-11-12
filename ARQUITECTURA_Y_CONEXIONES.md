# Arquitectura y Conexiones del Sistema

## 📊 Diagrama General de Conexiones

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│                    (Navegador Web)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Request
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vue 3)                              │
│                 http://localhost:5173                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Views      │  │   Stores     │  │  Services    │         │
│  │  (UI/UX)     │→→│   (Pinia)    │→→│  (Axios)     │         │
│  └──────────────┘  └──────────────┘  └──────┬───────┘         │
│                                              │                   │
└──────────────────────────────────────────────┼──────────────────┘
                                               │ HTTP/REST
                                               │ Axios Requests
                                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                           │
│                 http://localhost:3000                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Routes     │→→│ Controllers  │→→│   Models     │         │
│  │  (API REST)  │  │  (Business)  │  │   (Data)     │         │
│  └──────────────┘  └──────────────┘  └──────┬───────┘         │
│                                              │                   │
└──────────────────────────────────────────────┼──────────────────┘
                                               │ pg (node-postgres)
                                               │ SQL Queries
                                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                 BASE DE DATOS (PostgreSQL)                       │
│                    localhost:5432                                │
│                    Database: citas_db                            │
│                                                                  │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │  users   │ │ appointments │ │   doctors    │ │  notif.  │  │
│  └──────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 TODAS LAS CONEXIONES DEL SISTEMA

### **CONEXIÓN 1: Frontend → Backend (HTTP/REST)**

**Tipo:** HTTP REST API  
**Protocolo:** HTTP  
**Método:** Axios (librería JavaScript)  
**Puertos:** 5173 → 3000

#### **URLs de Conexión:**

| Frontend Service | URL Backend | Método | Propósito |
|-----------------|-------------|--------|-----------|
| `auth.service.ts` | `POST /api/auth/login` | POST | Iniciar sesión |
| `user.service.ts` | `GET /api/users` | GET | Listar usuarios |
| `user.service.ts` | `POST /api/users` | POST | Crear usuario |
| `user.service.ts` | `PUT /api/users/:id` | PUT | Actualizar usuario |
| `user.service.ts` | `DELETE /api/users/:id` | DELETE | Eliminar usuario |
| `appointment.service.ts` | `GET /api/appointments/available` | GET | Listar citas disponibles |
| `appointment.service.ts` | `GET /api/appointments/doctor?name=X` | GET | Citas de un doctor |
| `appointment.service.ts` | `POST /api/appointments/book` | POST | Reservar cita |
| `appointment.service.ts` | `DELETE /api/appointments/cancel/:id` | DELETE | Cancelar cita |
| `appointment.service.ts` | `GET /api/appointments/booked` | GET | Citas reservadas |
| `appointment.service.ts` | `GET /api/appointments/user/:userId` | GET | Citas de un usuario |
| `notification.service.ts` | `GET /api/notifications/user/:userId` | GET | Notificaciones de usuario |
| `notification.service.ts` | `PATCH /api/notifications/:id/read` | PATCH | Marcar como leída |
| `doctor.service.ts` | `GET /api/doctors` | GET | Listar doctores |
| `doctor.service.ts` | `POST /api/doctors` | POST | Crear doctor |
| `doctor.service.ts` | `PUT /api/doctors/:id` | PUT | Actualizar doctor |
| `doctor.service.ts` | `DELETE /api/doctors/:id` | DELETE | Eliminar doctor |
| `doctor-schedule.service.ts` | `GET /api/doctor-schedules` | GET | Horarios de doctores |
| `doctor-schedule.service.ts` | `GET /api/doctor-schedules/doctor/:id` | GET | Horarios de un doctor |
| `doctor-schedule.service.ts` | `GET /api/doctor-schedules/doctor/:id/slots/:date` | GET | Slots disponibles |
| `doctor-schedule.service.ts` | `POST /api/doctor-schedules` | POST | Crear horario |
| `doctor-schedule.service.ts` | `PUT /api/doctor-schedules/:id` | PUT | Actualizar horario |
| `doctor-schedule.service.ts` | `DELETE /api/doctor-schedules/:id` | DELETE | Eliminar horario |

#### **Configuración CORS:**
```javascript
// backweb/backweb/src/index.js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### **CONEXIÓN 2: Backend → Base de Datos (PostgreSQL)**

**Tipo:** Conexión Pool SQL  
**Protocolo:** PostgreSQL Protocol  
**Librería:** `pg` (node-postgres)  
**Puerto:** 3000 → 5432

#### **Configuración de Conexión:**
```javascript
// backweb/backweb/src/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',      // Servidor PostgreSQL
  port: 5432,            // Puerto PostgreSQL
  database: 'citas_db',  // Nombre de la base de datos
  user: 'postgres',      // Usuario
  password: '1234'       // Contraseña
});
```

#### **Tablas y Relaciones:**

```sql
users (id, name, email, password, phone)
   ↓ 1:N
appointments (id, doctor_name, specialty, date, time, is_booked, user_id)
   
doctors (id, name, specialty)
   ↓ 1:N
doctor_schedules (id, doctor_id, day_of_week, start_time, end_time)

notifications (id, user_id, user_name, message, is_read)
```

#### **Queries Principales:**

| Modelo | Query | Tipo |
|--------|-------|------|
| User.findAll() | `SELECT * FROM users` | SELECT |
| User.create() | `INSERT INTO users (name, email, password, phone) VALUES (...)` | INSERT |
| User.update() | `UPDATE users SET ... WHERE id = $1` | UPDATE |
| User.delete() | `DELETE FROM users WHERE id = $1` | DELETE |
| Appointment.book() | `BEGIN; SELECT * FROM appointments WHERE id = $1 FOR UPDATE; UPDATE ...` | TRANSACTION |
| Appointment.findAvailable() | `SELECT * FROM appointments WHERE is_booked = false` | SELECT |
| Doctor.findAll() | `SELECT * FROM doctors` | SELECT |
| DoctorSchedule.findByDoctor() | `SELECT * FROM doctor_schedules WHERE doctor_id = $1` | SELECT + JOIN |

---

## 🔐 FLUJO COMPLETO DE UNA PETICIÓN

### **Ejemplo: Usuario reserva una cita**

```
1. USUARIO hace click en "Reservar" en el navegador
                ↓
2. FRONTEND (Vue)
   - HomeView.vue captura el evento
   - Llama a appointmentStore.bookAppointment()
                ↓
3. PINIA STORE
   - Ejecuta action bookAppointment()
   - Llama a AppointmentService.book(appointmentId, userId)
                ↓
4. SERVICE (Axios)
   - Hace POST a http://localhost:3000/api/appointments/book
   - Envía JSON: { appointmentId: 123, userId: 1 }
                ↓
5. BACKEND - Express Router
   - Recibe en app.post('/api/appointments/book')
   - Llama a appointmentController.bookAppointment()
                ↓
6. BACKEND - Controller
   - Valida datos
   - Llama a Appointment.book(appointmentId, userId)
                ↓
7. BACKEND - Model
   - Inicia transacción SQL
   - BEGIN TRANSACTION
   - SELECT * FROM appointments WHERE id = 123 FOR UPDATE
   - UPDATE appointments SET is_booked = true, user_id = 1
   - COMMIT
                ↓
8. POSTGRESQL
   - Ejecuta queries
   - Bloquea fila para evitar conflictos
   - Actualiza datos
   - Retorna resultado
                ↓
9. BACKEND devuelve respuesta JSON:
   { success: true, data: { id: 123, ... } }
                ↓
10. FRONTEND recibe respuesta
    - Store actualiza estado
    - Vue reacciona y actualiza UI
    - Usuario ve "¡Cita reservada!"
```

---

## 🌐 PUERTOS Y SERVICIOS

| Servicio | Puerto | URL | Estado Requerido |
|----------|--------|-----|------------------|
| PostgreSQL | 5432 | localhost:5432 | ✅ Debe estar corriendo |
| Backend Express | 3000 | http://localhost:3000 | ✅ Debe estar corriendo |
| Frontend Vite | 5173 | http://localhost:5173 | ✅ Debe estar corriendo |
| Swagger Docs | 3000 | http://localhost:3000/api-docs | ⚡ Auto con backend |

---

## 🔒 SEGURIDAD Y AUTENTICACIÓN

### **Flujo de Autenticación:**

```
1. Usuario ingresa email/password en LoginView
                ↓
2. POST /api/auth/login
                ↓
3. Backend verifica con bcrypt:
   bcrypt.compare(password, hashedPassword)
                ↓
4. Si correcto → retorna:
   {
     success: true,
     user: { id, name, email, role },
     role: 'user' | 'admin'
   }
                ↓
5. Frontend guarda en sessionStorage:
   {
     user: { ... },
     role: 'user'
   }
                ↓
6. Router verifica role en cada navegación:
   router.beforeEach((to) => {
     if (to.meta.requiresAuth && !role) → redirect login
     if (to.meta.role === 'admin' && role !== 'admin') → redirect
   })
```

---

## 📦 DEPENDENCIAS CLAVE

### **Frontend:**
- **Vue 3** - Framework UI
- **Pinia** - State management (conecta stores con services)
- **Vue Router** - Navegación (guards de autenticación)
- **Axios** - Cliente HTTP (hace peticiones al backend)
- **TypeScript** - Tipado (interfaces para datos del backend)

### **Backend:**
- **Express** - Framework web (maneja rutas HTTP)
- **pg (node-postgres)** - Cliente PostgreSQL (ejecuta queries)
- **bcryptjs** - Encriptación (hashea contraseñas)
- **cors** - Habilita conexiones desde frontend
- **swagger-jsdoc/swagger-ui-express** - Documentación API

### **Base de Datos:**
- **PostgreSQL 14+** - Base de datos relacional
- **Transacciones ACID** - Garantiza consistencia
- **SELECT FOR UPDATE** - Previene condiciones de carrera

---

## 🎯 PUNTOS CLAVE PARA EXPLICAR

### **1. Separación Frontend-Backend (Arquitectura de 3 Capas)**
- Frontend: Solo UI y lógica de presentación
- Backend: Lógica de negocio y validaciones
- Base de Datos: Almacenamiento persistente

### **2. Comunicación REST**
- Frontend NO accede directamente a la BD
- Todo pasa por API REST del backend
- JSON como formato de intercambio

### **3. Estado Reactivo**
- Pinia mantiene estado sincronizado
- Cuando cambia la BD → backend responde → store actualiza → Vue re-renderiza

### **4. Seguridad**
- Contraseñas nunca en texto plano
- bcrypt hash con salt factor 8
- Validaciones en frontend Y backend

### **5. Concurrencia**
- SELECT FOR UPDATE bloquea filas
- Transacciones SQL evitan conflictos
- Dos usuarios no pueden reservar misma cita

---

## 🔍 COMANDOS PARA VERIFICAR CONEXIONES

### **1. Verificar PostgreSQL:**
```bash
psql -U postgres -d citas_db -c "SELECT version();"
```

### **2. Verificar Backend:**
```bash
curl http://localhost:3000/api/users
```

### **3. Verificar Frontend:**
- Abrir http://localhost:5173
- Abrir DevTools (F12) → Network
- Ver peticiones a localhost:3000

### **4. Ver todas las conexiones activas:**
```sql
SELECT * FROM pg_stat_activity WHERE datname = 'citas_db';
```

---

## ✅ CHECKLIST ANTES DE PRESENTAR

- [ ] PostgreSQL corriendo en puerto 5432
- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] Base de datos `citas_db` creada y con datos
- [ ] Puedo hacer login correctamente
- [ ] Puedo reservar una cita
- [ ] Puedo ver usuarios en admin panel
- [ ] CORS configurado correctamente
- [ ] No hay errores en consola del navegador

---

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Autor:** Sistema de Citas Médicas
