/**
 * @file conversionMonedas.js
 * @description Helper para conversión de monedas según enunciado LogiTrans
 * 
 * Las 4 monedas del proyecto son:
 * - GTQ (Quetzal) [ID: 1] - MONEDA BASE
 * - USD (Dólar) [ID: 2]
 * - HNL (Lempira) [ID: 6]
 * - SVC (Colón) [ID: 7]
 *
 * NOTA: Los tipos de cambio están en la tabla `monedas` (cambio = tasa respecto a GTQ)
 * 
 * @module utils/conversionMonedas
 */

const Moneda = require('../models/monedas/Moneda');

// IDs de las 4 monedas del proyecto
const MONEDAS_PROYECTO = {
  GTQ: 1,
  USD: 2,
  HNL: 6,
  SVC: 7
};

/**
 * Convierte un monto de una moneda a otra
 * @async
 * @param {number} monto - Monto a convertir
 * @param {number} monedaOrigenId - ID moneda origen (1=GTQ, 2=USD, 6=HNL, 7=SVC)
 * @param {number} monedaDestinoId - ID moneda destino
 * @returns {Promise<number>} Monto convertido
 * @throws {Error} Si las monedas no existen o son inválidas
 * @example
 * // Convertir 100 USD a GTQ
 * const resultado = await convertirMoneda(100, 2, 1);
 * console.log(resultado); // ej: 775 (100 USD * 7.75 tipo de cambio)
 */
const convertirMoneda = async (monto, monedaOrigenId, monedaDestinoId) => {
  // Si son la misma moneda, retornar sin convertir
  if (monedaOrigenId === monedaDestinoId) return monto;

  // Obtener tipos de cambio
  const monedaOrigen = await Moneda.obtenerPorId(monedaOrigenId);
  const monedaDestino = await Moneda.obtenerPorId(monedaDestinoId);

  if (!monedaOrigen || !monedaDestino) {
    throw new Error(`Moneda inválida: origen=${monedaOrigenId}, destino=${monedaDestinoId}`);
  }

  // GTQ es la moneda base (tipo de cambio = 1.0000)
  // Los tipos de cambio están expresados respecto a GTQ

  // Paso 1: Convertir moneda origen a GTQ
  const montoEnGTQ = monto / monedaOrigen.cambio;

  // Paso 2: Convertir GTQ a moneda destino
  const montoEnDestino = montoEnGTQ * monedaDestino.cambio;

  return Math.round(montoEnDestino * 100) / 100; // Redondear a 2 decimales
};

/**
 * Valida si una moneda es una de las 4 del proyecto
 * @param {number} monedaId - ID de la moneda
 * @returns {boolean} True si es moneda válida, false si no
 */
const esMonedaValida = (monedaId) => {
  return Object.values(MONEDAS_PROYECTO).includes(monedaId);
};

/**
 * Obtiene el nombre código ISO de una moneda
 * @param {number} monedaId - ID de la moneda
 * @returns {string|null} Código ISO (GTQ, USD, HNL, SVC) o null si no existe
 */
const obtenerCodigoMoneda = (monedaId) => {
  for (const [codigo, id] of Object.entries(MONEDAS_PROYECTO)) {
    if (id === monedaId) return codigo;
  }
  return null;
};

/**
 * Obtiene el ID de moneda por su código ISO
 * @param {string} codigo - Código ISO (GTQ, USD, HNL, SVC)
 * @returns {number|null} ID de la moneda o null si no existe
 */
const obtenerIdMonedaPorCodigo = (codigo) => {
  return MONEDAS_PROYECTO[codigo.toUpperCase()] || null;
};

module.exports = {
  MONEDAS_PROYECTO,
  convertirMoneda,
  esMonedaValida,
  obtenerCodigoMoneda,
  obtenerIdMonedaPorCodigo
};
