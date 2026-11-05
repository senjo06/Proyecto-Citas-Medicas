// backend/src/controllers/doctor-schedule.controller.js
const DoctorSchedule = require('../models/doctor-schedule.model');

// Mapeo de nombres de días
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await DoctorSchedule.findAll();
    
    // Agregar nombre del día
    const schedulesWithDayName = schedules.map(s => ({
      ...s,
      day_name: DAY_NAMES[s.day_of_week]
    }));
    
    res.json(schedulesWithDayName);
  } catch (err) {
    console.error('❌ Error obteniendo horarios:', err.message);
    res.status(500).json({ error: 'Error al obtener los horarios' });
  }
};

exports.getSchedulesByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const schedules = await DoctorSchedule.findByDoctorId(doctorId);
    
    // Agregar nombre del día
    const schedulesWithDayName = schedules.map(s => ({
      ...s,
      day_name: DAY_NAMES[s.day_of_week]
    }));
    
    res.json(schedulesWithDayName);
  } catch (err) {
    console.error('❌ Error obteniendo horarios del doctor:', err.message);
    res.status(500).json({ error: 'Error al obtener los horarios del doctor' });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Fecha inválida. Formato esperado: YYYY-MM-DD' });
    }
    
    const slots = await DoctorSchedule.generateTimeSlots(doctorId, date);
    
    res.json({ 
      doctor_id: doctorId, 
      date, 
      day_of_week: new Date(date).getDay(),
      day_name: DAY_NAMES[new Date(date).getDay()],
      slots 
    });
  } catch (err) {
    console.error('❌ Error generando slots:', err.message);
    res.status(500).json({ error: 'Error al generar horarios disponibles' });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { doctor_id, day_of_week, start_time, end_time, duration_minutes } = req.body;
    
    // Validaciones
    if (!doctor_id || day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    if (day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({ error: 'day_of_week debe estar entre 0 (Domingo) y 6 (Sábado)' });
    }
    
    const schedule = await DoctorSchedule.create({
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      duration_minutes: duration_minutes || 30
    });
    
    res.status(201).json({
      ...schedule,
      day_name: DAY_NAMES[schedule.day_of_week]
    });
  } catch (err) {
    console.error('❌ Error creando horario:', err.message);
    res.status(500).json({ error: 'Error al crear el horario' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time, duration_minutes, is_active } = req.body;
    
    if (day_of_week !== undefined && (day_of_week < 0 || day_of_week > 6)) {
      return res.status(400).json({ error: 'day_of_week debe estar entre 0 y 6' });
    }
    
    const schedule = await DoctorSchedule.update(id, {
      day_of_week,
      start_time,
      end_time,
      duration_minutes,
      is_active
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    res.json({
      ...schedule,
      day_name: DAY_NAMES[schedule.day_of_week]
    });
  } catch (err) {
    console.error('❌ Error actualizando horario:', err.message);
    res.status(500).json({ error: 'Error al actualizar el horario' });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await DoctorSchedule.delete(id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    res.json({ message: 'Horario eliminado correctamente', schedule });
  } catch (err) {
    console.error('❌ Error eliminando horario:', err.message);
    res.status(500).json({ error: 'Error al eliminar el horario' });
  }
};
