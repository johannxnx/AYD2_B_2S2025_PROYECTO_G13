/**
 * @file Tarifario.js
 * @description Modelo para la gestión de tarifarios de transporte.
 * Contiene operaciones CRUD para consultar, actualizar y registrar tarifas
 * según el tipo de unidad de transporte disponible.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Lista todos los tarifarios activos con información del usuario que los actualizó
 * @async
 * @function listarTarifario
 * @returns {Promise<Array>} Array de objetos tarifario con propiedades:
 *   - {number} id - Identificador único del tarifario
 *   - {string} tipo_unidad - Tipo de unidad de transporte (ej: "Moto", "Auto", "Camión")
 *   - {number} limite_peso_ton - Límite de peso en toneladas que puede transportar
 *   - {number} costo_base_km - Costo base por kilómetro en unidades monetarias
 *   - {boolean} activo - Estado del tarifario (1 = activo, 0 = inactivo)
 *   - {Date} fecha_actualizacion - Fecha de la última actualización
 *   - {string} actualizado_por_nombre - Nombre del usuario que realizó la última actualización
 * @example
 * const tarifarios = await listarTarifario();
 * console.log(tarifarios[0].tipo_unidad); // "Moto"
 */
const listarTarifario = async () => {
  const pool = await getConnection();
  const result = await pool.request()
    .query(`
      SELECT t.id, t.tipo_unidad, t.limite_peso_ton,
             t.costo_base_km, t.activo, t.fecha_actualizacion,
             u.nombre AS actualizado_por_nombre
      FROM tarifario t
      LEFT JOIN usuarios u ON u.id = t.actualizado_por
      WHERE t.activo = 1
      ORDER BY t.tipo_unidad
    `);
  return result.recordset;
};

/**
 * Busca un tarifario específico por tipo de unidad de transporte
 * @async
 * @function buscarPorTipo
 * @param {string} tipo_unidad - Tipo de unidad a buscar (ej: "Moto", "Auto", "Camión")
 * @returns {Promise<Object|undefined>} Objeto tarifario con propiedades:
 *   - {number} id - Identificador único del tarifario
 *   - {string} tipo_unidad - Tipo de unidad de transporte
 *   - {number} limite_peso_ton - Límite de peso en toneladas
 *   - {number} costo_base_km - Costo base por kilómetro
 *   - {boolean} activo - Estado del tarifario
 *   Devuelve undefined si no encuentra coincidencias
 * @example
 * const tarifa = await buscarPorTipo("Moto");
 * if (tarifa) {
 *   console.log(tarifa.costo_base_km); // 2.5
 * }
 */
const buscarPorTipo = async (tipo_unidad) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('tipo_unidad', sql.NVarChar, tipo_unidad)
    .query(`
      SELECT id, tipo_unidad, limite_peso_ton, costo_base_km, activo
      FROM tarifario
      WHERE tipo_unidad = @tipo_unidad AND activo = 1
    `);
  return result.recordset[0];
};

/**
 * Actualiza un tarifario existente o crea uno nuevo si no existe.
 * Utiliza la operación MERGE de SQL Server para manejar ambos casos.
 * @async
 * @function actualizarTarifa
 * @param {string} tipo_unidad - Tipo de unidad de transporte a actualizar/crear
 * @param {Object} datos - Objeto con los datos a actualizar
 * @param {number} datos.limite_peso_ton - Nuevo límite de peso en toneladas (máx 99.99)
 * @param {number} datos.costo_base_km - Nuevo costo base por kilómetro (máx 9999.99)
 * @param {number} datos.actualizado_por - ID del usuario que realiza la actualización
 * @returns {Promise<Object>} Objeto tarifario actualizado/creado con:
 *   - {number} id - Identificador único del tarifario
 *   - {string} tipo_unidad - Tipo de unidad
 *   - {number} limite_peso_ton - Límite de peso actualizado
 *   - {number} costo_base_km - Costo actualizado
 *   - {number} actualizado_por - ID del usuario que realizó la actualización
 *   - {Date} fecha_actualizacion - Timestamp de la actualización (GETDATE())
 * @example
 * const nuevoTarifa = await actualizarTarifa("Moto", {
 *   limite_peso_ton: 0.5,
 *   costo_base_km: 2.50,
 *   actualizado_por: 1
 * });
 * console.log(nuevoTarifa.id); // ID generado o existente
 */
const actualizarTarifa = async (tipo_unidad, datos) => {
  const { limite_peso_ton, costo_base_km, actualizado_por } = datos;
  const pool = await getConnection();
  const result = await pool.request()
    .input('tipo_unidad',     sql.NVarChar,      tipo_unidad)
    .input('limite_peso_ton', sql.Decimal(5,2),  limite_peso_ton)
    .input('costo_base_km',   sql.Decimal(10,2), costo_base_km)
    .input('actualizado_por', sql.Int,           actualizado_por)
    .query(`
      MERGE tarifario AS target
      USING (SELECT @tipo_unidad AS tipo_unidad) AS source
      ON target.tipo_unidad = source.tipo_unidad
      WHEN MATCHED THEN
        UPDATE SET
          limite_peso_ton     = @limite_peso_ton,
          costo_base_km       = @costo_base_km,
          actualizado_por     = @actualizado_por,
          fecha_actualizacion = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (tipo_unidad, limite_peso_ton, costo_base_km, actualizado_por)
        VALUES (@tipo_unidad, @limite_peso_ton, @costo_base_km, @actualizado_por)
      OUTPUT INSERTED.*;
    `);
  return result.recordset[0];
};

module.exports = { listarTarifario, buscarPorTipo, actualizarTarifa };