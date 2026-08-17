/**
 * @file Contrato.js
 * @description Modelo para la gestión de contratos de transporte.
 * Contiene operaciones CRUD para crear, consultar, actualizar y cambiar estado
 * de contratos de clientes con límites de crédito y plazos de pago.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Crea un nuevo contrato de transporte para un cliente
 * @async
 * @function crearContrato
 * @param {Object} datos - Datos del nuevo contrato
 * @param {string} datos.numero_contrato - Número único identificador del contrato
 * @param {number} datos.cliente_id - ID del cliente propietario del contrato
 * @param {Date} datos.fecha_inicio - Fecha de inicio del contrato
 * @param {Date} datos.fecha_fin - Fecha de vencimiento del contrato
 * @param {number} datos.limite_credito - Límite máximo de crédito disponible
 * @param {number} datos.plazo_pago - Número de días de plazo para pagar
 * @param {number} datos.creado_por - ID del usuario que crea el contrato
 * @returns {Promise<Object>} Contrato creado con ID y timestamps
 * @example
 * const contrato = await crearContrato({
 *   numero_contrato: 'CTR-2026-001',
 *   cliente_id: 5,
 *   fecha_inicio: '2026-03-23',
 *   fecha_fin: '2027-03-23',
 *   limite_credito: 50000,
 *   plazo_pago: 30,
 *   creado_por: 1
 * });
 */
const crearContrato = async (datos) => {
  const {
    numero_contrato, cliente_id, fecha_inicio, fecha_fin,
    limite_credito, plazo_pago, creado_por
  } = datos;

  const pool = await getConnection();
  const result = await pool.request()
    .input('numero_contrato', sql.NVarChar,     numero_contrato)
    .input('cliente_id',      sql.Int,          cliente_id)
    .input('fecha_inicio',    sql.Date,         fecha_inicio)
    .input('fecha_fin',       sql.Date,         fecha_fin)
    .input('limite_credito',  sql.Decimal(15,2), limite_credito)
    .input('plazo_pago',      sql.Int,          plazo_pago)
    .input('creado_por',      sql.Int,          creado_por)
    .query(`
      INSERT INTO contratos
        (numero_contrato, cliente_id, fecha_inicio, fecha_fin,
         limite_credito, plazo_pago, creado_por)
      OUTPUT INSERTED.*
      VALUES
        (@numero_contrato, @cliente_id, @fecha_inicio, @fecha_fin,
         @limite_credito, @plazo_pago, @creado_por)
    `);
  return result.recordset[0];
};

/**
 * Busca un contrato por ID con información detallada de usuarios relacionados
 * @async
 * @function buscarPorId
 * @param {number} id - ID del contrato a buscar
 * @returns {Promise<Object|undefined>} Objeto contrato con propiedades:
 *   - Campos del contrato
 *   - {string} cliente_nombre - Nombre del cliente
 *   - {string} cliente_nit - NIT del cliente
 *   - {string} creado_por_nombre - Nombre del usuario creador
 *   - {string} modificado_por_nombre - Nombre del usuario que última vez modificó
 * @example
 * const contrato = await buscarPorId(12);
 * console.log(contrato.cliente_nombre); // "Transportes ABC"
 */
