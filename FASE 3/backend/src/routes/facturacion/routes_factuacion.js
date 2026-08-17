"use strict";

const express              = require("express");
const router               = express.Router();
const { requireAuth }      = require("../../middlewares/auth/auth.middleware");
const {
  generarBorrador,
  validarBorrador,
  certificarFactura,
  registrarPago,
  obtenerFactura,
  listarFacturas,
  listarCobros,
  listarPagos,
  obtenerPorOrden,
} = require("../../controllers/facturacion/facturacionController");

/* ─── Middleware de control de roles ─────────────────── */

/**
 * Genera un middleware que valida que el usuario del JWT
 * tenga uno de los roles permitidos.
 *
 * @param {...string} rolesPermitidos
 * @returns {Function} Middleware Express
 */
const checkRole = (...rolesPermitidos) => (req, res, next) => {
  if (!req.user || !rolesPermitidos.includes(req.user.tipo_usuario)) {
    return res.status(403).json({
      ok:      false,
      mensaje: `Acceso denegado. Roles permitidos: ${rolesPermitidos.join(", ")}. Tu rol: ${req.user?.tipo_usuario || "desconocido"}`,
    });
  }
  return next();
};

/**
 * GET /api/facturacion
 * Lista facturas con filtros opcionales
 *
 * [cliente_id]  - Filtrar por cliente
 * [estado]      - BORRADOR | VALIDADA | CERTIFICADA | ANULADA
 * [fecha_desde] - YYYY-MM-DD
 * [fecha_hasta] - YYYY-MM-DD
 * [limit]       - Máximo de resultados (default: 50)
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Facturas obtenidas exitosamente.",
 *   data: {
 *     facturas: Array<Factura>,
 *     total: number
 *   }
 * }
 */
router.get(
  "/",
  requireAuth,
  listarFacturas
);

/**
 *  GET /api/facturacion/cobros
 *  Lista cuentas por cobrar — módulo de cobros (CDU003.7 / CDU003.8)
 *  AGENTE_FINANCIERO | AREA_CONTABLE
 *
 * ----> viene de la tabla cuentas_por_cobrar
 * [cliente_id]   - Filtrar por cliente
 * [estado_cobro] - PENDIENTE | PAGADA | VENCIDA | ANULADA
 * [limit]        - Máximo de resultados (default: 100)
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Cuentas por cobrar obtenidas.",
 *   data: {
 *     cuentas: Array<CuentaPorCobrar>,
 *     total: number
 *   }
 * }
 */
router.get(
  "/cobros",
  requireAuth,
  listarCobros
);

/**
 * GET /api/facturacion/orden/:orden_id
 * Obtiene la factura vinculada a una orden específica
 * AGENTE_FINANCIERO | AREA_CONTABLE
 *
 * {number} orden_id - ID de la orden de servicio
 *
 * respuesta :: 200 {
 *   ok: true,
 *   data: { factura: Factura }
 * }
 * respuesta :: 404 { ok: false, mensaje: "No existe factura para la orden X." }
 * 
 *  *   ----> tabla facturas_fel
 * 
 */
router.get(
  "/orden/:orden_id",
  requireAuth,
  obtenerPorOrden
);

//    CICLO DE FACTURACIÓN (POST)
/**
 * POST /api/facturacion/borrador/:orden_id
 * Genera el borrador de factura para una orden ENTREGADA (CDU003.1)
 * 
 * Este endpoint es el punto de entrada del ciclo de facturación.
 * Puede ser llamado manualmente por el agente financiero si el trigger automático falló (FA2 del CDU003.1).
 * AGENTE_FINANCIERO
 *
 * {number} orden_id - ID de la orden que ya fue marcada ENTREGADA
 *
 * respuesta :: 201 {
 *   ok: true,
 *   mensaje: "Borrador de factura generado exitosamente.",
 *   data: {
 *     borrador: {
 *       id: number,
 *       numero_factura: string,     -- Ej: "F-20260324-45821"
 *       estado: "BORRADOR",
 *       distancia_km: number,
 *       tarifa_aplicada: number,    -- Q/km negociada
 *       descuento_aplicado: number,
 *       subtotal: number,
 *       iva: number,
 *       total_factura: number,
 *       nit_cliente: string,
 *       nombre_cliente_facturacion: string,
 *       fecha_emision: datetime
 *     },
 *     calculoDetallado: {
 *       distancia_km: number,
 *       tarifa_aplicada: number,
 *       bruto: number,
 *       porcentaje_descuento: number,
 *       descuento_aplicado: number,
 *       subtotal: number,
 *       iva_porcentaje: 12,
 *       iva: number,
 *       total_factura: number
 *     },
 *     yaExistia: boolean
 *   }
 * }
 * respuesta :: 404 { ok: false, mensaje: "Orden X no encontrada." }
 * respuesta :: 422 { ok: false, mensaje: "La orden debe estar en estado ENTREGADA." }
 */
router.post(
  "/borrador/:orden_id",
  requireAuth,
  generarBorrador
);

/**
 * POST /api/facturacion/:factura_id/validar
 *    Valida el borrador contra las reglas de la SAT (CDU003.2)
 *          Si aprueba -> estado cambia a VALIDADA
 *          Si rechaza -> queda en BORRADOR con motivo registrado
 *   AGENTE_FINANCIERO
 *
 * factura_id - ID de la factura en estado BORRADOR
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Factura validada correctamente.",
 *   data: {
 *     resultado: {
 *       aprobada: boolean,
 *       nitValido: boolean,
 *       camposCompletos: boolean,
 *       ivaValido: boolean,
 *       errores: string[],
 *       detalles: object
 *     },
 *     factura: Factura,       -- con estado actualizado
 *     validacion: ValidacionFEL
 *   }
 * }
 * respuesta :: 422 {
 *   ok: false,
 *   mensaje: "Validación rechazada.",
 *   data: { resultado: { errores: string[] } }
 * }
 */
