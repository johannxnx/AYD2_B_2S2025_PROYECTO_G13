"use strict";

/**
 * @file finanzasTarifarioController.js
 * @description Controlador HTTP del módulo Finanzas → Parametrización de Tarifario.
 *
 * Actor:  AREA_CONTABLE  (CDU001.9 — Parametrizar Tarifario)
 *
 * Este controlador sigue el patrón "thin controller" de facturacionController.js:
 *   1. Lee params / body / user del JWT.
 *   2. Delega al servicio finanzasTarifarioService.js.
 *   3. Devuelve { ok, mensaje, data } en formato estándar del proyecto.
 *
 * Toda la lógica de negocio (validaciones de rango, auditoría, etc.) vive
 * en el servicio, NO aquí.
 *
 * Rutas que consume:
 *   GET  /api/finanzas/tarifario
 *   GET  /api/finanzas/tarifario/referencia
 *   GET  /api/finanzas/tarifario/:tipo_unidad
 *   PUT  /api/finanzas/tarifario/:tipo_unidad
 */

const finanzasTarifarioService = require("../../services/facturacion/finanzasTarifarioService");

/* ─── Helpers de respuesta estándar ──────────────────────────────────────────
 * Mismo patrón que facturacionController.js para coherencia del proyecto.
 */
const ok  = (res, data, mensaje = "OK", status = 200) =>
  res.status(status).json({ ok: true, mensaje, data });

const err = (res, mensaje, status = 500, detalle = null) =>
  res.status(status).json({ ok: false, mensaje, ...(detalle ? { detalle } : {}) });

/**
 * Extrae el ID numérico del usuario desde el payload del JWT.
 * Soporta los campos: id, sub, usuario_id (mismo helper que facturacionController).
 *
 * @param {Object} user  req.user inyectado por requireAuth
 * @returns {number}
 * @throws {Object} Error HTTP 401 si no puede resolver el ID
 */
function resolverUserId(user) {
  if (!user) {
    throw Object.assign(
      new Error("Token inválido: no hay información de usuario."),
      { status: 401 }
    );
  }
  const candidatos = [user.id, user.sub, user.usuario_id];
  for (const c of candidatos) {
    const n = parseInt(c);
    if (!isNaN(n) && n > 0) return n;
  }
  throw Object.assign(
    new Error(
      `Token inválido: no se pudo obtener el ID de usuario. ` +
      `Payload recibido: ${JSON.stringify(user)}`
    ),
    { status: 401 }
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HANDLERS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/finanzas/tarifario
 * Lista todas las tarifas activas del sistema.
 *
 * No requiere parámetros.
 * Cualquier usuario autenticado del módulo puede consultar.
 */
const listarTarifas = async (req, res) => {
  try {
    const tarifas = await finanzasTarifarioService.listarTarifas();

    return ok(res, { tarifas, total: tarifas.length }, "Tarifario obtenido exitosamente.");
  } catch (error) {
    return err(res, error.mensaje || "Error al obtener el tarifario.", error.status || 500);
  }
};

/**
 * GET /api/finanzas/tarifario/referencia
 * Devuelve los rangos de referencia (límites máximos y costos sugeridos).
 *
 * No requiere parámetros.
 * Útil para que el frontend muestre validaciones inline al área contable
 * antes de que presione "Guardar" (FA1 del CDU001.9).
 */
const obtenerReferencia = (req, res) => {
  try {
    const rangos = finanzasTarifarioService.obtenerRangosReferencia();

    return ok(res, rangos, "Rangos de referencia obtenidos.");
  } catch (error) {
    return err(res, error.mensaje || "Error al obtener rangos de referencia.", error.status || 500);
  }
};

/**
 * GET /api/finanzas/tarifario/:tipo_unidad
 * Obtiene la tarifa vigente de un tipo de unidad específico.
 *
 * @param tipo_unidad  LIGERA | PESADA | CABEZAL  (case-insensitive, se normaliza aquí)
 *
 * También devuelve el límite máximo permitido para ese tipo, para que el
 * frontend pueda pre-poblar el campo con el tope correcto.
 */
const obtenerTarifa = async (req, res) => {
  try {
    const tipo_unidad = req.params.tipo_unidad.toUpperCase();

    const resultado = await finanzasTarifarioService.obtenerTarifa(tipo_unidad);

    return ok(res, resultado, `Tarifa de ${tipo_unidad} obtenida.`);
  } catch (error) {
    return err(res, error.mensaje || "Error al obtener la tarifa.", error.status || 500);
  }
};

/**
 * PUT /api/finanzas/tarifario/:tipo_unidad
 * Actualiza los parámetros de una tarifa base. (CDU001.9 — Flujo Principal pasos 3–8)
 *
 * Solo AREA_CONTABLE puede llegar aquí (checkRole en las rutas lo garantiza).
 *
 * @param tipo_unidad          LIGERA | PESADA | CABEZAL (case-insensitive)
 * @body  limite_peso_ton      decimal, requerido
 * @body  costo_base_km        decimal, requerido
 *
 * El servicio aplica las validaciones de rango (FA1) y campos obligatorios (FA2),
 * y registra en auditoría con fecha, hora y usuario (Regla de Calidad CDU001.9).
 */
const parametrizarTarifa = async (req, res) => {
  try {
    const tipo_unidad = req.params.tipo_unidad.toUpperCase();
    const { limite_peso_ton, costo_base_km } = req.body;

    // FA2 — campos obligatorios pendientes
    if (limite_peso_ton === undefined || limite_peso_ton === null ||
        costo_base_km   === undefined || costo_base_km   === null) {
      return err(
        res,
        "Los campos limite_peso_ton y costo_base_km son obligatorios.",
        400
      );
    }

    const usuario_id = resolverUserId(req.user);
    const ip         = req.ip || req.headers["x-forwarded-for"] || "desconocida";

    const resultado = await finanzasTarifarioService.parametrizarTarifa(
      tipo_unidad,
      { limite_peso_ton: parseFloat(limite_peso_ton), costo_base_km: parseFloat(costo_base_km) },
      usuario_id,
      ip
    );

    return ok(
      res,
      resultado,
      `Tarifa de ${tipo_unidad} actualizada correctamente.`
    );
  } catch (error) {
    return err(
      res,
      error.mensaje || error.message || "Error al actualizar la tarifa.",
      error.status  || 500
    );
  }
};

module.exports = {
  listarTarifas,
  obtenerReferencia,
  obtenerTarifa,
  parametrizarTarifa,
};