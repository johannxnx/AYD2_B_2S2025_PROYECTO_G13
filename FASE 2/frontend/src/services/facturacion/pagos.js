// src/services/facturacion/pagos.js
import apiService from "../api";

/**
 * Registrar un pago para una factura
 * @param {Object} payload - { factura_id, monto, tipo_pago, numero_autorizacion, banco, referencia }
 * tipo_pago: 'CHEQUE' | 'TRANSFERENCIA'
 */
export const registrarPago = async (payload) => {
  return apiService["request"]("/pagos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Obtener todos los pagos (con filtros opcionales)
 * @param {Object} params - { cliente_id, fecha_inicio, fecha_fin, tipo_pago }
 */
export const getPagos = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.cliente_id) query.append("cliente_id", params.cliente_id);
  if (params.fecha_inicio) query.append("fecha_inicio", params.fecha_inicio);
  if (params.fecha_fin) query.append("fecha_fin", params.fecha_fin);
  if (params.tipo_pago) query.append("tipo_pago", params.tipo_pago);

  const url = `/pagos${query.toString() ? "?" + query.toString() : ""}`;
  return apiService["request"](url, { method: "GET" });
};

/**
 * Obtener detalle de un pago por ID
 */
export const getPagoById = async (id) => {
  return apiService["request"](`/pagos/${id}`, { method: "GET" });
};

/**
 * Obtener pagos asociados a una factura
 */
export const getPagosByFactura = async (facturaId) => {
  return apiService["request"](`/pagos/factura/${facturaId}`, { method: "GET" });
};

/**
 * Obtener pagos de un cliente (para liberar crédito)
 */
export const getPagosByCliente = async (clienteId) => {
  return apiService["request"](`/pagos/cliente/${clienteId}`, { method: "GET" });
}; 