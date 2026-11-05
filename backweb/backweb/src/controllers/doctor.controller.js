// backend/src/controllers/doctor.controller.js
const DoctorModel = require('../models/doctor.model');

const DoctorController = {
  async getAll(req, res) {
    try {
      const doctors = await DoctorModel.findAll();
      res.json({ success: true, data: doctors });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const doctor = await DoctorModel.findById(req.params.id);
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor no encontrado.' });
      res.json({ success: true, data: doctor });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req, res) {
    const { name, specialty } = req.body;
    if (!name || !specialty) {
      return res.status(400).json({ success: false, error: 'Nombre y especialidad requeridos.' });
    }
    try {
      const doctor = await DoctorModel.create({ name, specialty });
      res.status(201).json({ success: true, data: doctor });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async update(req, res) {
    const { name, specialty } = req.body;
    if (!name || !specialty) {
      return res.status(400).json({ success: false, error: 'Nombre y especialidad requeridos.' });
    }
    try {
      const doctor = await DoctorModel.update(req.params.id, { name, specialty });
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor no encontrado.' });
      res.json({ success: true, data: doctor });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const doctor = await DoctorModel.delete(req.params.id);
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor no encontrado.' });
      res.json({ success: true, message: 'Doctor eliminado.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = DoctorController;
