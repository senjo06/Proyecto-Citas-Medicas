// backend/src/models/doctor.model.js
const pool = require('../config/db');

const Doctor = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM doctors ORDER BY name ASC');
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ name, specialty }) {
    const { rows } = await pool.query(
      'INSERT INTO doctors (name, specialty) VALUES ($1, $2) RETURNING *',
      [name, specialty]
    );
    return rows[0];
  },

  async update(id, { name, specialty }) {
    const { rows } = await pool.query(
      'UPDATE doctors SET name = $1, specialty = $2 WHERE id = $3 RETURNING *',
      [name, specialty, id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pool.query('DELETE FROM doctors WHERE id = $1 RETURNING *', [id]);
    return rows[0] || null;
  }
};

module.exports = Doctor;
