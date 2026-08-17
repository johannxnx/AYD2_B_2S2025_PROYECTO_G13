"use strict";

/**
 * @file routes_finanzas_tarifario.js
 * @description Rutas del módulo de Finanzas para la parametrización del tarifario.
 *
 * Actor:  AREA_CONTABLE  (CDU001.9 — Parametrizar Tarifario)
 *
 * Montar en app.js / index.js como:
 *   const tarifarioFinanzasRoutes = require('./routes/finanzas/routes_finanzas_tarifario');
 *   app.use('/api/finanzas/tarifario', tarifarioFinanzasRoutes);
 *
 * Endpoints expuestos:
 *   GET  /api/finanzas/tarifario              -> listar todas las tarifas activas
 *   GET  /api/finanzas/tarifario/referencia   -> rangos de referencia del sistema
 *   GET  /api/finanzas/tarifario/:tipo_unidad -> consultar tarifa de un tipo
 *   PUT  /api/finanzas/tarifario/:tipo_unidad -> actualizar tarifa (solo AREA_CONTABLE)
 */

const express           = require("express");
const router            = express.Router();
const { requireAuth }   = require("../../middlewares/auth/auth.middleware");
const {
  listarTarifas,
  obtenerReferencia,
  obtenerTarifa,
  parametrizarTarifa,
} = require("../../controllers/facturacion/finanzasTarifarioController");

/* ─── Middleware de control de roles ─────────────────────────────────────────
 *
 * Valida que el usuario del JWT tenga el rol requerido.
 * Reutiliza el mismo patrón que facturacionRoutes.js.
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

/* ─── Rutas de consulta (lectura) ────────────────────────────────────────────
 *
 * Accesibles por cualquier usuario autenticado del módulo de finanzas.
 * AREA_CONTABLE las usa para revisar el estado actual antes de editar.
 */

/**
 * GET /api/finanzas/tarifario
 * Lista todas las tarifas activas del sistema con el nombre del último editor.
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Tarifario obtenido exitosamente.",
 *   data: {
 *     tarifas: [
 *       {
 *         id:                    number,
 *         tipo_unidad:           "LIGERA" | "PESADA" | "CABEZAL",
 *         limite_peso_ton:       number,
 *         costo_base_km:         number,
 *         activo:                boolean,
 *         fecha_actualizacion:   datetime,
 *         actualizado_por_nombre: string
 *       }
 *     ],
 *     total: number
 *   }
 * }
 */
router.get(
  "/",
  requireAuth,
  listarTarifas
);

/**
 * GET /api/finanzas/tarifario/referencia
 * Devuelve los rangos de referencia (límites máximos y costos sugeridos) del sistema.
 * Útil para que el frontend muestre tooltips de validación al área contable.
 *
 * IMPORTANTE: esta ruta debe ir ANTES de /:tipo_unidad para que Express no
 * interprete "referencia" como un parámetro dinámico.
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Rangos de referencia obtenidos.",
 *   data: {
 *     LIGERA:  { limite_peso_ton_max: 9.90,  costo_base_km_sugerido: 8.00  },
 *     PESADA:  { limite_peso_ton_max: 21.90, costo_base_km_sugerido: 12.50 },
 *     CABEZAL: { limite_peso_ton_max: 50.00, costo_base_km_sugerido: 18.00 }
 *   }
 * }
 */
router.get(
  "/referencia",
  requireAuth,
  obtenerReferencia
);

/**
 * GET /api/finanzas/tarifario/:tipo_unidad
 * Obtiene la tarifa vigente de un tipo de unidad específico.
 *
 * @param tipo_unidad  LIGERA | PESADA | CABEZAL  (case-insensitive)
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Tarifa obtenida.",
 *   data: {
 *     tarifa: {
 *       id:              number,
 *       tipo_unidad:     string,
 *       limite_peso_ton: number,
 *       costo_base_km:   number,
 *       activo:          boolean
 *     },
 *     limitePermitido: number   -- Límite máximo de peso para este tipo
 *   }
 * }
 * respuesta :: 400 { ok: false, mensaje: "Tipo de unidad inválido." }
 * respuesta :: 404 { ok: false, mensaje: "No se encontró tarifa para LIGERA." }
 */
router.get(
  "/:tipo_unidad",
  requireAuth,
  obtenerTarifa
);

/* ─── Ruta de modificación (escritura) ───────────────────────────────────────
 *
 * Solo AREA_CONTABLE puede actualizar tarifas (CDU001.9, Regla de Negocio 2).
 */

/**
 * PUT /api/finanzas/tarifario/:tipo_unidad
 * Actualiza los parámetros de una tarifa base. (CDU001.9 — Flujo Principal pasos 3–8)
 *
 * @param tipo_unidad  LIGERA | PESADA | CABEZAL  (case-insensitive)
 *
 * @body {
 *   limite_peso_ton: decimal  -- requerido, > 0, respeta límite por tipo
 *   costo_base_km:  decimal  -- requerido, > 0
 * }
 *
 * Límites máximos por tipo (Regla de Negocio del proyecto):
 *   LIGERA  -> hasta  9.90 Ton
 *   PESADA  -> hasta 21.90 Ton
 *   CABEZAL -> hasta 50.00 Ton
 *
 * respuesta :: 200 {
 *   ok: true,
 *   mensaje: "Tarifa de LIGERA actualizada correctamente.",
 *   data: {
 *     tarifaAnterior: { limite_peso_ton: number, costo_base_km: number },
 *     tarifaActualizada: {
 *       id:                  number,
 *       tipo_unidad:         string,
 *       limite_peso_ton:     number,
 *       costo_base_km:       number,
 *       actualizado_por:     number,
 *       fecha_actualizacion: datetime
 *     }
 *   }
 * }
 * respuesta :: 400 { ok: false, mensaje: "El límite de peso para LIGERA no puede superar 9.90 Ton." }
 * respuesta :: 400 { ok: false, mensaje: "Los campos limite_peso_ton y costo_base_km son obligatorios." }
 * respuesta :: 403 { ok: false, mensaje: "Acceso denegado. Roles permitidos: AREA_CONTABLE." }
 * respuesta :: 404 { ok: false, mensaje: "No se encontró tarifa para PESADA." }
 */
router.put(
  "/:tipo_unidad",
  requireAuth,
  parametrizarTarifa
);

module.exports = router;