/**
 * @file RutaAutorizada.js
 * @description Modelo para la gestión de rutas autorizadas en contratos.
 * Define y controla las rutas de transporte permitidas para cada cliente.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Registra una nueva ruta autorizada para un contrato
 * @async
 * @function crearRuta
 * @param {Object} datos - Datos de la ruta
 * @param {number} datos.contrato_id - ID del contrato
 * @param {string} datos.origen - Ubicación de origen
 * @param {string} datos.destino - Ubicación de destino
 * @param {number} [datos.distancia_km] - Distancia en kilómetros
 * @param {string} [datos.tipo_carga] - Tipo de carga permitida
 * @returns {Promise<Object>} Ruta creada
 * @example
 * const ruta = await crearRuta({
 *   contrato_id: 12,
 *   origen: 'Ciudad de Guatemala',
 *   destino: 'Antigua',
 *   distancia_km: 45.5,
 *   tipo_carga: 'General'
 * });
 */
const crearRuta = async (datos) => {
  const { contrato_id, origen, destino, distancia_km, tipo_carga } = datos;
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id',  sql.Int,          contrato_id)
    .input('origen',       sql.NVarChar,     origen)
    .input('destino',      sql.NVarChar,     destino)
    .input('distancia_km', sql.Decimal(10,2), distancia_km || null)
    .input('tipo_carga',   sql.NVarChar,     tipo_carga || null)
    .query(`
      INSERT INTO rutas_autorizadas (contrato_id, origen, destino, distancia_km, tipo_carga)
      OUTPUT INSERTED.*
      VALUES (@contrato_id, @origen, @destino, @distancia_km, @tipo_carga)
    `);
  return result.recordset[0];
};

/**
 * Lista todas las rutas autorizadas de un contrato
 * @async
 * @function listarPorContrato
 * @param {number} contrato_id - ID del contrato
 * @returns {Promise<Array>} Array de rutas ordenadas por origen y destino:
 *   - {number} id - ID de la ruta
 *   - {number} contrato_id - ID del contrato
 *   - {string} origen - Ubicación de partida
 *   - {string} destino - Ubicación de llegada
 *   - {number} distancia_km - Distancia en kilómetros
 *   - {string} tipo_carga - Tipo de carga permitida
 *   - {boolean} activa - Estado de la ruta (activa/inactiva)
 * @example
 * const rutas = await listarPorContrato(12);
 */
const listarPorContrato = async (contrato_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int, contrato_id)
    .query(`
      SELECT id, contrato_id, origen, destino, distancia_km, tipo_carga, activa
      FROM rutas_autorizadas
      WHERE contrato_id = @contrato_id
      ORDER BY origen, destino
    `);
  return result.recordset;
};

/**
 * Verifica si existe una ruta autorizada para un origen-destino específico
 * @async
 * @function verificarRuta
 * @param {number} contrato_id - ID del contrato
 * @param {string} origen - Ubicación de origen
 * @param {string} destino - Ubicación de destino
 * @returns {Promise<Object|undefined>} Ruta encontrada o undefined si no existe ruta activa
 *   - {number} id - ID de la ruta
 *   - {string} origen - Origen
 *   - {string} destino - Destino
 *   - {number} distancia_km - Distancia en km
 *   - {string} tipo_carga - Tipo de carga permitida
 * @example
 * const autorizada = await verificarRuta(12, 'CGU', 'Antigua');
 * if (autorizada) {
 *   console.log('Ruta permitida');
 * }
 */
const verificarRuta = async (contrato_id, origen, destino) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int,      contrato_id)
    .input('origen',      sql.NVarChar, origen)
    .input('destino',     sql.NVarChar, destino)
    .query(`
      SELECT id, origen, destino, distancia_km, tipo_carga
      FROM rutas_autorizadas
      WHERE contrato_id = @contrato_id
        AND origen      = @origen
        AND destino     = @destino
        AND activa      = 1
    `);
  return result.recordset[0];
};

/**
 * Cambia el estado de activación de una ruta
 * @async
 * @function cambiarEstadoRuta
 * @param {number} id - ID de la ruta
 * @param {boolean} activa - Nuevo estado (true = activa, false = inactiva)
 * @returns {Promise<Object>} Ruta actualizada
 * @example
 * const modificada = await cambiarEstadoRuta(8, false);
 */
const cambiarEstadoRuta = async (id, activa) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id',     sql.Int, id)
    .input('activa', sql.Bit, activa)
    .query(`
      UPDATE rutas_autorizadas
      SET activa = @activa
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

/**
 * Elimina una ruta autorizada del sistema
 * @async
 * @function eliminarRuta
 * @param {number} id - ID de la ruta a eliminar
 * @returns {Promise<Object>} Ruta eliminada
 * @example
 * const eliminada = await eliminarRuta(8);
 */
const eliminarRuta = async (id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM rutas_autorizadas
      OUTPUT DELETED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

module.exports = {
  crearRuta,
  listarPorContrato,
  verificarRuta,
  cambiarEstadoRuta,
  eliminarRuta
};