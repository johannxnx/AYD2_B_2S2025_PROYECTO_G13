/**
 * @file MovimientoCredito.js
 * @description Modelo para registrar movimientos de crédito en contratos.
 * Controla facturas, pagos y cambios en el saldo de crédito de los clientes.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Registra un movimiento de crédito (factura o pago) en un contrato
 * @async
 * @function crearMovimiento
 * @param {Object} datos - Datos del movimiento
 * @param {number} datos.contrato_id - ID del contrato
 * @param {number} datos.factura_id - ID de la factura asociada
 * @param {number} [datos.pago_id] - ID del pago (si aplica)
 * @param {string} datos.tipo_movimiento - Tipo: 'FACTURA', 'PAGO', 'AJUSTE', etc
 * @param {number} datos.monto_movimiento - Monto del movimiento
 * @param {number} datos.saldo_anterior - Saldo antes del movimiento
 * @param {number} datos.saldo_nuevo - Saldo después del movimiento
 * @param {string} datos.motivo - Razón/descripción del movimiento
 * @param {number} datos.registrado_por - ID del usuario que registra
 * @returns {Promise<Object>} Movimiento creado
 * @example
 * const mov = await crearMovimiento({
 *   contrato_id: 12,
 *   factura_id: 501,
 *   tipo_movimiento: 'FACTURA',
 *   monto_movimiento: 150000,
 *   saldo_anterior: 25000,
 *   saldo_nuevo: 175000,
 *   motivo: 'Factura transporte',
 *   registrado_por: 1
 * });
 */
const crearMovimiento = async (datos) => {
  const {
    contrato_id, factura_id, pago_id, tipo_movimiento,
    monto_movimiento, saldo_anterior, saldo_nuevo, motivo, registrado_por
  } = datos;

  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id',      sql.Int,          contrato_id)
    .input('factura_id',       sql.Int,          factura_id)
    .input('pago_id',          sql.Int,          pago_id || null)
    .input('tipo_movimiento',  sql.NVarChar,     tipo_movimiento)
    .input('monto_movimiento', sql.Decimal(15,2), monto_movimiento)
    .input('saldo_anterior',   sql.Decimal(15,2), saldo_anterior)
    .input('saldo_nuevo',      sql.Decimal(15,2), saldo_nuevo)
    .input('motivo',           sql.NVarChar,     motivo)
    .input('registrado_por',   sql.Int,          registrado_por)
    .query(`
      INSERT INTO movimientos_credito_contrato
        (contrato_id, factura_id, pago_id, tipo_movimiento,
         monto_movimiento, saldo_anterior, saldo_nuevo, motivo, registrado_por)
      OUTPUT INSERTED.*
      VALUES
        (@contrato_id, @factura_id, @pago_id, @tipo_movimiento,
         @monto_movimiento, @saldo_anterior, @saldo_nuevo, @motivo, @registrado_por)
    `);
  return result.recordset[0];
};

/**
 * Lista todos los movimientos de crédito de un contrato
 * @async
 * @function listarPorContrato
 * @param {number} contrato_id - ID del contrato
 * @returns {Promise<Array>} Array de movimientos ordenados por fecha descendente:
 *   - {number} id - ID del movimiento
 *   - {number} contrato_id - ID del contrato
 *   - {number} factura_id - ID de la factura
 *   - {number} pago_id - ID del pago
 *   - {string} tipo_movimiento - Tipo de movimiento
 *   - {number} monto_movimiento - Monto del movimiento
 *   - {number} saldo_anterior - Saldo anterior
 *   - {number} saldo_nuevo - Saldo nuevo
 *   - {string} motivo - Motivo del movimiento
 *   - {Date} fecha_movimiento - Fecha del movimiento
 *   - {string} registrado_por_nombre - Nombre del usuario que registró
 * @example
 * const movimientos = await listarPorContrato(12);
 */
const listarPorContrato = async (contrato_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int, contrato_id)
    .query(`
      SELECT m.*, u.nombre AS registrado_por_nombre
      FROM movimientos_credito_contrato m
      LEFT JOIN usuarios u ON u.id = m.registrado_por
      WHERE m.contrato_id = @contrato_id
      ORDER BY m.fecha_movimiento DESC
    `);
  return result.recordset;
};

/**
 * Obtiene el último movimiento de crédito de un contrato
 * @async
 * @function ultimoMovimiento
 * @param {number} contrato_id - ID del contrato
 * @returns {Promise<Object|undefined>} Último movimiento con:
 *   - {number} saldo_nuevo - Saldo actual después del último movimiento
 *   - {Date} fecha_movimiento - Fecha del último movimiento
 *   Retorna undefined si no hay movimientos registrados
 * @example
 * const ultimo = await ultimoMovimiento(12);
 * console.log(ultimo.saldo_nuevo); // Saldo actual del contrato
 */
const ultimoMovimiento = async (contrato_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('contrato_id', sql.Int, contrato_id)
    .query(`
      SELECT TOP 1 saldo_nuevo, fecha_movimiento
      FROM movimientos_credito_contrato
      WHERE contrato_id = @contrato_id
      ORDER BY fecha_movimiento DESC
    `);
  return result.recordset[0];
};

module.exports = { crearMovimiento, listarPorContrato, ultimoMovimiento };