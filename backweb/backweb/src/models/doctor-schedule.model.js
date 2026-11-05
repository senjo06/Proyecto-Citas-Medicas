// backend/src/models/doctor-schedule.model.js
const pool = require('../config/db');

class DoctorSchedule {
  
  // Obtener todos los horarios de un doctor
  static async findByDoctorId(doctorId) {
    const query = `
      SELECT 
        ds.id,
        ds.doctor_id,
        d.name as doctor_name,
        d.specialty,
        ds.day_of_week,
        ds.start_time,
        ds.end_time,
        ds.duration_minutes,
        ds.is_active
      FROM doctor_schedules ds
      JOIN doctors d ON ds.doctor_id = d.id
      WHERE ds.doctor_id = $1
      ORDER BY ds.day_of_week, ds.start_time
    `;
    const { rows } = await pool.query(query, [doctorId]);
    return rows;
  }

  // Obtener horarios activos de un doctor para un día específico
  static async findByDoctorAndDay(doctorId, dayOfWeek) {
    const query = `
      SELECT 
        id,
        doctor_id,
        day_of_week,
        start_time,
        end_time,
        duration_minutes
      FROM doctor_schedules
      WHERE doctor_id = $1 
        AND day_of_week = $2 
        AND is_active = true
      ORDER BY start_time
    `;
    const { rows } = await pool.query(query, [doctorId, dayOfWeek]);
    return rows;
  }

  // Crear un nuevo horario para un doctor
  static async create(scheduleData) {
    const { doctor_id, day_of_week, start_time, end_time, duration_minutes = 30 } = scheduleData;
    
    const query = `
      INSERT INTO doctor_schedules 
        (doctor_id, day_of_week, start_time, end_time, duration_minutes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      duration_minutes
    ]);
    
    return rows[0];
  }

  // Actualizar un horario
  static async update(id, scheduleData) {
    const { day_of_week, start_time, end_time, duration_minutes, is_active } = scheduleData;
    
    const query = `
      UPDATE doctor_schedules
      SET 
        day_of_week = COALESCE($1, day_of_week),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        duration_minutes = COALESCE($4, duration_minutes),
        is_active = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [
      day_of_week,
      start_time,
      end_time,
      duration_minutes,
      is_active,
      id
    ]);
    
    return rows[0];
  }

  // Eliminar un horario
  static async delete(id) {
    const query = 'DELETE FROM doctor_schedules WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Generar slots de tiempo disponibles para un doctor en un día específico
  static async generateTimeSlots(doctorId, date) {
    const dayOfWeek = new Date(date).getDay(); // 0=Domingo, 1=Lunes, etc.
    
    const schedules = await this.findByDoctorAndDay(doctorId, dayOfWeek);
    
    if (schedules.length === 0) {
      return [];
    }

    const slots = [];
    
    for (const schedule of schedules) {
      const { start_time, end_time, duration_minutes } = schedule;
      
      // Convertir tiempos a minutos desde medianoche
      const [startHour, startMin] = start_time.split(':').map(Number);
      const [endHour, endMin] = end_time.split(':').map(Number);
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      while (currentMinutes + duration_minutes <= endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        
        slots.push(timeString);
        currentMinutes += duration_minutes;
      }
    }
    
    return slots;
  }

  // Obtener todos los horarios (para admin)
  static async findAll() {
    const query = `
      SELECT 
        ds.id,
        ds.doctor_id,
        d.name as doctor_name,
        d.specialty,
        ds.day_of_week,
        ds.start_time,
        ds.end_time,
        ds.duration_minutes,
        ds.is_active,
        ds.created_at
      FROM doctor_schedules ds
      JOIN doctors d ON ds.doctor_id = d.id
      ORDER BY d.name, ds.day_of_week, ds.start_time
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}

module.exports = DoctorSchedule;
