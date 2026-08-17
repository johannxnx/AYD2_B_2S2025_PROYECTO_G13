// src/services/facturacion/facturacion.js
import apiService from "../api";

/* ── Helpers ────────────────────────────────────────────── */
// Accede al método privado request de ApiService
const req = (url, opts) => apiService.request(url, opts);

/* ══════════════════════════════════════════════════════════
   FACTURAS
   ══════════════════════════════════════════════════════════ */

/**
 * GET /api/facturacion
 * Lista facturas con filtros opcionales
 */
export const getFacturas = async (params = {}) => {
  const q = new URLSearchParams();

  if (params.estado) q.append("estado", params.estado);
  if (params.cliente_id) q.append("cliente_id", String(params.cliente_id));
  if (params.fecha_desde) q.append("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) q.append("fecha_hasta", params.fecha_hasta);
  if (params.limit) q.append("limit", String(params.limit));

  return req(`/facturacion${q.toString() ? "?" + q.toString() : ""}`, {
    method: "GET",
  });
};

/**
 * GET /api/facturacion/:id
 */
export const getFacturaById = async (id) =>
  req(`/facturacion/${id}`, { method: "GET" });

/**
 * GET /api/facturacion/orden/:orden_id
 */
export const getFacturaPorOrden = async (ordenId) =>
  req(`/facturacion/orden/${ordenId}`, { method: "GET" });

/**
 * POST /api/facturacion/borrador/:orden_id
 */
export const generarBorrador = async (ordenId) =>
  req(`/facturacion/borrador/${ordenId}`, { method: "POST" });

/**
 * POST /api/facturacion/:id/validar
 */
export const validarFactura = async (facturaId) =>
  req(`/facturacion/${facturaId}/validar`, { method: "POST" });

/**
 * POST /api/facturacion/:id/certificar
 */
export const certificarFactura = async (facturaId) =>
  req(`/facturacion/${facturaId}/certificar`, { method: "POST" });

export const getFacturasByCliente = async (clienteId) => {
  return apiService["request"](`/facturacion?cliente_id=${clienteId}`, {
    method: "GET",
  });
};

/* ══════════════════════════════════════════════════════════
   COBROS
   ══════════════════════════════════════════════════════════ */

/**
 * GET /api/facturacion/cobros
 */
export const getCobros = async (params = {}) => {
  const q = new URLSearchParams();

  if (params.cliente_id) q.append("cliente_id", String(params.cliente_id));
  if (params.estado_cobro) q.append("estado_cobro", params.estado_cobro);
  if (params.limit) q.append("limit", String(params.limit));

  return req(`/facturacion/cobros${q.toString() ? "?" + q.toString() : ""}`, {
    method: "GET",
  });
};

/* ══════════════════════════════════════════════════════════
   PAGOS
   ══════════════════════════════════════════════════════════ */

/**
 * GET /api/facturacion/:id/pagos
 */
export const getPagosByFactura = async (facturaId) =>
  req(`/facturacion/${facturaId}/pagos`, { method: "GET" });

/**
 * POST /api/facturacion/:id/pagos
 */
export const registrarPago = async (facturaId, payload) =>
  req(`/facturacion/${facturaId}/pagos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });