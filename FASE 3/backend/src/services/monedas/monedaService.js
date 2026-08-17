/**
 * @file monedaService.js
 * @description Servicio de monedas SEGÚN ENUNCIADO DEL PROYECTO LogiTrans
 *
 * El sistema maneja 4 monedas principales para operaciones multimoneda:
 * - GTQ (Quetzal) [ID: 1] → Guatemala
 * - USD (Dólar) [ID: 2] → USA / fallback internacional  
 * - HNL (Lempira) [ID: 6] → Honduras
 * - SVC (Colón) [ID: 7] → El Salvador
 *
 * NOTA: Otras monedas en BD (EUR, GBP, etc.) NO se usan en contratos de LogiTrans
 *
 * @module services/monedas/monedaService
 */

const Moneda = require('../../models/monedas/Moneda');

// Monedas permitidas para contratos según enunciado
const MONEDAS_PERMITIDAS = [1, 2, 6, 7]; // GTQ, USD, HNL, SVC

/**
 * Obtiene todas las monedas disponibles en el sistema
 * @async
 * @function obtenerMonedas
 * @returns {Promise<Array>} Lista de todas las monedas
 * @throws {Error} Si hay error al consultar
 */
const obtenerMonedas = async () => {
  return await Moneda.obtenerTodas();
};

/**
 * Obtiene una moneda por su ID
 * @async
 * @function obtenerMonedaById
 * @param {number} id - ID de la moneda
 * @returns {Promise<Object|null>} Datos de la moneda
 * @throws {Error} Si hay error al consultar
 */
const obtenerMonedaById = async (id) => {
  return await Moneda.obtenerPorId(id);
};

/**
 * Obtiene una moneda por su código (nombre)
 * @async
 * @function obtenerMonedaPorCodigo
 * @param {string} codigo - Código de moneda (GTQ, USD, HNL, SVC)
 * @returns {Promise<Object|null>} Datos de la moneda
 * @throws {Error} Si hay error al consultar
 */
const obtenerMonedaPorCodigo = async (codigo) => {
  return await Moneda.obtenerPorNombre(codigo);
};

/**
 * Convierte un monto entre dos monedas
 * @async
 * @function convertirMoneda
 * @param {number} monto - Monto a convertir
 * @param {number} monedaOrigenId - ID de la moneda de origen
 * @param {number} monedaDestinoId - ID de la moneda destino
 * @returns {Promise<Object>} Objeto con monto_original, moneda_origen, monto_convertido, moneda_destino, tipo_cambio
 * @throws {Error} Si las monedas no existen
 * @example
 * const resultado = await convertirMoneda(1000, 2, 1); // 1000 USD a GTQ
 */
const convertirMoneda = async (monto, monedaOrigenId, monedaDestinoId) => {
  const monedaOrigen = await Moneda.obtenerPorId(monedaOrigenId);
  const monedaDestino = await Moneda.obtenerPorId(monedaDestinoId);
  
  if (!monedaOrigen) {
    throw { 
      status: 404, 
      mensaje: `Moneda de origen (ID: ${monedaOrigenId}) no encontrada` 
    };
  }
  
  if (!monedaDestino) {
    throw { 
      status: 404, 
      mensaje: `Moneda destino (ID: ${monedaDestinoId}) no encontrada` 
    };
  }
  
  const montoConvertido = await Moneda.convertir(monto, monedaOrigenId, monedaDestinoId);
  
  // Calcular el tipo de cambio efectivo
  const tipoCambioEfectivo = montoConvertido / monto;
  
  return {
    monto_original: monto,
    moneda_origen: {
      id: monedaOrigen.id,
      nombre: monedaOrigen.nombre,
      simbolo: monedaOrigen.simbolo
    },
    monto_convertido: montoConvertido,
    moneda_destino: {
      id: monedaDestino.id,
      nombre: monedaDestino.nombre,
      simbolo: monedaDestino.simbolo
    },
    tipo_cambio_efectivo: Math.round(tipoCambioEfectivo * 10000) / 10000,
    fecha_conversion: new Date()
  };
};

/**
 * Convierte un monto de moneda de contrato a GTQ
 * Útil para operaciones financieras internas que se manejan en GTQ
 * @async
 * @function convertirAGTQ
 * @param {number} monto - Monto en la moneda del contrato
 * @param {number} monedaId - ID de la moneda del contrato
 * @returns {Promise<Object>} Objeto con montos en ambas monedas
 * @throws {Error} Si la moneda no existe o no es GTQ
 */
const convertirAGTQ = async (monto, monedaId) => {
  // Asumir que GTQ es ID 1
  const monedaGTQ = await Moneda.obtenerPorId(1);
  
  if (!monedaGTQ) {
    throw { status: 404, mensaje: 'Moneda base (GTQ) no encontrada en el sistema' };
  }
  
  if (monedaId === 1) {
    return {
      monto_original: monto,
      moneda: 'GTQ',
      monto_en_gtq: monto,
      requiere_conversion: false
    };
  }
  
  const montoEnGTQ = await Moneda.convertir(monto, monedaId, 1);
  
  return {
    monto_original: monto,
    moneda_origen_id: monedaId,
    monto_en_gtq: montoEnGTQ,
    requiere_conversion: true,
    fecha_conversion: new Date()
  };
};

/**
 * Convierte un monto de GTQ a otra moneda
 * @async
 * @function convertirDeGTQ
 * @param {number} monto - Monto en GTQ
 * @param {number} monedaDestinoId - ID de la moneda destino
 * @returns {Promise<Object>} Objeto con montos en ambas monedas
 * @throws {Error} Si la moneda destino no existe
 */
const convertirDeGTQ = async (monto, monedaDestinoId) => {
  const monedaDestino = await Moneda.obtenerPorId(monedaDestinoId);
  
  if (!monedaDestino) {
    throw { status: 404, mensaje: `Moneda destino (ID: ${monedaDestinoId}) no encontrada` };
  }
  
  if (monedaDestinoId === 1) {
    return {
      monto_original: monto,
      moneda: 'GTQ',
      monto_convertido: monto,
      requiere_conversion: false
    };
  }
  
  const montoConvertido = await Moneda.convertir(monto, 1, monedaDestinoId);
  
  return {
    monto_en_gtq: monto,
    moneda_destino: monedaDestino.nombre,
    monto_convertido: montoConvertido,
    requiere_conversion: true,
    simbolo_destino: monedaDestino.simbolo,
    fecha_conversion: new Date()
  };
};

/**
 * Obtiene los tipos de cambio respecto a GTQ de todas las monedas
 * @async
 * @function obtenerTodosTipoCambio
 * @returns {Promise<Array>} Array con tipos de cambio de cada moneda
 * @throws {Error} Si hay error al consultar
 */
const obtenerTodosTipoCambio = async () => {
  const monedas = await Moneda.obtenerTodas();
  
  return monedas.map(m => ({
    id: m.id,
    nombre: m.nombre,
    simbolo: m.simbolo,
    cambio: m.cambio,
    cambio_respecto_a: 'GTQ'
  }));
};

/**
 * Actualiza el tipo de cambio de una moneda
 * (generalmente se hace desde una API externa o admin)
 * @async
 * @function actualizarTipoCambio
 * @param {number} monedaId - ID de la moneda
 * @param {number} nuevoCambio - Nuevo tipo de cambio
 * @param {number} usuarioId - ID del usuario que realiza la actualización
 * @returns {Promise<Object>} Moneda actualizada con información de auditoría
 * @throws {Error} Si la moneda no existe
 */
const actualizarTipoCambio = async (monedaId, nuevoCambio, usuarioId) => {
  const monedaAnterior = await Moneda.obtenerPorId(monedaId);
  
  if (!monedaAnterior) {
    throw { status: 404, mensaje: `Moneda (ID: ${monedaId}) no encontrada` };
  }
  
  const monedaActualizada = await Moneda.actualizarTipoCambio(monedaId, nuevoCambio);
  
  return {
    moneda: monedaActualizada,
    cambio_anterior: monedaAnterior.cambio,
    cambio_nuevo: monedaActualizada.cambio,
    porcentaje_cambio: (((nuevoCambio - monedaAnterior.cambio) / monedaAnterior.cambio) * 100).toFixed(2),
    usuario_id: usuarioId,
    fecha_actualizacion: new Date()
  };
};

/**
 * Calcula el total de una factura en múltiples monedas
 * Útil para facturas multimoneda
 * @async
 * @function calcularTotalMultimoneda
 * @param {number} totalGTQ - Total en GTQ
 * @param {number} monedaFacturaId - ID de la moneda de la factura
 * @returns {Promise<Object>} Totales en GTQ y en la moneda de la factura
 * @throws {Error} Si la moneda no existe
 */
const calcularTotalMultimoneda = async (totalGTQ, monedaFacturaId) => {
  const moneda = await Moneda.obtenerPorId(monedaFacturaId);
  
  if (!moneda) {
    throw { status: 404, mensaje: `Moneda (ID: ${monedaFacturaId}) no encontrada` };
  }
  
  if (monedaFacturaId === 1) {
    // Ya está en GTQ
    return {
      total_en_gtq: totalGTQ,
      total_en_moneda_factura: totalGTQ,
      moneda_factura: 'GTQ',
      requiere_conversion: false
    };
  }
  
  const totalEnMonedaFactura = await Moneda.convertir(totalGTQ, 1, monedaFacturaId);
  
  return {
    total_en_gtq: totalGTQ,
    total_en_moneda_factura: totalEnMonedaFactura,
    moneda_factura: moneda.nombre,
    simbolo: moneda.simbolo,
    tipo_cambio_aplicado: moneda.cambio,
    requiere_conversion: true
  };
};

/**
 * Valida que una moneda exista en el sistema
 * @async
 * @function validarMoneda
 * @param {number} monedaId - ID de la moneda a validar
 * @returns {Promise<boolean>} true si la moneda existe
 * @throws {Error} Si la moneda no existe
 */
const validarMoneda = async (monedaId) => {
  const moneda = await Moneda.obtenerPorId(monedaId);
  
  if (!moneda) {
    throw { 
      status: 400, 
      mensaje: `Moneda inválida (ID: ${monedaId}). Use una de las monedas disponibles.` 
    };
  }
  
  return true;
};

module.exports = {
  obtenerMonedas,
  obtenerMonedaById,
  obtenerMonedaPorCodigo,
  convertirMoneda,
  convertirAGTQ,
  convertirDeGTQ,
  obtenerTodosTipoCambio,
  actualizarTipoCambio,
  calcularTotalMultimoneda,
  validarMoneda
};
