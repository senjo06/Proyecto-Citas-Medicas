# Puntos de Acoplamiento Backend ↔ Frontend

## ⚠️ CAMBIOS QUE AFECTAN AMBOS LADOS

Este documento identifica **exactamente** qué elementos están conectados entre backend y frontend. Si modificas uno, **DEBES modificar el otro** para que el sistema funcione.

---

## 🔗 1. ENDPOINTS DE LA API

### ❗ CRÍTICO: URLs deben coincidir exactamente

#### **Ejemplo de Acoplamiento:**

**Backend:** `backweb/backweb/src/routes/user.routes.js`
```javascript
router.get('/', userController.fetchAll);        // GET /api/users
router.post('/', userController.create);         // POST /api/users
router.put('/:id', userController.update);       // PUT /api/users/:id
router.delete('/:id', userController.remove);    // DELETE /api/users/:id
```

**Frontend:** `frontend/src/services/user.service.ts`
```typescript
const API_URL = 'http://localhost:3000/api/users';

fetchAll()  → axios.get(API_URL)              // GET /api/users
create()    → axios.post(API_URL, payload)    // POST /api/users
update()    → axios.put(`${API_URL}/${id}`)   // PUT /api/users/:id
remove()    → axios.delete(`${API_URL}/${id}`) // DELETE /api/users/:id
```

### 📋 TABLA COMPLETA DE ENDPOINTS ACOPLADOS

| Backend Route | Frontend Service | Si cambias backend... | Debes cambiar en frontend |
|---------------|------------------|----------------------|---------------------------|
| `POST /api/auth/login` | `auth.service.ts` → `login()` | ✅ Cambiar ruta | URL en `login()` |
| `GET /api/users` | `user.service.ts` → `fetchAll()` | ✅ Cambiar ruta | Constante `API_URL` |
| `POST /api/users` | `user.service.ts` → `create()` | ✅ Cambiar ruta | Método `create()` |
| `PUT /api/users/:id` | `user.service.ts` → `update()` | ✅ Cambiar ruta | Método `update()` |
| `DELETE /api/users/:id` | `user.service.ts` → `remove()` | ✅ Cambiar ruta | Método `remove()` |
| `GET /api/appointments/available` | `appointment.service.ts` → `getAvailable()` | ✅ Cambiar ruta | URL en `getAvailable()` |
| `GET /api/appointments/doctor` | `appointment.service.ts` → `getByDoctor()` | ✅ Cambiar ruta | URL con params |
| `POST /api/appointments/book` | `appointment.service.ts` → `book()` | ✅ Cambiar ruta | URL en `book()` |
| `DELETE /api/appointments/cancel/:id` | `appointment.service.ts` → `cancelBooking()` | ✅ Cambiar ruta | URL en `cancelBooking()` |
| `GET /api/appointments/booked` | `appointment.service.ts` → `getBooked()` | ✅ Cambiar ruta | URL en `getBooked()` |
| `GET /api/appointments/user/:userId` | `appointment.service.ts` → `getUserAppointments()` | ✅ Cambiar ruta | URL con userId |
| `GET /api/notifications/user/:userId` | `notification.service.ts` → `getByUserId()` | ✅ Cambiar ruta | URL con userId |
| `PATCH /api/notifications/:id/read` | `notification.service.ts` → `markAsRead()` | ✅ Cambiar ruta | URL en `markAsRead()` |
| `GET /api/doctors` | `doctor.service.ts` → `getAll()` | ✅ Cambiar ruta | Constante `API_URL` |
| `POST /api/doctors` | `doctor.service.ts` → `create()` | ✅ Cambiar ruta | Método `create()` |
| `GET /api/doctor-schedules` | `doctor-schedule.service.ts` → `getAllSchedules()` | ✅ Cambiar ruta | Constante `API_URL` |
| `GET /api/doctor-schedules/doctor/:id` | `doctor-schedule.service.ts` → `getSchedulesByDoctor()` | ✅ Cambiar ruta | URL con doctorId |
| `GET /api/doctor-schedules/doctor/:id/slots/:date` | `doctor-schedule.service.ts` → `getAvailableSlots()` | ✅ Cambiar ruta | URL con params |

---

## 📦 2. ESTRUCTURA DE DATOS (JSON)

### ❗ CRÍTICO: Los campos deben coincidir

#### **Ejemplo: Usuario**

**Backend retorna:**
```javascript
// backweb/backweb/src/controllers/user.controller.js
{
  success: true,
  data: {
    id: 1,
    name: "Juan Pérez",
    email: "juan@correo.com",
    phone: "3001234567",
    created_at: "2024-01-15T10:30:00.000Z"
  }
}
```

**Frontend espera:**
```typescript
// frontend/src/services/user.service.ts
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  created_at?: string;
}
```

### 📋 ESTRUCTURAS DE DATOS ACOPLADAS

#### **1. User (Usuario)**

