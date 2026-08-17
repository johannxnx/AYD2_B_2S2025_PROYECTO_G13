// FASE 2/backend/src/routes/contratos/contratoRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth/auth.middleware');
const {
  crearContrato,
  obtenerContrato,
  listarContratosPorCliente,
  listarTodosContratos,  // NUEVO - Agregar esta importación
  modificarContrato,
  validarCliente,
  agregarDescuento,
  agregarRuta
} = require('../../controllers/contratos/contratoController');

/**
 * POST /api/contratos
 * @description Crea un nuevo contrato con tarifas negociadas y rutas autorizadas
 */
router.post('/', requireAuth, crearContrato);

/**
 * GET /api/contratos
 * @description Lista todos los contratos del sistema (para vista de logística)
 */
router.get('/', requireAuth, listarTodosContratos);  // Esta línea ahora funciona

/**
 * GET /api/contratos/validar/:cliente_id
 * @description Valida si un cliente puede hacer una ruta específica con cierta unidad
 */
router.get('/validar/:cliente_id', requireAuth, validarCliente);

/**
 * GET /api/contratos/cliente/:cliente_id
 * @description Lista todos los contratos de un cliente específico
 */
router.get('/cliente/:cliente_id', requireAuth, listarContratosPorCliente);

/**
 * GET /api/contratos/:id
 * @description Obtiene los detalles completos de un contrato
 */
router.get('/:id', requireAuth, obtenerContrato);

/**
 * PUT /api/contratos/:id
 * @description Actualiza los datos principales de un contrato
 */
router.put('/:id', requireAuth, modificarContrato);

/**
 * POST /api/contratos/:id/descuentos
 * @description Agrega un descuento a un tipo de unidad en el contrato
 */
router.post('/:id/descuentos', requireAuth, agregarDescuento);

/**
 * POST /api/contratos/:id/rutas
 * @description Autoriza una nueva ruta de transporte en el contrato
 */
router.post('/:id/rutas', requireAuth, agregarRuta);

module.exports = router;