// backend/src/middleware/errorHandler.js
// Middleware global de manejo de errores de Express.
// Captura cualquier error no manejado en los controladores y devuelve
// una respuesta JSON uniforme en lugar de exponer el stack trace al cliente.

/**
 * Middleware de errores — debe ser el ÚLTIMO app.use() en index.js
 * Express lo reconoce como error handler por tener 4 parámetros (err, req, res, next)
 */
function errorHandler(err, req, res, next) {
  // Log interno completo para depuración en servidor
  console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);

  // Determina el código HTTP: usa el que ya tiene la respuesta, o 500 por defecto
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Error interno del servidor.',
    // Solo expone el stack en desarrollo, nunca en producción
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
