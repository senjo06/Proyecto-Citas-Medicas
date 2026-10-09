// backend/backweb/src/models/appointment.model.js
const pool = require('../config/db');

const Appointment = {
  // 1. Obtener los turnos médicos que estén disponibles
  async getAvailableSlots() {
    const query = `
      SELECT id, doctor_name, specialty, appointment_date, appointment_time 
      FROM appointments 
      WHERE is_booked = false 
      ORDER BY appointment_date ASC, appointment_time ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // 2. EL CORE DEL PROYECTO: Reservar el turno aplicando bloqueo pesimista
  async bookSlot(appointmentId, userId) {
    // Iniciamos una transacción manual obligatoria en Postgres para asegurar el bloqueo
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // SELECT FOR UPDATE: Bloquea la fila en la base de datos de inmediato.
      // Si otra petición intenta leer este mismo ID al mismo tiempo, tendrá que esperar 
      // a que esta transacción termine (COMMIT), evitando duplicados perfectos.
      const verifyQuery = `
        SELECT is_booked FROM appointments 
        WHERE id = $1 FOR UPDATE;
      `;
      const verifyRes = await client.query(verifyQuery, [appointmentId]);

      if (verifyRes.rows.length === 0) {
        throw new Error('El turno médico solicitado no existe.');
      }

      if (verifyRes.rows[0].is_booked) {
        throw new Error('Lo sentimos, este turno ya fue reservado por otro paciente.');
      }

      // Si sigue libre, lo apartamos de forma atómica
      const bookQuery = `
        UPDATE appointments 
        SET is_booked = true, user_id = $2, booked_at = NOW() 
        WHERE id = $1 
        RETURNING *;
      `;
      const { rows } = await client.query(bookQuery, [appointmentId, userId]);

      await client.query('COMMIT');
      return rows[0];

    } catch (error) {
      await client.query('ROLLBACK'); // Si algo falla, deshacemos todo para no romper los datos
      throw error;
    } finally {
      client.release(); // Liberamos la conexión al pool
    }
  }
};

module.exports = Appointment;
