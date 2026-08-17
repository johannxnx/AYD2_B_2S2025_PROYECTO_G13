/**
 * @file FacturaFEL.js
 * @description Modelo para la gestión de facturas electrónicas (FEL).
 * Maneja la creación, certificación y consulta de facturas con cumplimiento SAT.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Obtiene todas las facturas de un cliente
 * @async
 * @function listarPorCliente
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Array>} Array de facturas del cliente
 * @example
 * const facturas = await listarPorCliente(5);
 */
const listarPorCliente = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT f.id, f.numero_factura, f.tipo_documento, f.estado,
             f.distancia_km, f.tarifa_aplicada, f.descuento_aplicado,
             f.subtotal, f.iva, f.total_factura,
             f.fecha_emision, f.fecha_certificacion,
             f.uuid_autorizacion, f.observaciones,
             o.numero_orden, o.origen, o.destino
      FROM facturas_fel f
      LEFT JOIN ordenes o ON o.id = f.orden_id
      WHERE f.cliente_id = @cliente_id
      ORDER BY f.fecha_emision DESC
    `);
  return result.recordset;
};

/**
 * Obtiene facturas CERTIFICADAS de un cliente (para bloqueo automático)
 * Solo retorna facturas que están completamente certificadas
 * @async
 * @function traerFacturasCertificadas
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Array>} Array de facturas certificadas
 * @example
 * const cetificadas = await traerFacturasCertificadas(5);
 */
const traerFacturasCertificadas = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT f.id, f.numero_factura, f.total_factura,
             f.uuid_autorizacion, f.fecha_certificacion
      FROM facturas_fel f
      WHERE f.cliente_id = @cliente_id
        AND f.estado = 'CERTIFICADA'
      ORDER BY f.fecha_emision DESC
    `);
  return result.recordset;
};

/**
 * Verifica si un cliente tiene facturas CERTIFICADAS/PENDIENTES sin pagar
 * Usado en el validador de bloqueo automático
 * @async
 * @function verificarFacturasPendientes
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Object>} { tieneFacturasPendientes: boolean, cantidad: number, montoTotal: number }
 * @example
 * const check = await verificarFacturasPendientes(5);
 * if (check.tieneFacturasPendientes) console.log("Cliente no puede hacer órdenes");
 */
const verificarFacturasPendientes = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT COUNT(DISTINCT f.id) AS cantidad,
             SUM(ISNULL(f.total_factura, 0)) AS montoTotal
      FROM facturas_fel f
      WHERE f.cliente_id = @cliente_id
        AND f.estado IN ('CERTIFICADA', 'VALIDADA')
        AND NOT EXISTS (
          SELECT 1 FROM cuentas_por_cobrar cpc
          WHERE cpc.factura_id = f.id
            AND cpc.estado_cobro = 'PAGADA'
        )
    `);
  
  const row = result.recordset[0];
  return {
    tieneFacturasPendientes: row.cantidad > 0,
    cantidad: row.cantidad || 0,
    montoTotal: row.montoTotal || 0
  };
};

/**
 * Crea un borrador de factura a partir de una orden
 * @async
 * @function crearBorrador
 * @param {Object} datos - Datos de la factura
 * @param {number} datos.orden_id - ID de la orden
 * @param {number} datos.cliente_id - ID del cliente
 * @param {number} datos.contrato_id - ID del contrato
 * @param {number} datos.distancia_km - Distancia en km
 * @param {number} datos.tarifa_aplicada - Tarifa por km
 * @param {number} datos.subtotal - Subtotal (sin IVA)
 * @param {number} datos.iva - Monto de IVA
 * @param {number} datos.total_factura - Total con IVA
 * @returns {Promise<Object>} Factura creada en estado BORRADOR
 * @example
 * const factura = await crearBorrador({
 *   orden_id: 123,
 *   cliente_id: 5,
 *   contrato_id: 8,
 *   distancia_km: 50,
 *   tarifa_aplicada: 8.00,
 *   subtotal: 400,
 *   iva: 48,
 *   total_factura: 448
 * });
 */
const crearBorrador = async (datos) => {
  const {
    orden_id, cliente_id, contrato_id, distancia_km,
    tarifa_aplicada, subtotal, iva, total_factura
  } = datos;

  const pool = await getConnection();
  
  // Generar número de factura único
  const numeroFactura = `FAC-${Date.now()}`;
  
  const result = await pool.request()
    .input('numeroFactura', sql.NVarChar, numeroFactura)
    .input('orden_id', sql.Int, orden_id)
    .input('cliente_id', sql.Int, cliente_id)
    .input('contrato_id', sql.Int, contrato_id)
    .input('distancia_km', sql.Decimal(10, 2), distancia_km)
    .input('tarifa_aplicada', sql.Decimal(10, 2), tarifa_aplicada)
    .input('descuento_aplicado', sql.Decimal(15, 2), 0)
    .input('subtotal', sql.Decimal(15, 2), subtotal)
    .input('iva', sql.Decimal(15, 2), iva)
    .input('total_factura', sql.Decimal(15, 2), total_factura)
    .query(`
      INSERT INTO facturas_fel
        (numero_factura, orden_id, cliente_id, contrato_id, tipo_documento,
         distancia_km, tarifa_aplicada, descuento_aplicado,
         subtotal, iva, total_factura, estado)
      OUTPUT INSERTED.*
      VALUES
        (@numeroFactura, @orden_id, @cliente_id, @contrato_id, 'FEL',
         @distancia_km, @tarifa_aplicada, @descuento_aplicado,
         @subtotal, @iva, @total_factura, 'BORRADOR')
    `);
  
  return result.recordset[0];
};

/**
 * Obtiene el total de facturas sin pagar por un cliente
 * @async
 * @function obtenerTotalFacturadoSinPagar
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<number>} Total de facturas sin pagar
 * @example
 * const total = await obtenerTotalFacturadoSinPagar(5);
 */
const obtenerTotalFacturadoSinPagar = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT SUM(ISNULL(f.total_factura, 0)) AS total_sin_pagar
      FROM facturas_fel f
      WHERE f.cliente_id = @cliente_id
        AND f.estado IN ('CERTIFICADA', 'VALIDADA')
        AND NOT EXISTS (
          SELECT 1 FROM cuentas_por_cobrar cpc
          WHERE cpc.factura_id = f.id
            AND cpc.estado_cobro = 'PAGADA'
        )
    `);
  
  const row = result.recordset[0];
  return row.total_sin_pagar || 0;
};

module.exports = {
  listarPorCliente,
  traerFacturasCertificadas,
  verificarFacturasPendientes,
  crearBorrador,
  obtenerTotalFacturadoSinPagar
};
