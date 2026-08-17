// src/services/Gerencial/gerencial.js
import apiService from "../api";

/**
 * Corte diario de operaciones y facturación por sede
 * GET /api/gerencial/corte-diario?moneda_id=1
 */
export const getCorteDiario = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.moneda_id) query.append("moneda_id", params.moneda_id);
  const url = `/gerencial/corte-diario${query.toString() ? "?" + query.toString() : ""}`;
  return apiService["request"](url, { method: "GET" });
};

/**
 * KPIs de rentabilidad y cumplimiento
 * GET /api/gerencial/kpis?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&sede=guatemala&moneda_id=1
 * @param {Object} params - { desde, hasta, sede, moneda_id }
 */
export const getKPIs = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.desde) query.append("desde", params.desde);
  if (params.hasta) query.append("hasta", params.hasta);
  if (params.sede) query.append("sede", params.sede);
  if (params.moneda_id) query.append("moneda_id", params.moneda_id);
  const url = `/gerencial/kpis${query.toString() ? "?" + query.toString() : ""}`;
  return apiService["request"](url, { method: "GET" });
};

/**
 * Alertas de desviación (clientes con baja carga, rutas con exceso de costo)
 * GET /api/gerencial/alertas
 */
export const getAlertas = async () => {
  return apiService["request"]("/gerencial/alertas", { method: "GET" });
};

/**
 * Eventos/Bitácora de órdenes con anomalías detectadas
 * GET /api/gerencial/eventos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&sede=guatemala&tipo_evento=CRITICO
 * @param {Object} params - { desde, hasta, sede, tipo_evento, limite }
 */
export const getEventosOrdenes = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.desde) query.append("desde", params.desde);
  if (params.hasta) query.append("hasta", params.hasta);
  if (params.sede) query.append("sede", params.sede);
  if (params.tipo_evento) query.append("tipo_evento", params.tipo_evento);
  if (params.limite) query.append("limite", params.limite);
  const url = `/gerencial/eventos${query.toString() ? "?" + query.toString() : ""}`;
  return apiService["request"](url, { method: "GET" });
};