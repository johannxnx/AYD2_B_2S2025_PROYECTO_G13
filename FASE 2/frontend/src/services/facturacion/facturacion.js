// src/services/facturacion/facturacion.js
import apiService from "../api";

/**
 * Obtener todas las facturas (con filtros opcionales)
 * @param {Object} params - { estado, cliente_id, fecha_inicio, fecha_fin, limit }
 */
export const getFacturas = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.estado) query.append("estado", params.estado);
  if (params.cliente_id) query.append("cliente_id", params.cliente_id);
  if (params.fecha_inicio) query.append("fecha_inicio", params.fecha_inicio);
  if (params.fecha_fin) query.append("fecha_fin", params.fecha_fin);
  if (params.limit) query.append("limit", params.limit);

  const url = `/facturacion/facturas${query.toString() ? "?" + query.toString() : ""}`;
  return apiService["request"](url, { method: "GET" });
}; 

/**
 * Obtener detalle de una factura por ID
 */
export const getFacturaById = async (id) => {
  return apiService["request"](`/facturacion/${id}`, { method: "GET" });
};

/**
 * Obtener borrador de factura a partir de una orden entregada
 */
export const getBorradorFactura = async (ordenId) => {
  return apiService["request"](`/facturacion/borrador/${ordenId}`, { method: "GET" });
};

/**
 * Certificar una factura (simular FEL)
 * Genera UUID de autorización y valida NIT
 */
export const certificarFactura = async (facturaId) => {
  return apiService["request"](`/facturacion/${facturaId}/certificar`, {
    method: "POST",
  });
};

/**
 * Obtener facturas de un cliente específico
 */
export const getFacturasByCliente = async (clienteId) => {
  return apiService["request"](`/facturacion/facturas?cliente_id=${clienteId}`, {
    method: "GET",
  });
};

/**
 * Obtener resumen de facturación por sede
 * @param {string} sede - guatemala | xela | puerto_barrios
 */
export const getResumenFacturacionSede = async (sede) => {
  return apiService["request"](`/facturacion/resumen/sede/${sede}`, {
    method: "GET",
  });
};