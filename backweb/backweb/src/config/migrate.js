// backend/src/config/migrate.js
const pool = require('./db');

async function runMigrations() {
  console.log('⏳ Iniciando migración de la base de datos...');

  const sql = `
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

    -- ── Datos semilla ────────────────────────────────────────────────
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
