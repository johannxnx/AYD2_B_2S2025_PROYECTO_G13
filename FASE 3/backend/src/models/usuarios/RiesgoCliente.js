/**
 * @file RiesgoCliente.js
 * @description Modelo para la evaluación y gestión de riesgos de clientes.
 * Evalúa múltiples aspectos de riesgo: capacidad de pago, lavado de dinero, 
 * aduanas y mercancía para determinar si un cliente representa riesgo operativo.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Registra una evaluación de riesgo inicial para un cliente
 * @async
 * @function crearRiesgo
 * @param {Object} datos - Datos de la evaluación de riesgo
 * @param {number} datos.usuario_id - ID del cliente a evaluar
 * @param {string} datos.riesgo_capacidad_pago - Nivel de riesgo: 'ALTO', 'MEDIO', 'BAJO'
 * @param {string} datos.riesgo_lavado_dinero - Nivel de riesgo de LA/FT: 'ALTO', 'MEDIO', 'BAJO'
 * @param {string} datos.riesgo_aduanas - Nivel de riesgo aduanal: 'ALTO', 'MEDIO', 'BAJO'
 * @param {string} datos.riesgo_mercancia - Nivel de riesgo de mercancía: 'ALTO', 'MEDIO', 'BAJO'
 * @param {number} datos.evaluado_por - ID del usuario analista que realiza la evaluación
 * @returns {Promise<Object>} Registro de riesgo creado con timestamp de evaluación
 * @example
 * const riesgo = await crearRiesgo({
 *   usuario_id: 5,
 *   riesgo_capacidad_pago: 'MEDIO',
 *   riesgo_lavado_dinero: 'BAJO',
 *   riesgo_aduanas: 'ALTO',
 *   riesgo_mercancia: 'MEDIO',
 *   evaluado_por: 1
 * });
 */
const crearRiesgo = async (datos) => {
  const {
    usuario_id, riesgo_capacidad_pago, riesgo_lavado_dinero,
    riesgo_aduanas, riesgo_mercancia, evaluado_por
  } = datos;

  const pool = await getConnection();
  const result = await pool.request()
    .input('usuario_id',            sql.Int,      usuario_id)
    .input('riesgo_capacidad_pago', sql.NVarChar, riesgo_capacidad_pago)
    .input('riesgo_lavado_dinero',  sql.NVarChar, riesgo_lavado_dinero)
    .input('riesgo_aduanas',        sql.NVarChar, riesgo_aduanas)
    .input('riesgo_mercancia',      sql.NVarChar, riesgo_mercancia)
    .input('evaluado_por',          sql.Int,      evaluado_por)
    .query(`
      INSERT INTO riesgo_cliente
        (usuario_id, riesgo_capacidad_pago, riesgo_lavado_dinero,
         riesgo_aduanas, riesgo_mercancia, evaluado_por)
      OUTPUT INSERTED.*
      VALUES
        (@usuario_id, @riesgo_capacidad_pago, @riesgo_lavado_dinero,
         @riesgo_aduanas, @riesgo_mercancia, @evaluado_por)
    `);
  return result.recordset[0];
};

/**
 * Obtiene el perfil de riesgo actual de un cliente
 * @async
 * @function buscarPorCliente
 * @param {number} usuario_id - ID del cliente a consultar
 * @returns {Promise<Object|undefined>} Perfil de riesgo del cliente con:
 *   - {number} usuario_id - ID del cliente
 *   - {string} riesgo_capacidad_pago - Evaluación de capacidad de pago
 *   - {string} riesgo_lavado_dinero - Evaluación de riesgo LA/FT
 *   - {string} riesgo_aduanas - Evaluación de riesgo aduanal
 *   - {string} riesgo_mercancia - Evaluación de riesgo de mercancía
 *   - {Date} fecha_evaluacion - Fecha de la última evaluación
 *   - {string} evaluado_por_nombre - Nombre del analista que evaluó
 *   Retorna undefined si no existe evaluación para el cliente
 * @example
 * const perfil = await buscarPorCliente(5);
 * if (perfil && perfil.riesgo_capacidad_pago === 'ALTO') {
 *   // Tomar precauciones con este cliente
 * }
 */
const buscarPorCliente = async (usuario_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('usuario_id', sql.Int, usuario_id)
    .query(`
      SELECT r.*, u.nombre AS evaluado_por_nombre
      FROM riesgo_cliente r
      LEFT JOIN usuarios u ON u.id = r.evaluado_por
      WHERE r.usuario_id = @usuario_id
    `);
  return result.recordset[0];
};

/**
 * Actualiza la evaluación de riesgo de un cliente existente
 * @async
 * @function actualizarRiesgo
 * @param {number} usuario_id - ID del cliente a reevaluar
 * @param {Object} datos - Nuevos datos de evaluación
 * @param {string} datos.riesgo_capacidad_pago - Nuevo nivel de riesgo: 'ALTO', 'MEDIO', 'BAJO'
 * @param {string} datos.riesgo_lavado_dinero - Nuevo nivel de riesgo LA/FT
 * @param {string} datos.riesgo_aduanas - Nuevo nivel de riesgo aduanal
 * @param {string} datos.riesgo_mercancia - Nuevo nivel de riesgo de mercancía
 * @param {number} datos.evaluado_por - ID del nuevo analista que realiza la evaluación
 * @returns {Promise<Object>} Perfil de riesgo actualizado con nuevo timestamp
 * @example
 * const actualizado = await actualizarRiesgo(5, {
 *   riesgo_capacidad_pago: 'BAJO',
 *   riesgo_lavado_dinero: 'BAJO',
 *   riesgo_aduanas: 'MEDIO',
 *   riesgo_mercancia: 'BAJO',
 *   evaluado_por: 2
 * });
 */
const actualizarRiesgo = async (usuario_id, datos) => {
  const {
    riesgo_capacidad_pago, riesgo_lavado_dinero,
    riesgo_aduanas, riesgo_mercancia, evaluado_por
  } = datos;

  const pool = await getConnection();
  const result = await pool.request()
    .input('usuario_id',            sql.Int,      usuario_id)
    .input('riesgo_capacidad_pago', sql.NVarChar, riesgo_capacidad_pago)
    .input('riesgo_lavado_dinero',  sql.NVarChar, riesgo_lavado_dinero)
    .input('riesgo_aduanas',        sql.NVarChar, riesgo_aduanas)
    .input('riesgo_mercancia',      sql.NVarChar, riesgo_mercancia)
    .input('evaluado_por',          sql.Int,      evaluado_por)
    .query(`
      UPDATE riesgo_cliente
      SET riesgo_capacidad_pago = @riesgo_capacidad_pago,
          riesgo_lavado_dinero  = @riesgo_lavado_dinero,
          riesgo_aduanas        = @riesgo_aduanas,
          riesgo_mercancia      = @riesgo_mercancia,
          evaluado_por          = @evaluado_por,
          fecha_evaluacion      = GETDATE()
      OUTPUT INSERTED.*
      WHERE usuario_id = @usuario_id
    `);
  return result.recordset[0];
};

module.exports = { crearRiesgo, buscarPorCliente, actualizarRiesgo };