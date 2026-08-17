/**
 * @file monedaPorPais.js
 * @description SEGÚN ENUNCIADO DEL PROYECTO LogiTrans:
 * 
 * Mapeo de países a monedas para SUGERENCIAS automáticas
 * Las 4 monedas del proyecto son: GTQ, USD, HNL, SVC
 *
 * FLUJO DE SELECCIÓN DE MONEDA EN CONTRATOS:
 * 1. Si usuario envía moneda_id → usar esa moneda (override)
 * 2. Si NO envía moneda_id → SUGERIR basada en país del cliente
 * 3. Si país es desconocido → DEFAULT a GTQ (Quetzal)
 *
 * La moneda se PACTA al crear el contrato y se usa en todas las órdenes posteriores
 * 
 * @module utils/monedaPorPais
 */

const PAIS_MONEDA_MAP = {
  // Según enunciado del proyecto LogiTrans: GTQ, USD, HNL, SVC
  // Centro América
  'GUATEMALA': 1,        // GTQ - QUETZAL
  'HONDURAS': 6,         // HNL - LEMPIRA
  'EL SALVADOR': 7,      // SVC - COLÓN (moneda local de El Salvador)
  
  // USA - respaldo
  'USA': 2,              // USD - DÓLAR
  'UNITED STATES': 2,
};

/**
 * Obtiene la moneda recomendada basada en el país del cliente
 * @param {string|null|undefined} pais - País del cliente (puede tener espacios/mayúsculas)
 * @returns {number} ID de la moneda (default: 1 = QUETZAL si no encuentra coincidencia)
 */
const obtenerMonedaPorPais = (pais) => {
  if (!pais) return 1; // Default QUETZAL

  // Normalizar entrada: trim y mayúsculas para búsqueda
  const paisNormalizado = pais.trim().toUpperCase();

  // Buscar coincidencia exacta
  if (PAIS_MONEDA_MAP[paisNormalizado]) {
    return PAIS_MONEDA_MAP[paisNormalizado];
  }

  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(PAIS_MONEDA_MAP)) {
    if (paisNormalizado.includes(key.toUpperCase()) || key.toUpperCase().includes(paisNormalizado)) {
      return value;
    }
  }

  // Default a QUETZAL si no encuentra
  return 1;
};

/**
 * Obtiene el nombre de la moneda asociada al país
 * SOLO LAS 4 MONEDAS DEL PROYECTO: GTQ, USD, HNL, SVC
 * @param {string|null|undefined} pais - País del cliente
 * @returns {string} Nombre de la moneda (ej: "QUETZAL", "LEMPIRA", "COLÓN")
 */
const obtenerNombreMonedaPorPais = (pais) => {
  const monedaId = obtenerMonedaPorPais(pais);
  const monedas = {
    1: 'QUETZAL',      // GTQ - Guatemala
    2: 'DÓLAR',        // USD - USA
    6: 'LEMPIRA',      // HNL - Honduras
    7: 'COLÓN'         // SVC - El Salvador
  };
  return monedas[monedaId] || 'QUETZAL';
};

/**
 * Obtiene el símbolo de la moneda asociada al país
 * SOLO LAS 4 MONEDAS DEL PROYECTO: GTQ, USD, HNL, SVC
 * @param {string|null|undefined} pais - País del cliente
 * @returns {string} Símbolo (ej: "Q", "$", "L", "₡")
 */
const obtenerSimboloMonedaPorPais = (pais) => {
  const monedaId = obtenerMonedaPorPais(pais);
  const simbolos = {
    1: 'Q',    // GTQ
    2: '$',    // USD
    6: 'L',    // HNL
    7: '₡'     // SVC
  };
  return simbolos[monedaId] || 'Q';
};

/**
 * Obtiene información completa de la moneda sugerida por país
 * ÚTIL PARA: Validar y mostrar información de la moneda seleccionada/sugerida
 * SOLO LAS 4 MONEDAS DEL PROYECTO: GTQ, USD, HNL, SVC
 * @param {string|null|undefined} pais - País del cliente
 * @returns {Object} Objeto con { id, nombre, simbolo, codigo_iso, pais }
 * @example
 * const info = obtenerInfoMonedaPorPais('HONDURAS');
 * // Retorna: { id: 6, nombre: 'LEMPIRA', simbolo: 'L', codigo_iso: 'HNL', pais: 'Honduras' }
 */
const obtenerInfoMonedaPorPais = (pais) => {
  const monedaId = obtenerMonedaPorPais(pais);
  
  // SOLO LAS 4 MONEDAS VÁLIDAS DEL PROYECTO
  const mapeoCompleto = {
    1: { id: 1, nombre: 'QUETZAL', simbolo: 'Q', codigo_iso: 'GTQ', pais: 'Guatemala' },
    2: { id: 2, nombre: 'DÓLAR', simbolo: '$', codigo_iso: 'USD', pais: 'USA' },
    6: { id: 6, nombre: 'LEMPIRA', simbolo: 'L', codigo_iso: 'HNL', pais: 'Honduras' },
    7: { id: 7, nombre: 'COLÓN', simbolo: '₡', codigo_iso: 'SVC', pais: 'El Salvador' }
  };
  
  return mapeoCompleto[monedaId] || mapeoCompleto[1]; // Default QUETZAL
};

/**
 * Valida si una moneda es una de las 4 permitidas en LogiTrans (GTQ, USD, HNL, SVC)
 * @param {number} monedaId - ID de la moneda
 * @returns {boolean} True si es moneda válida del proyecto
 */
const esMonedaProyectoValida = (monedaId) => {
  return [1, 2, 6, 7].includes(monedaId);
};

module.exports = {
  PAIS_MONEDA_MAP,
  obtenerMonedaPorPais,
  obtenerNombreMonedaPorPais,
  obtenerSimboloMonedaPorPais,
  obtenerInfoMonedaPorPais,
  esMonedaProyectoValida
};