const buscarPorId = async (id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT c.*,
             u.nombre  AS cliente_nombre,
             u.nit     AS cliente_nit,
             cr.nombre AS creado_por_nombre,
             mo.nombre AS modificado_por_nombre
      FROM contratos c
      LEFT JOIN usuarios u  ON u.id  = c.cliente_id
      LEFT JOIN usuarios cr ON cr.id = c.creado_por
      LEFT JOIN usuarios mo ON mo.id = c.modificado_por
      WHERE c.id = @id
    `);
  return result.recordset[0];
};

// FASE 2/backend/src/models/contratos/Contrato.js
// Agregar esta función

/**
 * Lista todos los contratos del sistema con información de clientes
 * @async
 * @function listarTodos
 * @param {number} limit - Límite de resultados (opcional)
 * @param {string} estado - Filtrar por estado (opcional)
 * @returns {Promise<Array>} Array de contratos
 */
const listarTodos = async (limit, estado) => {
  const pool = await getConnection();
  let query = `
    SELECT c.id, c.numero_contrato, c.fecha_inicio, c.fecha_fin,
           c.estado, c.limite_credito, c.saldo_usado,
           c.plazo_pago, c.fecha_creacion,
           u.nombre AS cliente_nombre, u.nit AS cliente_nit
    FROM contratos c
    LEFT JOIN usuarios u ON u.id = c.cliente_id
  `;
  
  const params = [];
  if (estado) {
    query += ` WHERE c.estado = @estado`;
    params.push({ name: 'estado', type: sql.NVarChar, value: estado });
  }
  
  query += ` ORDER BY c.fecha_creacion DESC`;
  
  if (limit) {
    query += ` OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;
    params.push({ name: 'limit', type: sql.Int, value: parseInt(limit) });
  }
  
  const request = pool.request();
  params.forEach(param => {
    request.input(param.name, param.type, param.value);
  });
  
  const result = await request.query(query);
  return result.recordset;
};




/**
 * Lista todos los contratos de un cliente específico ordenados por fecha de creación
 * @async
 * @function listarPorCliente
 * @param {number} cliente_id - ID del cliente a consultar
 * @returns {Promise<Array>} Array de objetos contrato con propiedades:
 *   - {number} id - ID del contrato
 *   - {string} numero_contrato - Número único del contrato
 *   - {Date} fecha_inicio - Fecha de inicio
 *   - {Date} fecha_fin - Fecha de vencimiento
 *   - {string} estado - Estado del contrato (VIGENTE, VENCIDO, etc)
 *   - {number} limite_credito - Límite de crédito
 *   - {number} saldo_usado - Saldo utilizado del crédito
 *   - {number} plazo_pago - Plazo en días
 *   - {Date} fecha_creacion - Fecha de creación
 * @example
 * const contratos = await listarPorCliente(5);
 */
// backend/src/models/contratos/Contrato.js
const listarPorCliente = async (cliente_id) => {
  console.log('[Contrato.model] listarPorCliente - cliente_id:', cliente_id);
  console.log('[Contrato.model] cliente_id type:', typeof cliente_id);
  
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT c.id, c.numero_contrato, c.fecha_inicio, c.fecha_fin,
             c.estado, c.limite_credito, c.saldo_usado,
             c.plazo_pago, c.fecha_creacion
      FROM contratos c
      WHERE c.cliente_id = @cliente_id
      ORDER BY c.fecha_creacion DESC
    `);
  
  console.log('[Contrato.model] Query result recordset:', result.recordset);
  console.log('[Contrato.model] Number of records:', result.recordset.length);
  
  return result.recordset;
};

/**
 * Busca el contrato vigente más reciente de un cliente
 * @async
 * @function buscarVigentePorCliente
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Object|undefined>} Objeto contrato vigente con:
 *   - {number} id - ID del contrato
 *   - {string} numero_contrato - Número del contrato
 *   - {Date} fecha_inicio - Fecha de inicio
 *   - {Date} fecha_fin - Fecha de vencimiento
 *   - {string} estado - Estado (VIGENTE)
 *   - {number} limite_credito - Límite de crédito
 *   - {number} saldo_usado - Saldo utilizado
 *   - {number} plazo_pago - Plazo en días
 *   Retorna undefined si no hay contrato vigente
 * @example
 * const contratoVigente = await buscarVigentePorCliente(5);
 */
const buscarVigentePorCliente = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT TOP 1
        c.id, c.numero_contrato, c.fecha_inicio, c.fecha_fin,
        c.estado, c.limite_credito, c.saldo_usado, c.plazo_pago
      FROM contratos c
      WHERE c.cliente_id = @cliente_id
        AND c.estado      = 'VIGENTE'
        AND c.fecha_fin  >= CAST(GETDATE() AS DATE)
      ORDER BY c.fecha_fin DESC
    `);
  return result.recordset[0];
};

