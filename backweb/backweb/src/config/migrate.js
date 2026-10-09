// backend/backweb/src/config/migrate.js
const pool = require('./db');

async function runMigrations() {
  console.log('Iniciando la migración de la base de datos...');
  
  // Ponemos todo nuestro código SQL dentro de un String de JavaScript
  const sql = `
    CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        doctor_name VARCHAR(150) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        user_id INT DEFAULT NULL,
        booked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
    );

    -- Insertamos los turnos médicos de prueba si no existen
    INSERT INTO appointments (id, doctor_name, specialty, appointment_date, appointment_time)
    VALUES 
    (1, 'Dr. Camilo Namén', 'Medicina General', '2026-10-15', '08:00:00'),
    (2, 'Dra. María Ortega', 'Pediatría', '2026-10-15', '09:30:00'),
    (3, 'Dr. Johan Sebastián', 'Cardiología', '2026-10-16', '14:00:00')
    ON CONFLICT (id) DO NOTHING;
  `;

  try {
    // El pool de pg ejecuta los comandos SQL directamente en Postgres
    await pool.query(sql);
    console.log('¡Migración completada con éxito! Tablas de citas creadas.');
  } catch (err) {
    console.error('Error al ejecutar la migración de citas:', err.message);
    throw err;
  }
}

module.exports = runMigrations;
