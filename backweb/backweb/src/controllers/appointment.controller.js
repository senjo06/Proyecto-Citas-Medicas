// backend/src/controllers/appointment.controller.js
const AppointmentModel = require('../models/appointment.model');

const AppointmentController = {
  // GET /api/appointments/available
  // Devuelve todos los turnos que aún no han sido reservados
  async getAvailable(req, res) {
    try {
      const slots = await AppointmentModel.getAvailableSlots();
      res.json({ success: true, data: slots });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
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
      // Error de concurrencia: el turno ya fue tomado por otro paciente
      res.status(409).json({ success: false, error: err.message });
    }
  }
};

module.exports = AppointmentController;
