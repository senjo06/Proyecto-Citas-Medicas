// backend/backweb/src/models/appointment.model.js
const pool = require('../config/db');

const Appointment = {
  // 1. Obtener los turnos médicos que estén disponibles
  // 1. Obtener solo la lista de doctores únicos (liviano)
  async getAvailableSlots() {
    const query = `
      SELECT id, doctor_name, specialty, appointment_date, appointment_time 
      FROM appointments 
      WHERE is_booked = false
        AND (
          appointment_date > CURRENT_DATE
          OR (
            appointment_date = CURRENT_DATE
            AND appointment_time > (NOW() AT TIME ZONE 'America/Bogota')::time
          )
        )
        AND appointment_date <= CURRENT_DATE + INTERVAL '14 days'
      ORDER BY appointment_date ASC, appointment_time ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // 1b. Solo los slots de un doctor específico
  async getSlotsByDoctor(doctorName) {
    const query = `
      SELECT id, doctor_name, specialty, appointment_date, appointment_time 
      FROM appointments 
      WHERE is_booked = false
        AND doctor_name = $1
        AND (
          appointment_date > CURRENT_DATE
          OR (
            appointment_date = CURRENT_DATE
            AND appointment_time > (NOW() AT TIME ZONE 'America/Bogota')::time
          )
        )
        AND appointment_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY appointment_date ASC, appointment_time ASC;
    `;
    const { rows } = await pool.query(query, [doctorName]);
    return rows;
  },

  // 1b. Obtener lista única de doctores (independiente de disponibilidad)
  async getDoctors() {
    const query = `
      SELECT DISTINCT doctor_name, specialty
      FROM appointments
      ORDER BY doctor_name ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // 2. Obtener citas de hoy agrupadas por doctor
  async getTodaySlots() {
    const query = `
      SELECT 
        a.id,
        a.doctor_name,
        a.specialty,
        a.appointment_time,
        a.is_booked,
        u.name  AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.appointment_date = CURRENT_DATE
      ORDER BY a.doctor_name ASC, a.appointment_time ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Historial de citas pasadas de un usuario
  async getHistory(userId) {
    const { rows } = await pool.query(
      `SELECT id, doctor_name, specialty, appointment_date, appointment_time, booked_at
       FROM appointments
       WHERE user_id = $1 AND is_booked = true AND appointment_date < CURRENT_DATE
       ORDER BY appointment_date DESC, appointment_time DESC`,
      [userId]
    );
    return rows;
  },

  // Turnos de mañana del usuario (recordatorio)
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
  },
  async getByUser(userId) {
    const { rows } = await pool.query(
      `SELECT id, doctor_name, specialty, appointment_date, appointment_time, booked_at
       FROM appointments
       WHERE user_id = $1 AND is_booked = true AND appointment_date >= CURRENT_DATE
       ORDER BY appointment_date ASC, appointment_time ASC`,
      [userId]
    );
    return rows;
  },

  // 3. Obtener los turnos que ya fueron reservados (con datos del paciente)
  async getBookedSlots() {
    const query = `
      SELECT 
        a.id,
        a.doctor_name,
        a.specialty,
        a.appointment_date,
        a.appointment_time,
        a.booked_at,
        u.id    AS user_id,
        u.name  AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.is_booked = true
      ORDER BY a.booked_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // 3. Cancelar una reserva — devuelve el turno al pool de disponibles
  async cancelSlot(appointmentId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificamos que el turno exista y esté reservado
      const checkQuery = `
        SELECT is_booked FROM appointments WHERE id = $1 FOR UPDATE;
      `;
      const { rows } = await client.query(checkQuery, [appointmentId]);

      if (rows.length === 0) throw new Error('El turno no existe.');
      if (!rows[0].is_booked) throw new Error('Este turno no está reservado.');

      // Lo liberamos: vuelve a estar disponible
      await client.query(`
        UPDATE appointments
        SET is_booked = false, user_id = NULL, booked_at = NULL
        WHERE id = $1;
      `, [appointmentId]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // 4. EL CORE DEL PROYECTO: Reservar el turno aplicando bloqueo pesimista
  async bookSlot(appointmentId, userId) {
    // Iniciamos una transacción manual obligatoria en Postgres para asegurar el bloqueo
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Serializar reservas del mismo paciente para evitar conflictos simultáneos de horario.
      const userRes = await client.query(
        'SELECT id FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      if (userRes.rows.length === 0) {
        throw new Error('El paciente no existe.');
      }

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

      // Un paciente puede reservar varios turnos en el día, pero no a la misma hora.
      const sameTimeQuery = `
        SELECT existing.id
        FROM appointments AS existing
        JOIN appointments AS requested ON requested.id = $2
        WHERE existing.user_id = $1
          AND existing.appointment_date = requested.appointment_date
          AND existing.appointment_time = requested.appointment_time
          AND existing.is_booked = true;
      `;
      const sameTimeRes = await client.query(sameTimeQuery, [userId, appointmentId]);
      if (sameTimeRes.rows.length > 0) {
        throw new Error('YA_TIENE_TURNO:' + sameTimeRes.rows[0].id);
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