**Backend:** `models/user.model.js` + `controllers/user.controller.js`
```javascript
{
  id: number,
  name: string,
  email: string,
  password: string,  // Solo en backend, NO se envía al frontend
  phone: string,
  created_at: timestamp
}
```

**Frontend:** `services/user.service.ts`
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  created_at?: string;
}
```

⚠️ **Si agregas un campo nuevo:**
- Backend: Agregar columna en BD + modelo + controller
- Frontend: Agregar en interface `User` + actualizar forms

---

#### **2. Appointment (Cita)**

**Backend:** `models/appointment.model.js`
```javascript
{
  id: number,
  doctor_name: string,
  specialty: string,
  appointment_date: date,
  appointment_time: time,
  is_booked: boolean,
  user_id: number | null,
  booked_at: timestamp | null,
  patient_name?: string,      // JOIN con users
  patient_email?: string,     // JOIN con users
  patient_phone?: string      // JOIN con users
}
```

**Frontend:** `services/appointment.service.ts`
```typescript
interface Appointment {
  id: number;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  is_booked: boolean;
  user_id?: number | null;
  booked_at?: string | null;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
}
```

---

#### **3. Doctor**

**Backend:** `models/doctor.model.js`
```javascript
{
  id: number,
  name: string,
  specialty: string,
  created_at: timestamp
}
```

**Frontend:** `services/doctor.service.ts`
```typescript
interface Doctor {
  id: number;
  name: string;
  specialty: string;
  created_at?: string;
}
```

---

#### **4. DoctorSchedule (Horario)**

**Backend:** `models/doctor-schedule.model.js`
```javascript
{
  id: number,
  doctor_id: number,
  doctor_name?: string,       // JOIN con doctors
  specialty?: string,         // JOIN con doctors
  day_of_week: number,        // 0=Domingo, 6=Sábado
  day_name?: string,          // Generado en controller
  start_time: time,
  end_time: time,
  duration_minutes: number,
  is_active: boolean,
  created_at: timestamp
}
```

**Frontend:** `services/doctor-schedule.service.ts`
```typescript
interface DoctorSchedule {
  id: number;
  doctor_id: number;
  doctor_name?: string;
  specialty?: string;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_active: boolean;
  created_at?: string;
}
```

---

#### **5. Notification**

**Backend:** `models/notification.model.js`
```javascript
{
  id: number,
  user_id: number,
  user_name: string,
  message: string,
  is_read: boolean,
  created_at: timestamp
}
```

**Frontend:** `services/notification.service.ts`
```typescript
interface Notification {
  id: number;
  user_id: number;
  user_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
```

---

## 🔌 3. FORMATO DE RESPUESTA

### ❗ CRÍTICO: Estructura de respuesta del backend

**Backend siempre responde:**
```javascript
// Éxito
{
  success: true,
  data: { ... }  // o array [...]
}

// Error
{
  success: false,
  error: "Mensaje de error"
}
```

**Frontend siempre espera:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

⚠️ **Si cambias este formato:**
- Backend: Cambiar en TODOS los controllers
- Frontend: Cambiar en TODOS los services

---

## 🎯 4. QUERY PARAMETERS Y PATH PARAMS

### ❗ CRÍTICO: Nombres de parámetros deben coincidir

#### **Ejemplo 1: Query Parameter**

**Backend:**
```javascript
// routes/appointment.routes.js
router.get('/doctor', appointmentController.getByDoctorName);

// controllers/appointment.controller.js
const doctorName = req.query.name;  // ← Nombre del parámetro: "name"
```

**Frontend:**
```typescript
// services/appointment.service.ts
axios.get(`${BASE_URL}/api/appointments/doctor`, {
  params: { name: doctorName }  // ← DEBE ser "name"
});
```

⚠️ **Si cambias `name` a `doctor_name` en backend:**
- Frontend DEBE cambiar a `params: { doctor_name: ... }`

---

#### **Ejemplo 2: Path Parameter**

**Backend:**
```javascript
// routes/user.routes.js
router.delete('/:id', userController.remove);

// controllers/user.controller.js
const userId = req.params.id;  // ← Parámetro en URL: "id"
```

**Frontend:**
```typescript
// services/user.service.ts
axios.delete(`${API_URL}/${id}`)  // ← DEBE usar "id"
```

---

## 🚨 5. CÓDIGOS DE ESTADO HTTP

### ❗ IMPORTANTE: Frontend reacciona según códigos

**Backend envía:**
```javascript
res.status(200).json({ success: true, data: ... });  // OK
res.status(201).json({ success: true, data: ... });  // Created
res.status(400).json({ success: false, error: ... }); // Bad Request
res.status(404).json({ success: false, error: ... }); // Not Found
res.status(500).json({ success: false, error: ... }); // Server Error
```

**Frontend reacciona:**
```typescript
try {
  const response = await axios.get(...);
  // response.status === 200
} catch (error) {
  // error.response.status === 400, 404, 500, etc.
  if (error.response.status === 401) {
    // Redirigir a login
  }
}
```

---

## 🔒 6. VALIDACIONES

### ❗ CRÍTICO: Reglas de validación deben coincidir

#### **Ejemplo: Registro de Usuario**

**Backend valida:**
```javascript
// controllers/user.controller.js
if (!name || !email || !password || !phone) {
  return res.status(400).json({ error: 'Todos los campos son obligatorios' });
}

if (password.length < 8) {
  return res.status(400).json({ error: 'Contraseña mínimo 8 caracteres' });
}

// Email único (verificado en BD)
```

**Frontend valida LO MISMO:**
```typescript
// views/RegisterView.vue
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!form.name || !form.email || !form.password || !form.phone) {
  error.value = 'Todos los campos son obligatorios';
  return;
}

