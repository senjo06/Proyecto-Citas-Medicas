// backend/src/routes/appointment.routes.js
const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointment.controller');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gestión de turnos médicos con bloqueo pesimista
 */

/**
 * @swagger
 * /api/appointments/available:
 *   get:
 *     summary: Obtener turnos médicos disponibles
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Lista de turnos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       doctor_name:
 *                         type: string
 *                       specialty:
 *                         type: string
 *                       appointment_date:
 *                         type: string
 *                       appointment_time:
 *                         type: string
 */
router.get('/available', AppointmentController.getAvailable);
router.get('/doctor',   AppointmentController.getByDoctor);
router.get('/today',    AppointmentController.getToday);
router.get('/my',       AppointmentController.getMyAppointments);
router.get('/history',  AppointmentController.getHistory);
router.get('/reminder', AppointmentController.getReminder);

/**
 * @swagger
 * /api/appointments/booked:
 *   get:
 *     summary: Obtener turnos ya reservados con datos del paciente
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Lista de turnos reservados
 */
router.get('/booked', AppointmentController.getBooked);

/**
 * @swagger
 * /api/appointments/book:
 *   post:
 *     summary: Reservar un turno médico (SELECT FOR UPDATE)
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *               - userId
 *             properties:
 *               appointmentId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Turno reservado exitosamente
 *       400:
 *         description: Datos faltantes
 *       409:
 *         description: Turno ya reservado por otro paciente (condición de carrera)
 */
router.post('/book', AppointmentController.book);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   delete:
 *     summary: Cancelar una reserva — libera el turno nuevamente
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Turno cancelado exitosamente
 *       409:
 *         description: El turno no existe o no estaba reservado
 */
router.delete('/:id/cancel', AppointmentController.cancel);

module.exports = router;
