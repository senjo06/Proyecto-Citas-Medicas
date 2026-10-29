// backend/src/controllers/appointment.controller.js
const AppointmentModel = require('../models/appointment.model');

const AppointmentController = {
  // GET /api/appointments/history?userId=X
  async getHistory(req, res) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'userId requerido.' });
    try {
      const rows = await AppointmentModel.getHistory(userId);
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/appointments/reminder?userId=X
  async getReminder(req, res) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'userId requerido.' });
    try {
      const rows = await AppointmentModel.getReminder(userId);
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/appointments/available
  // Devuelve todos los turnos que aún no han sido reservados
  async getAvailable(req, res) {
    try {
      // Solo devuelve la lista de doctores únicos — los slots se cargan por doctor bajo demanda
      const doctors = await AppointmentModel.getDoctors();
      res.json({ success: true, data: [], doctors });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/appointments/doctor?name=X — slots de un doctor específico
  async getByDoctor(req, res) {
    const { name } = req.query;
    if (!name) return res.status(400).json({ success: false, error: 'name requerido.' });
    try {
      const slots = await AppointmentModel.getSlotsByDoctor(name);
      res.json({ success: true, data: slots });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/appointments/today — citas de hoy agrupadas
  async getToday(req, res) {
    try {
      const slots = await AppointmentModel.getTodaySlots();
      res.json({ success: true, data: slots });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/appointments/my?userId=X — turno activo del usuario (hoy o futuro)
  async getMyAppointments(req, res) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'userId requerido.' });
    try {
      const slots = await AppointmentModel.getByUser(userId);
      res.json({ success: true, data: slots });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/appointments/booked
  // Devuelve todos los turnos ya reservados con datos del paciente
  async getBooked(req, res) {
    try {
      const slots = await AppointmentModel.getBookedSlots();
      res.json({ success: true, data: slots });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // DELETE /api/appointments/:id/cancel
  async cancel(req, res) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });
    try {
      await AppointmentModel.cancelSlot(id);
      res.json({ success: true, message: 'Turno cancelado. Vuelve a estar disponible.' });
    } catch (err) {
      res.status(409).json({ success: false, error: err.message });
    }
  },

  // POST /api/appointments/book
  // Reserva un turno usando SELECT FOR UPDATE para evitar condiciones de carrera
  async book(req, res) {
    const { appointmentId, userId } = req.body;

    if (!appointmentId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'appointmentId y userId son requeridos.'
      });
    }

    try {
      const booked = await AppointmentModel.bookSlot(appointmentId, userId);
      res.status(200).json({
        success: true,
        message: `Turno reservado exitosamente con el Dr. ${booked.doctor_name}.`,
        data: booked
      });
    } catch (err) {
      if (err.message.startsWith('YA_TIENE_TURNO:')) {
        const existingId = err.message.split(':')[1];
        return res.status(409).json({
          success: false,
          error: 'Ya tenés un turno reservado para esa fecha y hora.',
          code: 'YA_TIENE_TURNO',
          existingId: parseInt(existingId)
        });
      }
      res.status(409).json({ success: false, error: err.message });
    }
  }
};

module.exports = AppointmentController;
