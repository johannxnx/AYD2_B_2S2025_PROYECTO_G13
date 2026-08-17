/**
 * @file Moneda.js
 * @description Modelo para la gestión de monedas y tipos de cambio
 * Soporta múltiples monedas: GTQ (Quetzal), USD (Dólar), HNL (Lempira), SVC (Colón)
 * @module models/monedas/Moneda
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Obtiene todas las monedas disponibles
 * @async
 * @function obtenerTodas
 * @returns {Promise<Array>} Lista de todas las monedas con sus tipos de cambio
 * @throws {Error} Si hay error en la consulta a BD
 */
const obtenerTodas = async () => {
  const pool = await getConnection();
  const result = await pool.request()
    .query(`
      SELECT 
        id, 
        nombre, 
        simbolo, 
        cambio,
        GETDATE() as fecha_consulta
      FROM monedas
      ORDER BY id
    `);
  return result.recordset;
};

/**
 * Obtiene una moneda por ID
 * @async
 * @function obtenerPorId
 * @param {number} id - ID de la moneda
 * @returns {Promise<Object>} Datos de la moneda o null si no existe
 * @throws {Error} Si hay error en la consulta
 */
const obtenerPorId = async (id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT 
        id, 
        nombre, 
        simbolo, 
        cambio
      FROM monedas
      WHERE id = @id
    `);
  return result.recordset[0] || null;
};

/**
 * Obtiene una moneda por su código (nombre)
 * @async
 * @function obtenerPorNombre
 * @param {string} nombre - Nombre/código de la moneda (GTQ, USD, HNL, SVC)
 * @returns {Promise<Object>} Datos de la moneda o null si no existe
 * @throws {Error} Si hay error en la consulta
 */
const obtenerPorNombre = async (nombre) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('nombre', sql.NVarChar, nombre)
    .query(`
      SELECT 
        id, 
        nombre, 
        simbolo, 
        cambio
      FROM monedas
      WHERE nombre = @nombre
    `);
  return result.recordset[0] || null;
};

/**
 * Crea una nueva moneda
 * @async
 * @function crear
 * @param {Object} datos - Datos de la nueva moneda
 * @param {string} datos.nombre - Código de moneda (GTQ, USD, HNL, SVC)
 * @param {string} datos.simbolo - Símbolo de la moneda (Q, $, L, ₡)
 * @param {number} datos.cambio - Tipo de cambio respecto a GTQ
 * @returns {Promise<Object>} Moneda creada con su ID
 * @throws {Error} Si hay error al insertar
 * @example
 * const moneda = await crear({
 *   nombre: 'USD',
 *   simbolo: '$',
 *   cambio: 7.50
 * });
 */
const crear = async (datos) => {
  const { nombre, simbolo, cambio } = datos;
  
  const pool = await getConnection();
  const result = await pool.request()
    .input('nombre', sql.NVarChar, nombre)
    .input('simbolo', sql.NVarChar, simbolo)
    .input('cambio', sql.Decimal(10, 4), cambio)
    .query(`
      INSERT INTO monedas (nombre, simbolo, cambio)
      OUTPUT INSERTED.*
      VALUES (@nombre, @simbolo, @cambio)
    `);
  
  return result.recordset[0];
};

/**
 * Actualiza el tipo de cambio de una moneda
 * @async
 * @function actualizarTipoCambio
 * @param {number} id - ID de la moneda
 * @param {number} nuevoCambio - Nuevo tipo de cambio
 * @returns {Promise<Object>} Moneda actualizada
 * @throws {Error} Si la moneda no existe o hay error en la actualización
 * @example
 * const moneda = await actualizarTipoCambio(2, 8.25);
 */
const actualizarTipoCambio = async (id, nuevoCambio) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('nuevoCambio', sql.Decimal(10, 4), nuevoCambio)
    .query(`
      UPDATE monedas
      SET cambio = @nuevoCambio
      WHERE id = @id
      
      SELECT * FROM monedas WHERE id = @id
    `);
  
  if (result.recordset.length === 0) {
    throw { status: 404, mensaje: 'Moneda no encontrada' };
  }
  
  return result.recordset[0];
};

/**
 * Obtiene el tipo de cambio actual de una moneda
 * @async
 * @function obtenerTipoCambio
 * @param {number} id - ID de la moneda
 * @returns {Promise<number>} Tipo de cambio respecto a GTQ
 * @throws {Error} Si la moneda no existe
 * @example
 * const tipoCambio = await obtenerTipoCambio(2); // para USD
 */
const obtenerTipoCambio = async (id) => {
  const moneda = await obtenerPorId(id);
  
  if (!moneda) {
    throw { status: 404, mensaje: 'Moneda no encontrada' };
  }
  
  return moneda.cambio;
};

/**
 * Convierte un monto de una moneda a otra
 * @async
 * @function convertir
 * @param {number} monto - Monto a convertir
 * @param {number} monedaOrigenId - ID de la moneda de origen
 * @param {number} monedaDestinoId - ID de la moneda destino
 * @returns {Promise<number>} Monto convertido
 * @throws {Error} Si alguna moneda no existe
 * @example
 * const resultado = await convertir(100, 2, 1); // 100 USD a GTQ
 */
const convertir = async (monto, monedaOrigenId, monedaDestinoId) => {
  const monedaOrigen = await obtenerPorId(monedaOrigenId);
  const monedaDestino = await obtenerPorId(monedaDestinoId);
  
  if (!monedaOrigen) {
    throw { status: 404, mensaje: `Moneda de origen (ID: ${monedaOrigenId}) no encontrada` };
  }
  if (!monedaDestino) {
    throw { status: 404, mensaje: `Moneda destino (ID: ${monedaDestinoId}) no encontrada` };
  }
  
  // Si es la misma moneda, devolver el monto igual
  if (monedaOrigenId === monedaDestinoId) {
    return monto;
  }
  
  // Asumir que GTQ es la moneda base (id = 1)
  // Fórmula: monto_en_origen / cambio_origen * cambio_destino
  const montoEnGTQ = (monto / monedaOrigen.cambio);
  const montoEnDestino = montoEnGTQ * monedaDestino.cambio;
  
  return Math.round(montoEnDestino * 100) / 100; // Redondear a 2 decimales
};

/**
 * Obtiene todas las monedas con sus tipos de cambio formateados
 * @async
 * @function obtenerMonedasyTipoCambio
 * @returns {Promise<Array>} Array con { id, nombre, simbolo, cambio }
 * @throws {Error} Si hay error en la consulta
 */
const obtenerMonedasyTipoCambio = async () => {
  return await obtenerTodas();
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerPorNombre,
  crear,
  actualizarTipoCambio,
  obtenerTipoCambio,
  convertir,
  obtenerMonedasyTipoCambio
};
