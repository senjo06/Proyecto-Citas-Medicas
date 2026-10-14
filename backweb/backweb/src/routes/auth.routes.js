// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');

/**
 * POST /api/auth/login
 * Autentica un usuario por email/password O el usuario especial "admin".
 * Retorna el rol: 'admin' | 'user'
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos.' });
  }

  try {
    // ── Caso especial: usuario administrador ─────────────────────────
    // Credenciales fijas: admin / 1234 (no se almacena en la BD)
    if (email === 'admin' && password === '1234') {
      return res.json({
        success: true,
        role: 'admin',
        user: { id: 0, name: 'Administrador', email: 'admin' }
      });
    }

    // ── Usuario normal: busca por nombre o email ─────────────────────
    const user = await UserModel.findByNameOrEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email o contraseña incorrectos.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Email o contraseña incorrectos.' });
    }

    return res.json({
      success: true,
      role: 'user',
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