/**
 * Actualiza los datos de un contrato existente
 * @async
 * @function actualizarContrato
 * @param {number} id - ID del contrato a actualizar
 * @param {Object} datos - Datos a actualizar
 * @param {Date} datos.fecha_inicio - Nueva fecha de inicio
 * @param {Date} datos.fecha_fin - Nueva fecha de vencimiento
 * @param {number} datos.limite_credito - Nuevo límite de crédito
 * @param {number} datos.plazo_pago - Nuevo plazo de pago en días
 * @param {string} datos.estado - Nuevo estado del contrato
 * @param {number} datos.modificado_por - ID del usuario que realiza la modificación
 * @returns {Promise<Object>} Contrato actualizado con timestamp de modificación
 * @example
 * const actualizado = await actualizarContrato(12, {
 *   limite_credito: 75000,
 *   estado: 'VIGENTE',
 *   modificado_por: 1
 * });
 */
const actualizarContrato = async (id, datos) => {
  const {
    fecha_inicio, fecha_fin, limite_credito,
    plazo_pago, estado, modificado_por
  } = datos;

  const pool = await getConnection();
  const result = await pool.request()
    .input('id',             sql.Int,          id)
    .input('fecha_inicio',   sql.Date,         fecha_inicio)
    .input('fecha_fin',      sql.Date,         fecha_fin)
    .input('limite_credito', sql.Decimal(15,2), limite_credito)
    .input('plazo_pago',     sql.Int,          plazo_pago)
    .input('estado',         sql.NVarChar,     estado)
    .input('modificado_por', sql.Int,          modificado_por)
    .query(`
      UPDATE contratos
      SET fecha_inicio       = @fecha_inicio,
          fecha_fin          = @fecha_fin,
          limite_credito     = @limite_credito,
          plazo_pago         = @plazo_pago,
          estado             = @estado,
          modificado_por     = @modificado_por,
          fecha_modificacion = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

/**
 * Actualiza el saldo usado del crédito de un contrato
 * @async
 * @function actualizarSaldo
 * @param {number} id - ID del contrato
 * @param {number} saldo_usado - Nuevo monto de saldo utilizado
 * @returns {Promise<Object>} Objeto con:
 *   - {number} id - ID del contrato
 *   - {number} saldo_usado - Saldo actualizado
 *   - {number} limite_credito - Límite de crédito (para referencia)
 * @example
 * const saldo = await actualizarSaldo(12, 25000);
 */
const actualizarSaldo = async (id, saldo_usado) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id',          sql.Int,          id)
    .input('saldo_usado', sql.Decimal(15,2), saldo_usado)
    .query(`
      UPDATE contratos
      SET saldo_usado = @saldo_usado
      OUTPUT INSERTED.id, INSERTED.saldo_usado, INSERTED.limite_credito
      WHERE id = @id
    `);
  return result.recordset[0];
};

/**
 * Cambia el estado de un contrato
 * @async
 * @function cambiarEstado
 * @param {number} id - ID del contrato
 * @param {string} estado - Nuevo estado (VIGENTE, VENCIDO, CANCELADO, etc)
 * @returns {Promise<Object>} Objeto actualización con:
 *   - {number} id - ID del contrato
 *   - {string} estado - Estado actualizado
 * @example
 * const cambio = await cambiarEstado(12, 'VENCIDO');
 */
const cambiarEstado = async (id, estado) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id',     sql.Int,      id)
    .input('estado', sql.NVarChar, estado)
    .query(`
      UPDATE contratos
      SET estado = @estado
      OUTPUT INSERTED.id, INSERTED.estado
      WHERE id = @id
    `);
  return result.recordset[0];
};

module.exports = {
  crearContrato,
  buscarPorId,
  listarPorCliente,
  buscarVigentePorCliente,
  actualizarContrato,
  actualizarSaldo,
  cambiarEstado,
  listarTodos  // NUEVO
};