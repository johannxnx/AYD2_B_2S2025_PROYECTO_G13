/**
 * @file Rutas de Notificaciones
 * @description Define las rutas para obtener notificaciones pendientes
 * @module routes/notificaciones
 */

const express = require('express');
const router = express.Router();
const { obtenerNotificaciones } = require('../../controllers/notificaciones/notificacionesController');
const { requireAuth } = require('../../middlewares/auth/auth.middleware');

/**
 * GET /api/notificaciones
 * @description Obtiene todas las notificaciones pendientes del usuario autenticado
 * @middleware requireAuth - Requiere autenticación
 * @returns {Object} {ok: boolean, notificaciones: Array, total: number}
 */
router.get('/', requireAuth, obtenerNotificaciones);

module.exports = router;
