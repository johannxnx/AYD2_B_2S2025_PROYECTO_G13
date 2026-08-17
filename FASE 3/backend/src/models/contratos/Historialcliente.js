/**
 * @file HistorialCliente.js
 * @description Modelo para la gestión del historial y rentabilidad de clientes.
 * Registra información de órdenes, facturación, gastos, e informa sobre rentabilidad.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Registra una nueva orden en el historial de un cliente
 * @async
 * @function crearHistorial
 * @param {Object} datos - Datos de la orden
 * @param {number} datos.cliente_id - ID del cliente
 * @param {number} datos.orden_id - ID de la orden de transporte
 * @param {number} datos.volumen_carga_ton - Volumen de carga en toneladas
 * @param {number} datos.monto_facturado - Monto total facturado
 * @param {number} datos.gasto_operativo - Gasto operativo generado
 * @param {boolean} datos.pago_puntual - Indica si se pagó a tiempo
 * @param {boolean} [datos.siniestro] - Si hubo siniestro (default: false)
 * @param {string} [datos.descripcion_siniestro] - Descripción del siniestro si aplica
 * @returns {Promise<Object>} Registro de historial creado
 * @example
 * const hist = await crearHistorial({
 *   cliente_id: 5,
 *   orden_id: 101,
 *   volumen_carga_ton: 2.5,
 *   monto_facturado: 150000,
 *   gasto_operativo: 45000,
 *   pago_puntual: true
 * });
 */
const crearHistorial = async (datos) => {
  const {
    cliente_id, orden_id, volumen_carga_ton, monto_facturado,
    gasto_operativo, pago_puntual, siniestro, descripcion_siniestro
  } = datos;

  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id',            sql.Int,          cliente_id)
    .input('orden_id',              sql.Int,          orden_id)
    .input('volumen_carga_ton',     sql.Decimal(10,2), volumen_carga_ton)
    .input('monto_facturado',       sql.Decimal(15,2), monto_facturado)
    .input('gasto_operativo',       sql.Decimal(15,2), gasto_operativo)
    .input('pago_puntual',          sql.Bit,          pago_puntual)
    .input('siniestro',             sql.Bit,          siniestro || false)
    .input('descripcion_siniestro', sql.NVarChar,     descripcion_siniestro || null)
    .query(`
      INSERT INTO historial_cliente
        (cliente_id, orden_id, volumen_carga_ton, monto_facturado,
         gasto_operativo, pago_puntual, siniestro, descripcion_siniestro)
      OUTPUT INSERTED.*
      VALUES
        (@cliente_id, @orden_id, @volumen_carga_ton, @monto_facturado,
         @gasto_operativo, @pago_puntual, @siniestro, @descripcion_siniestro)
    `);
  return result.recordset[0];
};

/**
 * Lista el historial completo de órdenes de un cliente
 * @async
 * @function listarPorCliente
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Array>} Array de registros del historial con:
 *   - {number} id - ID del registro
 *   - {number} orden_id - ID de la orden
 *   - {number} volumen_carga_ton - Volumen transportado
 *   - {number} monto_facturado - Monto facturado
 *   - {number} gasto_operativo - Gasto generado
 *   - {boolean} pago_puntual - Si se pagó a tiempo
 *   - {boolean} siniestro - Si ocurrió siniestro
 *   - {string} descripcion_siniestro - Detalles del siniestro
 *   - {string} cliente_nombre - Nombre del cliente
 *   - {string} cliente_nit - NIT del cliente
 * @example
 * const historial = await listarPorCliente(5);
 */
const listarPorCliente = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT h.*, u.nombre AS cliente_nombre, u.nit AS cliente_nit
      FROM historial_cliente h
      LEFT JOIN usuarios u ON u.id = h.cliente_id
      WHERE h.cliente_id = @cliente_id
      ORDER BY h.fecha_registro DESC
    `);
  return result.recordset;
};

/**
 * Obtiene un resumen de rentabilidad para un cliente específico
 * @async
 * @function resumenRentabilidad
 * @param {number} cliente_id - ID del cliente a analizar
 * @returns {Promise<Object>} Resumen con estadísticas:
 *   - {string} cliente_nombre - Nombre del cliente
 *   - {string} cliente_nit - NIT del cliente
 *   - {number} total_ordenes - Cantidad total de órdenes
 *   - {number} total_volumen_ton - Volumen total transportado
 *   - {number} total_facturado - Ingresos totales
 *   - {number} total_gastos - Gastos operativos totales
 *   - {number} rentabilidad_total - Ganancia neta (facturado - gastos)
 *   - {number} pagos_puntuales - Cantidad de pagos a tiempo
 *   - {number} total_siniestros - Cantidad de siniestros registrados
 * @example
 * const resumen = await resumenRentabilidad(5);
 * console.log(resumen.rentabilidad_total); // Ganancia neta
 */
const resumenRentabilidad = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT
        u.nombre                              AS cliente_nombre,
        u.nit                                 AS cliente_nit,
        COUNT(h.id)                           AS total_ordenes,
        SUM(h.volumen_carga_ton)              AS total_volumen_ton,
        SUM(h.monto_facturado)                AS total_facturado,
        SUM(h.gasto_operativo)                AS total_gastos,
        SUM(h.monto_facturado)
          - SUM(h.gasto_operativo)            AS rentabilidad_total,
        SUM(CASE WHEN h.pago_puntual = 1
            THEN 1 ELSE 0 END)                AS pagos_puntuales,
        SUM(CASE WHEN h.siniestro = 1
            THEN 1 ELSE 0 END)                AS total_siniestros
      FROM historial_cliente h
      LEFT JOIN usuarios u ON u.id = h.cliente_id
      WHERE h.cliente_id = @cliente_id
      GROUP BY u.nombre, u.nit
    `);
  return result.recordset[0];
};

/**
 * Obtiene resumén de rentabilidad de todos los clientes
 * @async
 * @function resumenTodosClientes
 * @returns {Promise<Array>} Array de clientes ordenados por rentabilidad descendente:
 *   - {number} cliente_id - ID del cliente
 *   - {string} cliente_nombre - Nombre del cliente
 *   - {string} cliente_nit - NIT del cliente
 *   - {number} total_ordenes - Cantidad de órdenes
 *   - {number} total_volumen_ton - Volumen total transportado
 *   - {number} total_facturado - Ingresos totales
 *   - {number} total_gastos - Gastos totales
 *   - {number} rentabilidad_total - Ganancia neta
 * @example
 * const rentables = await resumenTodosClientes();
 * console.log(rentables[0]); // Cliente más rentable
 */
const resumenTodosClientes = async () => {
  const pool = await getConnection();
  const result = await pool.request()
    .query(`
      SELECT
        u.id                                  AS cliente_id,
        u.nombre                              AS cliente_nombre,
        u.nit                                 AS cliente_nit,
        COUNT(h.id)                           AS total_ordenes,
        SUM(h.volumen_carga_ton)              AS total_volumen_ton,
        SUM(h.monto_facturado)                AS total_facturado,
        SUM(h.gasto_operativo)                AS total_gastos,
        SUM(h.monto_facturado)
          - SUM(h.gasto_operativo)            AS rentabilidad_total
      FROM historial_cliente h
      LEFT JOIN usuarios u ON u.id = h.cliente_id
      GROUP BY u.id, u.nombre, u.nit
      ORDER BY rentabilidad_total DESC
    `);
  return result.recordset;
};

module.exports = {
  crearHistorial,
  listarPorCliente,
  resumenRentabilidad,
  resumenTodosClientes
};