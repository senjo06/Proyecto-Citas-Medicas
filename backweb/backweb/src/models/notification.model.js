// backend/src/models/notification.model.js
const pool = require('../config/db');

const NotificationModel = {
  // Crea una nueva notificación cuando un usuario cambia sus datos
  async create({ userId, userName, message }) {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, user_name, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, userName, message]
    );
    return rows[0];
  },

  // Obtiene todas las notificaciones (más recientes primero)
  async getAll() {
    const { rows } = await pool.query(
      `SELECT * FROM notifications ORDER BY created_at DESC`
    );
    return rows;
  },

  // Cuenta las no leídas (para el badge)
  async countUnread() {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE is_read = false`
    );
    return parseInt(rows[0].count, 10);
  },

  // Marca una notificación como leída
  async markRead(id) {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1`,
      [id]
    );
  },

  // Marca todas como leídas
  async markAllRead() {
    await pool.query(`UPDATE notifications SET is_read = true WHERE is_read = false`);
  }
};

module.exports = NotificationModel;
