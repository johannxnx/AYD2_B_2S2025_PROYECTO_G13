// src/services/facturacion/pagos.js
//
// CORRECCIÓN: este archivo apuntaba a /pagos (que no existe).
// Los pagos viven dentro del módulo de facturación:
//
//   GET  /api/facturacion/:factura_id/pagos  → listar pagos de una factura
//   POST /api/facturacion/:factura_id/pagos  → registrar un pago
//   GET  /api/facturacion/cobros             → cuentas por cobrar del cliente
//   GET  /api/facturacion                    → listar facturas (con cliente_id)
//
// Para la vista del CLIENTE (ClientePagosPage) el flujo es:
//   1. Obtener facturas certificadas del cliente → getFacturasCliente()
//   2. Para cada factura, obtener sus pagos      → getPagosByFactura()
//   3. Obtener cuentas por cobrar pendientes     → getCobrosCliente()
//
// El cliente NO puede registrar pagos directamente desde la UI del cliente;
// los pagos los registra el AGENTE_FINANCIERO. El cliente solo consulta.
// Si en tu proyecto el cliente SÍ puede registrar, usa registrarPago().

import apiService from "../api";

/* ── Helper interno ─────────────────────────────────────── */
const req = (url, opts) => apiService.request(url, opts);

/* ══════════════════════════════════════════════════════════
   CONSULTAS DE PAGOS (para la vista del cliente)
   ══════════════════════════════════════════════════════════ */

/**
 * Obtiene las facturas de un cliente específico.
 * Endpoint real: GET /api/facturacion?cliente_id=X
 *
 * @param {number|string} clienteId
 * @param {Object} params - { estado, limit }
 */
export const getFacturasCliente = async (clienteId, params = {}) => {
  const q = new URLSearchParams();
  q.append("cliente_id", String(clienteId));
  if (params.estado) q.append("estado", params.estado);
  if (params.limit)  q.append("limit",  String(params.limit));

  return req(`/facturacion?${q.toString()}`, { method: "GET" });
};

/**
 * Obtiene los pagos registrados para una factura específica.
 * Endpoint real: GET /api/facturacion/:factura_id/pagos
 *
 * @param {number} facturaId
 */
export const getPagosByFactura = async (facturaId) =>
  req(`/facturacion/${facturaId}/pagos`, { method: "GET" });

/**
 * Obtiene todas las cuentas por cobrar de un cliente.
 * Endpoint real: GET /api/facturacion/cobros?cliente_id=X
 *
 * Incluye: monto_original, saldo_pendiente, fecha_vencimiento, estado_cobro,
 *          numero_factura, uuid_autorizacion, numero_contrato.
 *
 * @param {number|string} clienteId
 * @param {Object} params - { estado_cobro, limit }
 */
export const getCobrosCliente = async (clienteId, params = {}) => {
  const q = new URLSearchParams();
  q.append("cliente_id", String(clienteId));
  if (params.estado_cobro) q.append("estado_cobro", params.estado_cobro);
  if (params.limit)        q.append("limit",        String(params.limit));

  return req(`/facturacion/cobros?${q.toString()}`, { method: "GET" });
};

/**
 * Obtiene todos los pagos del cliente iterando sobre sus facturas.
 *
 * IMPORTANTE: no hay un endpoint GET /pagos/cliente/:id.
 * Esta función primero obtiene las facturas del cliente y luego
 * los pagos de cada una. Se usa en ClientePagosPage para mostrar
 * el historial completo de pagos.
 *
 * @param {number|string} clienteId
 * @returns {Promise<{ ok: boolean, data: Pago[] }>}
 */
export const getPagosByCliente = async (clienteId) => {
  try {
    // 1. Obtener facturas certificadas del cliente
    const resFacturas = await getFacturasCliente(clienteId, { limit: 200 });
    const facturas = resFacturas?.data?.facturas ?? resFacturas?.data ?? [];

    // 2. Para cada factura, obtener sus pagos en paralelo
    const resultados = await Promise.all(
      facturas.map(async (factura) => {
        try {
          const resPagos = await getPagosByFactura(factura.id);
          const pagos    = resPagos?.data?.pagos ?? resPagos?.data ?? [];

          // Enriquecer cada pago con el número de factura para la UI
          return pagos.map((pago) => ({
            ...pago,
            numero_factura: factura.numero_factura,
            // Normalizar nombres de campos para que coincidan con la interfaz Pago del front
            monto:               pago.monto_pagado    ?? pago.monto,
            tipo_pago:           pago.forma_pago      ?? pago.tipo_pago,
            banco:               pago.banco_origen    ?? pago.banco,
            referencia:          pago.cuenta_origen   ?? pago.referencia,
            numero_autorizacion: pago.numero_autorizacion_bancaria ?? pago.numero_autorizacion,
            fecha_pago:          pago.fecha_hora_pago ?? pago.fecha_pago ?? pago.fecha_registro,
          }));
        } catch {
          // Si falla una factura, seguir con las demás
          return [];
        }
      })
    );

    // 3. Aplanar el array de arrays y ordenar por fecha descendente
    const todosPagos = resultados
      .flat()
      .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());

    return { ok: true, data: todosPagos };
  } catch (error) {
    return { ok: false, mensaje: error.message, data: [] };
  }
};

/* ══════════════════════════════════════════════════════════
   REGISTRAR PAGO (solo para AGENTE_FINANCIERO desde finanzas)
   ══════════════════════════════════════════════════════════ */

/**
 * Registra un pago bancario contra una factura certificada.
 * Endpoint real: POST /api/facturacion/:factura_id/pagos
 *
 * Solo lo puede ejecutar el AGENTE_FINANCIERO.
 * Se usa desde FinanzasPage / PagoModal, no desde la vista del cliente.
 *
 * @param {number} facturaId
 * @param {Object} payload
 * @param {number} payload.cuenta_por_cobrar_id
 * @param {string} payload.forma_pago              - "CHEQUE" | "TRANSFERENCIA"
 * @param {number} payload.monto_pagado
 * @param {string} payload.fecha_hora_pago         - ISO 8601
 * @param {string} payload.banco_origen
 * @param {string} payload.cuenta_origen
 * @param {string} payload.numero_autorizacion_bancaria
 * @param {string} [payload.observacion]
 */
export const registrarPago = async (facturaId, payload) =>
  req(`/facturacion/${facturaId}/pagos`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });

/* ══════════════════════════════════════════════════════════
   ALIASES para compatibilidad con código existente
   (Si algún componente aún importa los nombres viejos)
   ══════════════════════════════════════════════════════════ */

/** @deprecated Usa getCobrosCliente() */
export const getPagos = getCobrosCliente;

/** @deprecated Usa getPagosByFactura() */
export const getPagoById = (id) => getPagosByFactura(id);