router.post(
  "/:factura_id/validar",
  requireAuth,
  validarBorrador
);


/**
 *  POST /api/facturacion/:factura_id/certificar
 *   Certifica la factura ante el simulador FEL de la SAT (CDU003.3)
 *
 *          Al certificar exitosamente:
 *            -> UUID de autorización generado
 *            -> XML DTE construido y almacenado
 *            -> Cuenta por Cobrar creada automáticamente
 *            -> saldo_usado del contrato CARGADO
 *            -> Correo enviado al cliente (CDU003.4)
 *
 *   AGENTE_FINANCIERO
 *
 *  factura_id - ID de la factura en estado VALIDADA
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Factura certificada. UUID SAT: XXXXXXXX-...",
 *   data: {
 *     factura: {
 *       ...FacturaFEL,
 *       estado: "CERTIFICADA",
 *       uuid_autorizacion: string,
 *       fecha_certificacion: datetime,
 *       pdf_fel_url: string
 *     },
 *     cuentaPorCobrar: {
 *       id: number,
 *       monto_original: number,
 *       saldo_pendiente: number,
 *       fecha_vencimiento: date,
 *       estado_cobro: "PENDIENTE"
 *     },
 *     movimiento: {
 *       tipo_movimiento: "CARGO",
 *       monto_movimiento: number,
 *       saldo_anterior: number,
 *       saldo_nuevo: number
 *     },
 *     uuid: string,
 *     mensajeSAT: string
 *   }
 * }
 * respuesta :: 422 { ok: false, mensaje: "La factura debe estar en estado VALIDADA." }
 */
router.post(
  "/:factura_id/certificar",
  requireAuth,
  certificarFactura
);

/**
 *   POST /api/facturacion/:factura_id/pagos
 *   Registra un pago bancario contra una factura certificada (CDU003.6 / CDU003.9)
 *
 *          Al registrar el pago:
 *            -> pago guardado en pagos_factura
 *            -> saldo_pendiente de la CXC reducido
 *            -> saldo_usado del contrato ABONADO (crédito liberado)
 *            -> movimiento ABONO registrado
 *
 * =  AGENTE_FINANCIERO
 *
 *  {number} factura_id - ID de la factura CERTIFICADA
 *
 * @body {
 *   cuenta_por_cobrar_id:         number   -- ID de la CXC a abonar (requerido)
 *   forma_pago:                   string   -- "CHEQUE" | "TRANSFERENCIA" (requerido)
 *   monto_pagado:                 number   -- Monto en Q (requerido, > 0)
 *   fecha_hora_pago:              string   -- ISO 8601: "2026-03-24T14:30:00" (requerido)
 *   banco_origen:                 string   -- Nombre del banco (requerido)
 *   cuenta_origen:                string   -- Número de cuenta bancaria (requerido)
 *   numero_autorizacion_bancaria: string   -- Número de autorización del banco (requerido)
 *   observacion:                  string   -- Nota libre (opcional)
 * }
 *
 * respuesta :: 201 {
 *   ok: true,
 *   mensaje: "Pago de Q2744.00 registrado. Crédito liberado: Q2744.00",
 *   data: {
 *     pago: PagoFactura,
 *     cuentaActualizada: { saldo_pendiente: number, estado_cobro: string },
 *     movimiento: { tipo_movimiento: "ABONO", saldo_anterior: number, saldo_nuevo: number },
 *     creditoLiberado: number,
 *     saldoContratoAnterior: number,
 *     saldoContratoNuevo: number
 *   }
 * }
 * respuesta :: 422 { ok: false, mensaje: "El monto pagado supera el saldo pendiente." }

 ---> para pagar

*/
router.post(
  "/:factura_id/pagos",
  requireAuth,
  registrarPago
);

/* ═══════════════════════════════════════════════════════
   CONSULTAS CON PARÁMETRO DINÁMICO (GET con :factura_id)
   Deben ir DESPUÉS de las rutas estáticas (/cobros, /orden/:orden_id)
   ═══════════════════════════════════════════════════════ */

/**
 * @route   GET /api/facturacion/:factura_id
 * @desc    Obtiene el detalle completo de una factura incluyendo pagos y CXC
 * @access  AGENTE_FINANCIERO | AREA_CONTABLE
 *
 * @param  {number} factura_id
 *
 * respuesta :: 200 {
 *   ok: true,
 *   data: {
 *     factura: Factura,
 *     pagos: PagoFactura[],
 *     cuentaPorCobrar: CuentaPorCobrar | null
 *   }
 * }
 */
router.get(
  "/:factura_id",
  requireAuth,
  obtenerFactura
);

/**
 * @route   GET /api/facturacion/:factura_id/pagos
 * @desc    Lista todos los pagos registrados para una factura específica
 * @access  AGENTE_FINANCIERO | AREA_CONTABLE
 *
 * @param  {number} factura_id
 *
 * respuesta :: 200 {
 *   ok: true,
 *   data: {
 *     pagos: PagoFactura[],
 *     total: number
 *   }
 * }
 */
router.get(
  "/:factura_id/pagos",
  requireAuth,
  listarPagos
);

module.exports = router;