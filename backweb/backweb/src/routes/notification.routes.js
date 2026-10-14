// backend/src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const NotificationModel = require('../models/notification.model');

// GET /api/notifications — todas las notificaciones
router.get('/', async (req, res) => {
  try {
    const notifications = await NotificationModel.getAll();
    const unread = await NotificationModel.countUnread();
    res.json({ success: true, data: notifications, unread });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications — crear notificación (lo llama el frontend al guardar perfil)
router.post('/', async (req, res) => {
  const { userId, userName, message } = req.body;
  if (!userId || !userName || !message) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos.' });
  }
  try {
    const notification = await NotificationModel.create({ userId, userName, message });
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/read-all — marca todas como leídas
router.patch('/read-all', async (req, res) => {
  try {
    await NotificationModel.markAllRead();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read — marca una como leída
router.patch('/:id/read', async (req, res) => {
  try {
    await NotificationModel.markRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
