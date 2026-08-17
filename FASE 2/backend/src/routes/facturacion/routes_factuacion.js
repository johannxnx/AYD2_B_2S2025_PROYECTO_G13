/**
 * @file Rutas de Facturación
 * @description Endpoints para gestionar procesos de facturación y emisión de documentos
 * @module routes/facturacion/routes_factuacion
 * @version 1.0.0
 * @requires express
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/facturacion
 * @description Verifica el estado del módulo de facturación
 * @response {status: 200, ok: true, modulo: 'facturacion', mensaje: string}
 */
router.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    modulo: 'facturacion',
    mensaje: 'Ruta principal de facturación'
  });
});

/**
 * GET /api/facturacion/facturas
 * @description Obtiene el listado de todas las facturas emitidas
 * @auth Requerida (token JWT)
 * @query estado: string (opcional) - Filtrar por estado: EMITIDA, PAGADA, VENCIDA, ANULADA
 * @query cliente_id: number (opcional) - Filtrar por cliente específico
 * @query desde: date (opcional) - Fecha inicial del rango (YYYY-MM-DD)
 * @query hasta: date (opcional) - Fecha final del rango (YYYY-MM-DD)
 * @response {status: 200, ok: true, mensaje: string, data: [facturas]}
 */
router.get('/facturas', (req, res) => {
  res.status(200).json({
    ok: true,
    mensaje: 'Listado de facturas',
    data: []
  });
});

/**
 * POST /api/facturacion/facturas
 * @description Crea una nueva factura a partir de un movimiento de crédito
 * @auth Requerida (token JWT)
 * @body {
 *   movimiento_credito_id: number - ID del movimiento a facturar,
 *   numero_interno: string - Número secuencial de factura,
 *   fecha_emision: date - Fecha de emisión (YYYY-MM-DD),
 *   observaciones: string (opcional) - Notas adicionales
 * }
 * @response {status: 201, ok: true, mensaje: string, data: facturaCreada}
 */
router.post('/facturas', (req, res) => {
  const datos = req.body;

  res.status(201).json({
    ok: true,
    mensaje: 'Factura creada correctamente',
    data: datos
  });
});

module.exports = router;