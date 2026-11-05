# Guía de Uso de la Base de Datos PostgreSQL

## 📋 Tabla de Contenidos
1. [Conexión a la Base de Datos](#1-conexión-a-la-base-de-datos)
2. [Consultas Básicas](#2-consultas-básicas)
3. [Gestión de Datos](#3-gestión-de-datos)
4. [Respaldos y Restauración](#4-respaldos-y-restauración)
5. [Mantenimiento](#5-mantenimiento)
6. [Comandos Útiles](#6-comandos-útiles)

---

## 1. Conexión a la Base de Datos

### 1.1. Información de Conexión

```
Base de datos: citas_db
Usuario:       postgres
Contraseña:    1234
Host:          localhost
Puerto:        5432
```

### 1.2. Conectar desde pgAdmin

1. Abre **pgAdmin 4**
2. Click derecho en "Servers" → "Register" → "Server"
3. En la pestaña "General":
   - **Name:** Sistema de Citas Médicas
4. En la pestaña "Connection":
   - **Host name/address:** localhost
   - **Port:** 5432
   - **Maintenance database:** postgres
   - **Username:** postgres
   - **Password:** 1234
   - ☑️ Save password
5. Click "Save"
6. En el árbol: Servers → Sistema de Citas Médicas → Databases → `citas_db`

### 1.3. Conectar desde Línea de Comandos (psql)

```bash
# Windows (cmd o PowerShell)
psql -U postgres -d citas_db

# Ingresar contraseña cuando se solicite: 1234
```

---

## 2. Consultas Básicas

### 2.1. Ver Todas las Tablas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 2.2. Ver Estructura de una Tabla

```sql
-- Descripción de la tabla users
\d users

-- O usando SQL estándar
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
```

### 2.3. Consultar Usuarios

```sql
-- Todos los usuarios
SELECT id, name, email, phone, created_at 
FROM users 
ORDER BY created_at DESC;

-- Buscar usuario por email
SELECT * FROM users WHERE email = 'juan@correo.com';

-- Contar usuarios
SELECT COUNT(*) as total_usuarios FROM users;
```

### 2.4. Consultar Citas

```sql
-- Todas las citas reservadas
SELECT 
  a.id,
  a.doctor_name,
  a.specialty,
  a.appointment_date,
  a.appointment_time,
  u.name as patient_name,
  u.email as patient_email
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE a.is_booked = true
ORDER BY a.appointment_date, a.appointment_time;

-- Citas de un doctor específico
SELECT * FROM appointments 
WHERE doctor_name = 'Dr. Camilo Namén'
  AND is_booked = true
ORDER BY appointment_date, appointment_time;

-- Citas disponibles (libres)
SELECT COUNT(*) as turnos_disponibles 
FROM appointments 
WHERE is_booked = false;
```

### 2.5. Consultar Doctores y sus Horarios

```sql
-- Todos los doctores
SELECT * FROM doctors ORDER BY name;

-- Horarios de un doctor específico
SELECT 
  d.name,
  d.specialty,
  ds.day_of_week,
  ds.start_time,
  ds.end_time,
  ds.duration_minutes,
  ds.is_active
FROM doctors d
JOIN doctor_schedules ds ON d.id = ds.doctor_id
WHERE d.id = 1
ORDER BY ds.day_of_week, ds.start_time;

-- Días de la semana: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
```

### 2.6. Consultar Notificaciones

```sql
-- Notificaciones no leídas
SELECT * FROM notifications 
WHERE is_read = false 
ORDER BY created_at DESC;

-- Notificaciones de un usuario
SELECT * FROM notifications 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

---

## 3. Gestión de Datos

### 3.1. Insertar Datos

#### Crear un Usuario

```sql
INSERT INTO users (name, email, password, phone)
VALUES (
  'Juan Pérez',
  'juan@correo.com',
  '$2a$08$hashedpassword...', -- Hash bcrypt (generar desde la app)
  '3001234567'
);
```

⚠️ **Nota:** No insertes contraseñas en texto plano. Usa la interfaz web para crear usuarios.

#### Crear un Doctor

```sql
INSERT INTO doctors (name, specialty)
VALUES ('Dra. Ana López', 'Cardiología');
```

#### Agregar Horario a un Doctor

```sql
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, duration_minutes)
VALUES 
  (1, 1, '08:00:00', '12:00:00', 30),  -- Lunes
  (1, 3, '08:00:00', '12:00:00', 30),  -- Miércoles
  (1, 5, '08:00:00', '12:00:00', 30);  -- Viernes
```

### 3.2. Actualizar Datos

```sql
-- Actualizar teléfono de usuario
UPDATE users 
SET phone = '3009876543'
WHERE id = 1;

-- Cambiar especialidad de doctor
UPDATE doctors
SET specialty = 'Medicina Interna'
WHERE id = 1;

-- Desactivar horario de doctor
UPDATE doctor_schedules
SET is_active = false
WHERE id = 5;
```

### 3.3. Eliminar Datos

```sql
-- Eliminar un usuario (⚠️ también elimina sus citas)
DELETE FROM users WHERE id = 1;

-- Cancelar una cita específica
UPDATE appointments
SET is_booked = false, user_id = NULL, booked_at = NULL
WHERE id = 123;

-- Eliminar horario de doctor
DELETE FROM doctor_schedules WHERE id = 10;
```

---

## 4. Respaldos y Restauración

### 4.1. Crear Respaldo Completo

```bash
# Backup completo de la base de datos
pg_dump -U postgres -d citas_db -F c -f backup_citas_$(date +%Y%m%d).backup

# Backup en formato SQL legible
pg_dump -U postgres -d citas_db -f backup_citas_$(date +%Y%m%d).sql
```

### 4.2. Crear Respaldo de Solo Datos

```bash
# Solo los datos, sin esquema
pg_dump -U postgres -d citas_db --data-only -f datos_citas_$(date +%Y%m%d).sql
```

### 4.3. Restaurar desde Respaldo

```bash
# Restaurar desde archivo .backup
pg_restore -U postgres -d citas_db -c backup_citas_20250108.backup

# Restaurar desde archivo .sql
psql -U postgres -d citas_db -f backup_citas_20250108.sql
```

### 4.4. Respaldo Automático (Recomendado)

Crea un script para respaldos automáticos:

**Windows (backup.bat):**
```bat
@echo off
set PGPASSWORD=1234
set FECHA=%date:~-4%%date:~3,2%%date:~0,2%
"C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U postgres -d citas_db -F c -f "C:\Backups\citas_%FECHA%.backup"
echo Backup completado: citas_%FECHA%.backup
```

Programa este script con el Programador de Tareas de Windows para que se ejecute diariamente.

---

## 5. Mantenimiento

### 5.1. Ver Tamaño de la Base de Datos

```sql
-- Tamaño total de la BD
SELECT pg_size_pretty(pg_database_size('citas_db')) as tamaño;

-- Tamaño por tabla
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 5.2. Limpiar Datos Antiguos

```sql
-- Eliminar citas antiguas no reservadas (más de 30 días)
DELETE FROM appointments 
WHERE is_booked = false 
  AND appointment_date < CURRENT_DATE - INTERVAL '30 days';

-- Marcar notificaciones antiguas como leídas (más de 60 días)
UPDATE notifications
SET is_read = true
WHERE created_at < CURRENT_DATE - INTERVAL '60 days';
```

### 5.3. Optimizar Base de Datos

```sql
-- Analizar y optimizar todas las tablas
VACUUM ANALYZE;

-- Vacuum completo (requiere más tiempo)
VACUUM FULL ANALYZE;

-- Reindexar todas las tablas
REINDEX DATABASE citas_db;
```

### 5.4. Ver Actividad de la Base de Datos

```sql
-- Conexiones activas
SELECT * FROM pg_stat_activity 
WHERE datname = 'citas_db';

-- Consultas lentas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

---

## 6. Comandos Útiles

### 6.1. Resetear Secuencias (IDs)

```sql
-- Si necesitas reiniciar los IDs de una tabla
SELECT setval('users_id_seq', 1, false);
SELECT setval('appointments_id_seq', 1, false);
SELECT setval('doctors_id_seq', 1, false);
```

### 6.2. Ver Índices

```sql
-- Ver todos los índices de una tabla
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'appointments';
```

### 6.3. Estadísticas de Uso

```sql
-- Citas por doctor
SELECT 
  doctor_name,
  COUNT(*) as total_citas,
  SUM(CASE WHEN is_booked THEN 1 ELSE 0 END) as reservadas,
  SUM(CASE WHEN NOT is_booked THEN 1 ELSE 0 END) as disponibles
FROM appointments
GROUP BY doctor_name
ORDER BY total_citas DESC;

-- Usuarios más activos
SELECT 
  u.name,
  u.email,
  COUNT(a.id) as total_citas
FROM users u
LEFT JOIN appointments a ON u.id = a.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_citas DESC;
```

### 6.4. Exportar Datos a CSV

```sql
-- Exportar usuarios a CSV
COPY (SELECT id, name, email, phone, created_at FROM users)
TO 'C:/temp/usuarios.csv' 
WITH CSV HEADER;

-- Exportar citas reservadas
COPY (
  SELECT 
    a.id,
    a.doctor_name,
    a.specialty,
    a.appointment_date,
    a.appointment_time,
    u.name as patient_name,
    u.email as patient_email
  FROM appointments a
  JOIN users u ON a.user_id = u.id
  WHERE a.is_booked = true
)
TO 'C:/temp/citas_reservadas.csv'
WITH CSV HEADER;
```

---

## 7. Reiniciar la Base de Datos

Si necesitas empezar desde cero:

```sql
-- 1. Eliminar todas las tablas
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctor_schedules CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Reiniciar el backend para ejecutar las migraciones
-- El archivo backweb/backweb/src/config/migrate.js recreará todas las tablas
```

O simplemente reinicia el servidor Node.js y automáticamente ejecutará las migraciones.

---

## 8. Resolución de Problemas

### 8.1. No puedo conectarme a la base de datos

```bash
# Verificar que PostgreSQL esté corriendo
# Windows: Buscar "Services" → PostgreSQL Database Server

# Verificar configuración
psql -U postgres -l
```

### 8.2. Error "relation does not exist"

Significa que las tablas no se han creado. Reinicia el backend:

```bash
cd backweb/backweb
npm run dev
```

### 8.3. Olvidé la contraseña de postgres

Necesitarás reinstalar PostgreSQL o modificar `pg_hba.conf` para permitir conexión sin contraseña temporalmente.

---

## 9. Mejores Prácticas

✅ **Haz respaldos regulares** (diarios o semanales)
✅ **No almacenes contraseñas en texto plano**
✅ **Limpia datos antiguos periódicamente**
✅ **Monitorea el tamaño de la BD**
✅ **Usa transacciones para operaciones críticas**
✅ **Documenta cualquier cambio manual en la BD**
✅ **Prueba los respaldos regularmente**

---

**Última actualización:** Enero 2025  
**Versión:** 1.0
