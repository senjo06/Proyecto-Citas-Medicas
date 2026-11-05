// backend/src/routes/doctor-schedule.routes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/doctor-schedule.controller');

/**
 * @swagger
 * /api/doctor-schedules:
 *   get:
 *     summary: Obtener todos los horarios de doctores
 *     tags: [Doctor Schedules]
 *     responses:
 *       200:
 *         description: Lista de horarios
 */
router.get('/', scheduleController.getAllSchedules);

/**
 * @swagger
 * /api/doctor-schedules/doctor/{doctorId}:
 *   get:
 *     summary: Obtener horarios de un doctor específico
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horarios del doctor
 */
router.get('/doctor/:doctorId', scheduleController.getSchedulesByDoctor);

/**
 * @swagger
 * /api/doctor-schedules/doctor/{doctorId}/slots/{date}:
 *   get:
 *     summary: Obtener slots de tiempo disponibles para un doctor en una fecha
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-10-15
 *     responses:
 *       200:
 *         description: Slots de tiempo disponibles
 */
router.get('/doctor/:doctorId/slots/:date', scheduleController.getAvailableSlots);

/**
 * @swagger
 * /api/doctor-schedules:
 *   post:
 *     summary: Crear un nuevo horario para un doctor
 *     tags: [Doctor Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - day_of_week
 *               - start_time
 *               - end_time
 *             properties:
 *               doctor_id:
 *                 type: integer
 *               day_of_week:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *                 description: 0=Domingo, 1=Lunes, ..., 6=Sábado
 *               start_time:
 *                 type: string
 *                 format: time
 *                 example: "08:00:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 example: "12:00:00"
 *               duration_minutes:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       201:
 *         description: Horario creado exitosamente
 */
router.post('/', scheduleController.createSchedule);

/**
 * @swagger
 * /api/doctor-schedules/{id}:
 *   put:
 *     summary: Actualizar un horario
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day_of_week:
 *                 type: integer
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               duration_minutes:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Horario actualizado
 */
router.put('/:id', scheduleController.updateSchedule);

/**
 * @swagger
 * /api/doctor-schedules/{id}:
 *   delete:
 *     summary: Eliminar un horario
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario eliminado
 */
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
