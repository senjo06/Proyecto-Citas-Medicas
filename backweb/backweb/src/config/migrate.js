// backend/src/config/migrate.js
// Ejecuta las migraciones al arrancar el servidor.
// Usa CREATE TABLE IF NOT EXISTS para que sea idempotente (seguro de correr múltiples veces).
const pool = require('./db');

async function runMigrations() {
  console.log('⏳ Iniciando migración de la base de datos...');

  const sql = `
    -- ── Tabla de usuarios ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(150) NOT NULL,
        email      VARCHAR(150) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,          -- almacenado con bcrypt (hash)
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
        user_id          INT          DEFAULT NULL,   -- FK lógica al usuario que reservó
        booked_at        TIMESTAMP WITH TIME ZONE DEFAULT NULL
    );

    -- ── Datos semilla: turnos de prueba ──────────────────────────────
    -- ON CONFLICT (id) DO NOTHING garantiza que no se dupliquen al reiniciar
    INSERT INTO appointments (id, doctor_name, specialty, appointment_date, appointment_time)
    VALUES
      (1,  'Dr. Camilo Namén',      'Medicina General',  '2026-10-15', '08:00:00'),
      (2,  'Dra. María Ortega',     'Pediatría',         '2026-10-15', '09:30:00'),
      (3,  'Dr. Johan Sebastián',   'Cardiología',       '2026-10-16', '14:00:00'),
      (4,  'Dra. Laura Gómez',      'Dermatología',      '2026-10-16', '10:00:00'),
      (5,  'Dr. Andrés Martínez',   'Traumatología',     '2026-10-17', '11:00:00'),
      (6,  'Dra. Sofía Herrera',    'Ginecología',       '2026-10-17', '08:30:00'),
      (7,  'Dr. Felipe Ruiz',       'Neurología',        '2026-10-18', '09:00:00'),
      (8,  'Dra. Valentina Cruz',   'Oftalmología',      '2026-10-18', '15:00:00'),
      (9,  'Dr. Ricardo Morales',   'Psiquiatría',       '2026-10-19', '10:30:00'),
      (10, 'Dra. Claudia Vargas',   'Endocrinología',    '2026-10-19', '13:00:00')
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
