require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const runMigrations = require('./config/migrate');
const userRoutes = require('./routes/user.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS: permite peticiones desde el frontend Vue (Vite dev server) ──
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Body parser ───────────────────────────────────────────────────────
app.use(express.json());

// ── Documentación Swagger UI ──────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Rutas de la API ───────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🏥 API de Citas Médicas corriendo',
    docs: `/api-docs`,
    version: '1.0.0'
  });
});

// ── Middleware global de errores (debe ir ÚLTIMO) ─────────────────────
// Captura cualquier error no manejado en controladores y responde JSON
app.use(errorHandler);

// ── Inicio del servidor ───────────────────────────────────────────────
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor en   http://localhost:${PORT}`);
      console.log(`📖 Swagger en    http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
