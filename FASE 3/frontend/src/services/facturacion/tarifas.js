// src/services/facturacion/tarifas.js
//
// Servicio para consumir los endpoints de parametrización de tarifario.
// Módulo: Finanzas → CDU001.9 — Parametrizar Tarifario
// Actor:  AREA_CONTABLE
//
// Endpoints que consume:
//   GET  /api/finanzas/tarifario              → listarTarifas()
//   GET  /api/finanzas/tarifario/referencia   → getReferencia()
//   GET  /api/finanzas/tarifario/:tipo_unidad → getTarifaPorTipo()
//   PUT  /api/finanzas/tarifario/:tipo_unidad → actualizarTarifa()

import apiService from "../api";

/* ── Helper interno (mismo patrón que facturacion.js) ───── */
const req = (url, opts) => apiService.request(url, opts);

/* ══════════════════════════════════════════════════════════
   CONSULTAS
   ══════════════════════════════════════════════════════════ */

/**
 * GET /api/finanzas/tarifario
 * Lista las tres tarifas activas del sistema (LIGERA, PESADA, CABEZAL).
 *
 * respuesta :: {
 *   ok: true,
 *   data: {
 *     tarifas: Array<{ id, tipo_unidad, limite_peso_ton, costo_base_km,
 *                      activo, fecha_actualizacion, actualizado_por_nombre }>,
 *     total: number
 *   }
 * }
 */
export const listarTarifas = async () =>
  req("/finanzas/tarifario", { method: "GET" });

/**
 * GET /api/finanzas/tarifario/referencia
 * Devuelve los límites máximos y costos sugeridos por tipo de unidad.
 * Usado por el frontend para mostrar validaciones inline (FA1 del CDU001.9).
 *
 * respuesta :: {
 *   ok: true,
 *   data: {
 *     LIGERA:  { limite_peso_ton_max: 9.90,  costo_base_km_sugerido: 8.00  },
 *     PESADA:  { limite_peso_ton_max: 21.90, costo_base_km_sugerido: 12.50 },
 *     CABEZAL: { limite_peso_ton_max: 50.00, costo_base_km_sugerido: 18.00 }
 *   }
 * }
 */
export const getReferencia = async () =>
  req("/finanzas/tarifario/referencia", { method: "GET" });

/**
 * GET /api/finanzas/tarifario/:tipo_unidad
 * Obtiene la tarifa vigente de un tipo de unidad específico.
 *
 * @param {"LIGERA"|"PESADA"|"CABEZAL"} tipoUnidad
 *
 * respuesta :: {
 *   ok: true,
 *   data: {
 *     tarifa:          { id, tipo_unidad, limite_peso_ton, costo_base_km, activo },
 *     limitePermitido: number,
 *     descripcion:     string
 *   }
 * }
 */
export const getTarifaPorTipo = async (tipoUnidad) =>
  req(`/finanzas/tarifario/${tipoUnidad.toUpperCase()}`, { method: "GET" });

/* ══════════════════════════════════════════════════════════
   MODIFICACIÓN  (solo AREA_CONTABLE)
   ══════════════════════════════════════════════════════════ */

/**
 * PUT /api/finanzas/tarifario/:tipo_unidad
 * Actualiza los parámetros de una tarifa base.
 * El backend valida que el usuario tenga rol AREA_CONTABLE.
 *
 * @param {"LIGERA"|"PESADA"|"CABEZAL"} tipoUnidad
 * @param {{ limite_peso_ton: number, costo_base_km: number }} payload
 *
 * Límites máximos aceptados por el backend:
 *   LIGERA  → 9.90 Ton
 *   PESADA  → 21.90 Ton
 *   CABEZAL → 50.00 Ton
 *
 * respuesta :: {
 *   ok: true,
 *   mensaje: "Tarifa de LIGERA actualizada correctamente.",
 *   data: {
 *     tarifaAnterior:    { limite_peso_ton, costo_base_km },
 *     tarifaActualizada: { id, tipo_unidad, limite_peso_ton, costo_base_km,
 *                          actualizado_por, fecha_actualizacion }
 *   }
 * }
 */
export const actualizarTarifa = async (tipoUnidad, payload) =>
  req(`/finanzas/tarifario/${tipoUnidad.toUpperCase()}`, {
    method: "PUT",
    body:   JSON.stringify(payload),
  });