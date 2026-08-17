/**
 * @file monedaRoutes.js
 * @description Rutas para el API de gestión de monedas
 * Endpoints para obtener monedas, tipos de cambio, conversiones y más
 * @module routes/monedas/monedaRoutes
 */

const express = require('express');
const router = express.Router();
const monedaController = require('../../controllers/monedas/monedaController');
const { requireAuth } = require('../../middlewares/auth/auth.middleware');

/**
 * GET /api/monedas
 * Obtiene todas las monedas disponibles
 */
router.get('/', monedaController.obtenerTodasLasMonedas);

/**
 * GET /api/monedas/:id
 * Obtiene el detalle de una moneda específica
 */
router.get('/:id', monedaController.obtenerMonedaDetalle);

/**
 * GET /api/monedas/tipos-cambio
 * Obtiene los tipos de cambio actuales de todas las monedas
 */
router.get('/tipos-cambio/todos', monedaController.obtenerTiposCambio);

/**
 * POST /api/monedas/convertir
 * Convierte un monto entre dos monedas
 * Body: { monto, moneda_origen_id, moneda_destino_id }
 */
router.post('/convertir', monedaController.convertir);

/**
 * POST /api/monedas/calcular-total
 * Calcula el total de una transacción en múltiples monedas
 * Body: { total_gtq, moneda_id }
 */
router.post('/calcular-total', monedaController.calcularTotalMultimoneda);

/**
 * PUT /api/monedas/:id/tipo-cambio
 * Actualiza el tipo de cambio de una moneda
 * Requiere autenticación de administrador
 * Body: { nuevo_cambio }
 */
router.put('/:id/tipo-cambio', requireAuth, monedaController.actualizarTipoCambio);

module.exports = router;
