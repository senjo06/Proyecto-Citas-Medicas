const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {
  async findAll() {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, created_at FROM users ORDER BY id'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  // Busca por nombre O email — para el login flexible
  async findByNameOrEmail(value) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)',
      [value]
    );
    return rows[0] || null;
  },

  async create({ name, email, password, phone }) {
    const hashed = await bcrypt.hash(password, 8);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, created_at',
      [name, email, hashed, phone ?? null]
    );
    return rows[0];
  },

  async update(id, { name, email, password, phone }) {
    if (password) {
      const hashed = await bcrypt.hash(password, 8);
      const { rows } = await pool.query(
        'UPDATE users SET name = $1, email = $2, password = $3, phone = $4 WHERE id = $5 RETURNING id, name, email, phone, created_at',
        [name, email, hashed, phone ?? null, id]
      );
      return rows[0] || null;
    }
    const { rows } = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone, created_at',
      [name, email, phone ?? null, id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = UserModel;
