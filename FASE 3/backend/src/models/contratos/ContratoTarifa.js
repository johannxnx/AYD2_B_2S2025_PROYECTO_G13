/**
 * @file ContratoTarifa.js
 * @description Modelo para la gestión de tarifas negociadas en contratos.
 * Permite asociar tarifarios con contratos con costos específicos negociados.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Crea una relación entre un contrato y un tarifario con costo negociado
 * @async
 * @function crearContratoTarifa
 * @param {Object} datos - Datos de la relación
 * @param {number} datos.contrato_id - ID del contrato
 * @param {number} datos.tarifario_id - ID del tarifario/tipo de unidad
 * @param {number} datos.costo_km_negociado - Costo por kilómetro pactado (máx 9999.99)
 * @returns {Promise<Object>} Registro de contrato_tarifa creado
 * @example
 * const rel = await crearContratoTarifa({
 *   contrato_id: 12,
 *   tarifario_id: 2,
 *   costo_km_negociado: 2.25
 * });
 */
const crearContratoTarifa = async (datos) => {
  const { contrato_id, tarifario_id, costo_km_negociado } = datos;
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id',        sql.Int,          contrato_id)
    .input('tarifario_id',       sql.Int,          tarifario_id)
    .input('costo_km_negociado', sql.Decimal(10,2), costo_km_negociado)
    .query(`
      INSERT INTO contrato_tarifas (contrato_id, tarifario_id, costo_km_negociado)
      OUTPUT INSERTED.*
      VALUES (@contrato_id, @tarifario_id, @costo_km_negociado)
    `);
  return result.recordset[0];
};

/**
 * Lista todas las tarifas negociadas de un contrato específico
 * @async
 * @function listarPorContrato
 * @param {number} contrato_id - ID del contrato
 * @returns {Promise<Array>} Array de tarifas con propiedades:
 *   - {number} id - ID del registro
 *   - {number} contrato_id - ID del contrato
 *   - {number} costo_km_negociado - Costo por km pactado
 *   - {string} tipo_unidad - Tipo de unidad (Moto, Auto, Camión)
 *   - {number} limite_peso_ton - Límite de peso de la unidad
 *   - {number} costo_base_km - Costo base del tarifario
 * @example
 * const tarifas = await listarPorContrato(12);
 */
const listarPorContrato = async (contrato_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int, contrato_id)
    .query(`
      SELECT ct.id, ct.contrato_id, ct.costo_km_negociado,
             t.tipo_unidad, t.limite_peso_ton, t.costo_base_km
      FROM contrato_tarifas ct
      INNER JOIN tarifario t ON t.id = ct.tarifario_id
      WHERE ct.contrato_id = @contrato_id
      ORDER BY t.tipo_unidad
    `);
  return result.recordset;
};

/**
 * Busca la tarifa negociada de un contrato para un tipo de unidad específico
 * @async
 * @function buscarPorContratoYTipo
 * @param {number} contrato_id - ID del contrato
 * @param {string} tipo_unidad - Tipo de unidad (ej: "Moto", "Auto")
 * @returns {Promise<Object|undefined>} Tarifa negociada o undefined si no existe
 *   - {number} id - ID del registro
 *   - {number} costo_km_negociado - Costo por km pactado
 *   - {string} tipo_unidad - Tipo de unidad
 *   - {number} limite_peso_ton - Límite de peso
 *   - {number} costo_base_km - Costo base del tarifario
 * @example
 * const tarifa = await buscarPorContratoYTipo(12, "Moto");
 */
const buscarPorContratoYTipo = async (contrato_id, tipo_unidad) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int,      contrato_id)
    .input('tipo_unidad', sql.NVarChar, tipo_unidad)
    .query(`
      SELECT ct.id, ct.costo_km_negociado,
             t.tipo_unidad, t.limite_peso_ton, t.costo_base_km
      FROM contrato_tarifas ct
      INNER JOIN tarifario t ON t.id = ct.tarifario_id
      WHERE ct.contrato_id = @contrato_id
        AND t.tipo_unidad  = @tipo_unidad
    `);
  return result.recordset[0];
};

/**
 * Actualiza el costo negociado de una tarifa en un contrato
 * @async
 * @function actualizarContratoTarifa
 * @param {number} contrato_id - ID del contrato
 * @param {number} tarifario_id - ID del tarifario
 * @param {number} costo_km_negociado - Nuevo costo por km
 * @returns {Promise<Object>} Registro actualizado
 * @example
 * const actualizado = await actualizarContratoTarifa(12, 2, 2.50);
 */
const actualizarContratoTarifa = async (contrato_id, tarifario_id, costo_km_negociado) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id',        sql.Int,          contrato_id)
    .input('tarifario_id',       sql.Int,          tarifario_id)
    .input('costo_km_negociado', sql.Decimal(10,2), costo_km_negociado)
    .query(`
      UPDATE contrato_tarifas
      SET costo_km_negociado = @costo_km_negociado
      OUTPUT INSERTED.*
      WHERE contrato_id = @contrato_id AND tarifario_id = @tarifario_id
    `);
  return result.recordset[0];
};

/**
 * Elimina la asociación entre un contrato y una tarifa
 * @async
 * @function eliminarContratoTarifa
 * @param {number} contrato_id - ID del contrato
 * @param {number} tarifario_id - ID del tarifario a eliminar
 * @returns {Promise<Object>} Registro eliminado
 * @example
 * const eliminado = await eliminarContratoTarifa(12, 2);
 */
const eliminarContratoTarifa = async (contrato_id, tarifario_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id',  sql.Int, contrato_id)
    .input('tarifario_id', sql.Int, tarifario_id)
    .query(`
      DELETE FROM contrato_tarifas
      OUTPUT DELETED.*
      WHERE contrato_id = @contrato_id AND tarifario_id = @tarifario_id
    `);
  return result.recordset[0];
};

module.exports = {
  crearContratoTarifa,
  listarPorContrato,
  buscarPorContratoYTipo,
  actualizarContratoTarifa,
  eliminarContratoTarifa
};