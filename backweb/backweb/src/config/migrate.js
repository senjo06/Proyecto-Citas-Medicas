// backend/src/config/migrate.js
const pool = require('./db');

async function runMigrations() {
  console.log('⏳ Iniciando migración de la base de datos...');

  const sql = `
    -- ── Tabla de doctores ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS doctors (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(150) NOT NULL,
        specialty  VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ── Tabla de horarios de doctores ────────────────────────────────
    CREATE TABLE IF NOT EXISTS doctor_schedules (
        id              SERIAL PRIMARY KEY,
        doctor_id       INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time      TIME NOT NULL,
        end_time        TIME NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 30,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT chk_valid_time CHECK (end_time > start_time)
    );

    -- ── Tabla de usuarios ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(150) NOT NULL,
        email      VARCHAR(150) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        phone      VARCHAR(20)  DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ── Tabla de turnos médicos ──────────────────────────────────────
    CREATE TABLE IF NOT EXISTS appointments (
        id               SERIAL PRIMARY KEY,
        doctor_name      VARCHAR(150) NOT NULL,
        specialty        VARCHAR(100) NOT NULL,
        appointment_date DATE         NOT NULL,
        appointment_time TIME         NOT NULL,
        is_booked        BOOLEAN      NOT NULL DEFAULT FALSE,
        user_id          INT          DEFAULT NULL,
        booked_at        TIMESTAMP WITH TIME ZONE DEFAULT NULL
    );

    -- ── Tabla de notificaciones ──────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INT          NOT NULL,
        user_name  VARCHAR(150) NOT NULL,
        message    TEXT         NOT NULL,
        is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ── Columna phone si no existe ───────────────────────────────────
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;

    -- ── Índices para acelerar consultas frecuentes ───────────────────
    CREATE INDEX IF NOT EXISTS idx_appt_available
      ON appointments (appointment_date, is_booked)
      WHERE is_booked = false;

    CREATE INDEX IF NOT EXISTS idx_appt_user
      ON appointments (user_id, appointment_date)
      WHERE is_booked = true;

    CREATE INDEX IF NOT EXISTS idx_appt_today
      ON appointments (appointment_date, doctor_name);

    CREATE INDEX IF NOT EXISTS idx_appt_booked
      ON appointments (is_booked, booked_at DESC)
      WHERE is_booked = true;

    CREATE INDEX IF NOT EXISTS idx_users_email
      ON users (LOWER(email));

    CREATE INDEX IF NOT EXISTS idx_users_name
      ON users (LOWER(name));

    CREATE INDEX IF NOT EXISTS idx_notif_unread
      ON notifications (is_read, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_doctor_schedules
      ON doctor_schedules (doctor_id, day_of_week, is_active)
      WHERE is_active = true;

    -- ── Datos semilla ────────────────────────────────────────────────
    -- Doctores de ejemplo
    INSERT INTO doctors (id, name, specialty) VALUES
      (1, 'Dr. Camilo Namén', 'Medicina General'),
      (2, 'Dra. María Ortega', 'Pediatría'),
      (3, 'Dr. Johan Sebastián', 'Cardiología'),
      (4, 'Dra. Laura Gómez', 'Dermatología'),
      (5, 'Dr. Andrés Martínez', 'Traumatología'),
      (6, 'Dra. Sofía Herrera', 'Ginecología'),
      (7, 'Dr. Felipe Ruiz', 'Neurología'),
      (8, 'Dra. Claudia Vargas', 'Endocrinología'),
      (9, 'Dra. Valentina Torres', 'Oftalmología'),
      (10, 'Dr. Ricardo Salazar', 'Psiquiatría')
    ON CONFLICT (id) DO NOTHING;

    -- Horarios de ejemplo (0=Domingo, 1=Lunes, ..., 6=Sábado)
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, duration_minutes) VALUES
      -- Dr. Camilo Namén: Lunes a Viernes 8:00-12:00
      (1, 1, '08:00:00', '12:00:00', 30),
      (1, 2, '08:00:00', '12:00:00', 30),
      (1, 3, '08:00:00', '12:00:00', 30),
      (1, 4, '08:00:00', '12:00:00', 30),
      (1, 5, '08:00:00', '12:00:00', 30),
      -- Dra. María Ortega: Lunes, Miércoles, Viernes 9:00-13:00
      (2, 1, '09:00:00', '13:00:00', 30),
      (2, 3, '09:00:00', '13:00:00', 30),
      (2, 5, '09:00:00', '13:00:00', 30),
      -- Dr. Johan Sebastián: Martes y Jueves 14:00-18:00
      (3, 2, '14:00:00', '18:00:00', 30),
      (3, 4, '14:00:00', '18:00:00', 30),
      -- Dra. Laura Gómez: Lunes a Viernes 10:00-14:00
      (4, 1, '10:00:00', '14:00:00', 30),
      (4, 2, '10:00:00', '14:00:00', 30),
      (4, 3, '10:00:00', '14:00:00', 30),
      (4, 4, '10:00:00', '14:00:00', 30),
      (4, 5, '10:00:00', '14:00:00', 30),
      -- Dr. Andrés Martínez: Lunes, Miércoles, Viernes 11:00-15:00
      (5, 1, '11:00:00', '15:00:00', 30),
      (5, 3, '11:00:00', '15:00:00', 30),
      (5, 5, '11:00:00', '15:00:00', 30),
      -- Dra. Sofía Herrera: Martes y Jueves 8:30-12:30
      (6, 2, '08:30:00', '12:30:00', 30),
      (6, 4, '08:30:00', '12:30:00', 30),
      -- Dr. Felipe Ruiz: Lunes a Viernes 9:00-13:00
      (7, 1, '09:00:00', '13:00:00', 30),
      (7, 2, '09:00:00', '13:00:00', 30),
      (7, 3, '09:00:00', '13:00:00', 30),
      (7, 4, '09:00:00', '13:00:00', 30),
      (7, 5, '09:00:00', '13:00:00', 30),
      -- Dra. Claudia Vargas: Lunes, Miércoles, Viernes 7:00-11:00
      (8, 1, '07:00:00', '11:00:00', 30),
      (8, 3, '07:00:00', '11:00:00', 30),
      (8, 5, '07:00:00', '11:00:00', 30),
      -- Dra. Valentina Torres: Martes y Jueves 13:00-17:00
      (9, 2, '13:00:00', '17:00:00', 30),
      (9, 4, '13:00:00', '17:00:00', 30),
      -- Dr. Ricardo Salazar: Lunes a Viernes 15:00-19:00
      (10, 1, '15:00:00', '19:00:00', 30),
      (10, 2, '15:00:00', '19:00:00', 30),
      (10, 3, '15:00:00', '19:00:00', 30),
      (10, 4, '15:00:00', '19:00:00', 30),
      (10, 5, '15:00:00', '19:00:00', 30)
    ON CONFLICT DO NOTHING;

    INSERT INTO appointments (id, doctor_name, specialty, appointment_date, appointment_time)
    VALUES
      (1,  'Dr. Camilo Namén',      'Medicina General',  '2026-10-15', '08:00:00'),
      (2,  'Dra. María Ortega',     'Pediatría',         '2026-10-15', '09:30:00'),
      (3,  'Dr. Johan Sebastián',   'Cardiología',       '2026-10-16', '14:00:00'),
      (4,  'Dra. Laura Gómez',      'Dermatología',      '2026-10-16', '10:00:00'),
      (5,  'Dr. Andrés Martínez',   'Traumatología',     '2026-10-17', '11:00:00'),
      (6,  'Dra. Sofía Herrera',    'Ginecología',       '2026-10-17', '08:30:00'),
      (7,  'Dr. Felipe Ruiz',       'Neurología',        '2026-10-18', '09:00:00')
    ON CONFLICT (id) DO NOTHING;
  `;

  try {
    await pool.query(sql);
    console.log('✅ Migración completada. Tablas de usuarios y citas listas.');
  } catch (err) {
    console.error('❌ Error en la migración:', err.message);
    throw err;
  }
}

module.exports = runMigrations;
