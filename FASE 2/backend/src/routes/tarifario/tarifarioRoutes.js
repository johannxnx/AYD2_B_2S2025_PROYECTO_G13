/**
 * @file tarifarioRoutes.js
 * @description Rutas para la gestión del tarifario de transporte.
 * Permite consultar tariffas por tipo de unidad y actualizar precios base.
 */

const express      = require('express');
const router       = express.Router();
const { requireAuth } = require('../../middlewares/auth/auth.middleware');
const {
  obtenerTarifario,
  obtenerTarifaPorTipo,
  actualizarTarifa,
  obtenerRangosReferencia
} = require('../../controllers/tarifario/tarifarioController');

/**
 * GET /api/tarifario
 * @description Lista todas las tarifas activas del sistema
 * @auth Requerida (token JWT)
 * @response {status: 200, data: [tarifas]}
 */
router.get('/', requireAuth, obtenerTarifario);

/**
 * GET /api/tarifario/referencia
 * @description Obtiene los rangos de referencia de costos por tipo de unidad
 * @auth Requerida (token JWT)
 * @response {status: 200, data: { LIGERA: {...}, PESADA: {...}, CABEZAL: {...} }}
 * @note IMPORTANTE: esta ruta debe ir antes de /:tipo_unidad para evitar conflictos
 */
router.get('/referencia', requireAuth, obtenerRangosReferencia);

/**
 * GET /api/tarifario/:tipo_unidad
 * @description Obtiene la tarifa de un tipo de unidad específico
 * @auth Requerida (token JWT)
 * @params tipo_unidad: string - LIGERA, PESADA, CABEZAL
 * @response {status: 200, data: tarifa}
 */
router.get('/:tipo_unidad', requireAuth, obtenerTarifaPorTipo);

/**
 * PUT /api/tarifario/:tipo_unidad
 * @description Actualiza el costo base de un tipo de transporte
 * @auth Requerida (token JWT)
 * @permission Solo Área Contable puede realizar esta acción
 * @params tipo_unidad: string - LIGERA, PESADA, CABEZAL
 * @body {
 *   limite_peso_ton: decimal - Nuevo límite de peso
 *   costo_base_km: decimal - Nuevo costo por kilómetro
 * }
 * @response {status: 200, data: tarifaActualizada}
 */
router.put('/:tipo_unidad', requireAuth, actualizarTarifa);

module.exports = router;