if (form.password.length < 8) {
  error.value = 'Contraseña mínimo 8 caracteres';
  return;
}

if (!emailRegex.test(form.email)) {
  error.value = 'Email inválido';
  return;
}
```

⚠️ **Si cambias validación en backend (ej: contraseña de 10 caracteres):**
- Frontend DEBE actualizar la misma validación

---

## 🌐 7. CORS ORIGINS

### ❗ CRÍTICO: Frontend debe estar permitido

**Backend permite:**
```javascript
// backweb/backweb/src/index.js
app.use(cors({
  origin: [
    'http://localhost:5173',  // ← Puerto de Vite
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
  ]
}));
```

**Frontend corre en:**
```
http://localhost:5173  // ← DEBE estar en la lista
```

⚠️ **Si cambias puerto de frontend:**
- Backend DEBE agregarlo a la lista de CORS

---

## 📝 8. NOMBRES DE CAMPOS EN FORMULARIOS

### ❗ IMPORTANTE: Consistencia en nombres

#### **Ejemplo: Crear Cita**

**Backend espera:**
```javascript
// controllers/appointment.controller.js
const { appointmentId, userId } = req.body;
```

**Frontend envía:**
```typescript
// services/appointment.service.ts
axios.post('/api/appointments/book', {
  appointmentId: 123,  // ← DEBE coincidir
  userId: 1            // ← DEBE coincidir
});
```

⚠️ **Si cambias `appointmentId` a `appointment_id` en backend:**
- Frontend DEBE cambiar a `appointment_id`

---

## 🎨 9. FORMATO DE FECHAS Y HORAS

### ❗ IMPORTANTE: Formato debe ser compatible

**Backend envía:**
```javascript
appointment_date: "2024-01-15"        // YYYY-MM-DD
appointment_time: "14:30:00"          // HH:MM:SS
created_at: "2024-01-15T10:30:00.000Z" // ISO 8601
```

**Frontend procesa:**
```typescript
const date = new Date(appointment.appointment_date);
const time = appointment.appointment_time.substring(0, 5); // HH:MM
```

⚠️ **Si cambias formato de fecha:**
- Ambos lados deben entender el nuevo formato

---

## ✅ CHECKLIST DE CAMBIOS SEGUROS

Cuando necesites hacer un cambio:

### **1. Cambiar un endpoint:**
- [ ] Actualizar ruta en backend (`routes/*.js`)
- [ ] Actualizar URL en frontend (`services/*.ts`)
- [ ] Probar que funciona
- [ ] Actualizar documentación Swagger

### **2. Agregar un campo nuevo:**
- [ ] Agregar columna en BD (migrate.js)
- [ ] Actualizar modelo backend (`models/*.js`)
- [ ] Actualizar interface frontend (`services/*.ts`)
- [ ] Actualizar formularios si aplica (`views/*.vue`)
- [ ] Actualizar validaciones en ambos lados

### **3. Cambiar formato de respuesta:**
- [ ] ❌ NO RECOMENDADO (rompe todo)
- [ ] Si es necesario: actualizar TODOS los controllers
- [ ] Actualizar TODOS los services
- [ ] Probar TODO el sistema

### **4. Cambiar puerto:**
- [ ] Backend: Actualizar en `.env` y CORS
- [ ] Frontend: Actualizar en `vite.config.ts`
- [ ] Actualizar documentación

### **5. Cambiar validación:**
- [ ] Actualizar backend controller
- [ ] Actualizar frontend component
- [ ] Verificar que mensajes de error coinciden

---

## 🎯 RESUMEN: LO MÁS IMPORTANTE

### **Estas 3 cosas SIEMPRE deben coincidir:**

1. **URLs de endpoints** (rutas)
2. **Nombres de campos** en JSON
3. **Validaciones** (mismas reglas en ambos lados)

### **Si cambias una, DEBES cambiar la otra:**

```
Backend cambia ruta:     /api/users → /api/usuarios
Frontend DEBE cambiar:   API_URL = '.../users' → API_URL = '.../usuarios'

Backend cambia campo:    user_id → userId
Frontend DEBE cambiar:   user_id → userId

Backend valida:          password >= 10 chars
Frontend DEBE validar:   password >= 10 chars
```

---

**Versión:** 1.0  
**Fecha:** Enero 2025
