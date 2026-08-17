/**
 * @file Descuento.js
 * @description Modelo para la gestión de descuentos en contratos.
 * Permite aplicar descuentos porcentuales a tipos de unidad específicos en contratos.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Crea un nuevo descuento para un tipo de unidad en un contrato
 * @async
 * @function crearDescuento
 * @param {Object} datos - Datos del descuento
 * @param {number} datos.contrato_id - ID del contrato
 * @param {string} datos.tipo_unidad - Tipo de unidad (ej: "Moto", "Auto")
 * @param {number} datos.porcentaje_descuento - Porcentaje de descuento (0-99.99)
 * @param {number} datos.autorizado_por - ID del usuario que autoriza
 * @param {string} [datos.observacion] - Observaciones opcionales del descuento
 * @returns {Promise<Object>} Registro de descuento creado
 * @example
 * const desc = await crearDescuento({
 *   contrato_id: 12,
 *   tipo_unidad: 'Moto',
 *   porcentaje_descuento: 5.00,
 *   autorizado_por: 1,
 *   observacion: 'Descuento por volumen'
 * });
 */
const crearDescuento = async (datos) => {
  const { contrato_id, tipo_unidad, porcentaje_descuento, autorizado_por, observacion } = datos;
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id',          sql.Int,         contrato_id)
    .input('tipo_unidad',          sql.NVarChar,    tipo_unidad)
    .input('porcentaje_descuento', sql.Decimal(5,2), porcentaje_descuento)
    .input('autorizado_por',       sql.Int,         autorizado_por)
    .input('observacion',          sql.NVarChar,    observacion || null)
    .query(`
      INSERT INTO descuentos_contrato
        (contrato_id, tipo_unidad, porcentaje_descuento, autorizado_por, observacion)
      OUTPUT INSERTED.*
      VALUES
        (@contrato_id, @tipo_unidad, @porcentaje_descuento, @autorizado_por, @observacion)
    `);
  return result.recordset[0];
};

/**
 * Lista todos los descuentos aplicados a un contrato
 * @async
 * @function listarPorContrato
 * @param {number} contrato_id - ID del contrato
 * @returns {Promise<Array>} Array de descuentos con propiedades:
 *   - {number} id - ID del descuento
 *   - {string} tipo_unidad - Tipo de unidad
 *   - {number} porcentaje_descuento - Porcentaje de descuento
 *   - {string} observacion - Observaciones
 *   - {Date} fecha_autorizacion - Fecha de autorización
 *   - {string} autorizado_por_nombre - Nombre del usuario que autorizó
 * @example
 * const descuentos = await listarPorContrato(12);
 */
const listarPorContrato = async (contrato_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int, contrato_id)
    .query(`
      SELECT d.*, u.nombre AS autorizado_por_nombre
      FROM descuentos_contrato d
      LEFT JOIN usuarios u ON u.id = d.autorizado_por
      WHERE d.contrato_id = @contrato_id
      ORDER BY d.tipo_unidad
    `);
  return result.recordset;
};

/**
 * Busca el descuento aplicado a un tipo de unidad específico en un contrato
 * @async
 * @function buscarPorContratoYTipo
 * @param {number} contrato_id - ID del contrato
 * @param {string} tipo_unidad - Tipo de unidad a buscar
 * @returns {Promise<Object|undefined>} Descuento encontrado o undefined
 *   - {number} id - ID del descuento
 *   - {string} tipo_unidad - Tipo de unidad
 *   - {number} porcentaje_descuento - Porcentaje del descuento
 *   - {string} observacion - Observaciones
 *   - {Date} fecha_autorizacion - Fecha de autorización
 *   - {string} autorizado_por_nombre - Nombre del autorizador
 * @example
 * const desc = await buscarPorContratoYTipo(12, 'Moto');
 */
const buscarPorContratoYTipo = async (contrato_id, tipo_unidad) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int,      contrato_id)
    .input('tipo_unidad', sql.NVarChar, tipo_unidad)
    .query(`
      SELECT d.id, d.tipo_unidad, d.porcentaje_descuento,
             d.observacion, d.fecha_autorizacion,
             u.nombre AS autorizado_por_nombre
      FROM descuentos_contrato d
      LEFT JOIN usuarios u ON u.id = d.autorizado_por
      WHERE d.contrato_id = @contrato_id
        AND d.tipo_unidad = @tipo_unidad
    `);
  return result.recordset[0];
};

/**
 * Actualiza el porcentaje y detalles de un descuento existente
 * @async
 * @function actualizarDescuento
 * @param {number} id - ID del descuento a actualizar
 * @param {Object} datos - Datos a actualizar
 * @param {number} datos.porcentaje_descuento - Nuevo porcentaje
 * @param {number} datos.autorizado_por - ID del usuario que autoriza la actualización
 * @param {string} [datos.observacion] - Nuevas observaciones
 * @returns {Promise<Object>} Descuento actualizado
 * @example
 * const actualizado = await actualizarDescuento(5, {
 *   porcentaje_descuento: 7.50,
 *   autorizado_por: 1
 * });
 */
const actualizarDescuento = async (id, datos) => {
  const { porcentaje_descuento, autorizado_por, observacion } = datos;
  const pool = await getConnection();
  const result = await pool.request()
    .input('id',                   sql.Int,         id)
    .input('porcentaje_descuento', sql.Decimal(5,2), porcentaje_descuento)
    .input('autorizado_por',       sql.Int,         autorizado_por)
    .input('observacion',          sql.NVarChar,    observacion || null)
    .query(`
      UPDATE descuentos_contrato
      SET porcentaje_descuento = @porcentaje_descuento,
          autorizado_por       = @autorizado_por,
          observacion          = @observacion,
          fecha_autorizacion   = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

/**
 * Elimina un descuento de un contrato
 * @async
 * @function eliminarDescuento
 * @param {number} id - ID del descuento a eliminar
 * @returns {Promise<Object>} Registro eliminado
 * @example
 * const eliminado = await eliminarDescuento(5);
 */
const eliminarDescuento = async (id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM descuentos_contrato
      OUTPUT DELETED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

module.exports = {
  crearDescuento,
  listarPorContrato,
  buscarPorContratoYTipo,
  actualizarDescuento,
  eliminarDescuento
};