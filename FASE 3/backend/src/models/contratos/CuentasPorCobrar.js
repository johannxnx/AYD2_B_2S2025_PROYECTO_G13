/**
 * @file CuentasPorCobrar.js
 * @description Modelo para la gestión de cuentas por cobrar.
 * Maneja el seguimiento de facturas pendientes, vencidas y su estado de pago.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Obtiene todas las cuentas por cobrar de un cliente
 * @async
 * @function listarPorCliente
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Array>} Array de cuentas por cobrar
 * @example
 * const cuentas = await listarPorCliente(5);
 */
const listarPorCliente = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT cpc.id, cpc.factura_id, cpc.cliente_id, cpc.contrato_id,
             cpc.monto_original, cpc.saldo_pendiente,
             cpc.fecha_emision, cpc.fecha_vencimiento, cpc.estado_cobro,
             cpc.ultima_fecha_pago, cpc.observaciones,
             f.numero_factura, f.estado AS factura_estado
      FROM cuentas_por_cobrar cpc
      LEFT JOIN facturas_fel f ON f.id = cpc.factura_id
      WHERE cpc.cliente_id = @cliente_id
      ORDER BY cpc.fecha_vencimiento ASC
    `);
  return result.recordset;
};

/**
 * Obtiene las cuentas por cobrar VENCIDAS de un cliente
 * Usado en el validador de bloqueo automático
 * @async
 * @function traerCuentasVencidas
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Array>} Array de cuentas con estado_cobro = 'VENCIDA'
 * @example
 * const vencidas = await traerCuentasVencidas(5);
 * if (vencidas.length > 0) console.log("Cliente tiene deudas vencidas");
 */
const traerCuentasVencidas = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT cpc.id, cpc.factura_id, cpc.monto_original, cpc.saldo_pendiente,
             cpc.fecha_vencimiento, cpc.estado_cobro, f.numero_factura
      FROM cuentas_por_cobrar cpc
      LEFT JOIN facturas_fel f ON f.id = cpc.factura_id
      WHERE cpc.cliente_id = @cliente_id
        AND cpc.estado_cobro = 'VENCIDA'
      ORDER BY cpc.fecha_vencimiento ASC
    `);
  return result.recordset;
};

/**
 * Verifica si un cliente tiene cuentas PENDIENTES vencidas por fecha
 * @async
 * @function verificarVencimiento
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Object>} { tieneVencidas: boolean, cantidad: number, montoTotal: number }
 * @example
 * const check = await verificarVencimiento(5);
 * if (check.tieneVencidas) console.log(`${check.cantidad} facturas vencidas`);
 */
const verificarVencimiento = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT COUNT(*) AS cantidad,
             SUM(ISNULL(saldo_pendiente, 0)) AS montoTotal
      FROM cuentas_por_cobrar
      WHERE cliente_id = @cliente_id
        AND estado_cobro IN ('VENCIDA', 'PENDIENTE')
        AND fecha_vencimiento < CAST(GETDATE() AS DATE)
    `);
  
  const row = result.recordset[0];
  return {
    tieneVencidas: row.cantidad > 0,
    cantidad: row.cantidad || 0,
    montoTotal: row.montoTotal || 0
  };
};

/**
 * Obtiene el saldo total pendiente de un cliente
 * @async
 * @function obtenerSaldoPendiente
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<number>} Monto total pendiente
 * @example
 * const saldo = await obtenerSaldoPendiente(5);
 */
const obtenerSaldoPendiente = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT SUM(ISNULL(saldo_pendiente, 0)) AS total_pendiente
      FROM cuentas_por_cobrar
      WHERE cliente_id = @cliente_id
        AND estado_cobro IN ('PENDIENTE', 'VENCIDA')
    `);
  
  const row = result.recordset[0];
  return row.total_pendiente || 0;
};

/**
 * Registra un pago en una cuenta por cobrar
 * @async
 * @function registrarPago
 * @param {number} cpc_id - ID de la cuenta por cobrar
 * @param {number} monto - Monto pagado
 * @returns {Promise<Object>} Cuenta actualizada
 * @example
 * const actualizado = await registrarPago(10, 500);
 */
const registrarPago = async (cpc_id, monto) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cpc_id', sql.Int, cpc_id)
    .input('monto', sql.Decimal(15, 2), monto)
    .query(`
      UPDATE cuentas_por_cobrar
      SET saldo_pendiente = saldo_pendiente - @monto,
          ultima_fecha_pago = GETDATE(),
          estado_cobro = CASE 
            WHEN saldo_pendiente - @monto <= 0 THEN 'PAGADA'
            ELSE estado_cobro
          END
      OUTPUT INSERTED.*
      WHERE id = @cpc_id
    `);
  return result.recordset[0];
};

module.exports = {
  listarPorCliente,
  traerCuentasVencidas,
  verificarVencimiento,
  obtenerSaldoPendiente,
  registrarPago
};
