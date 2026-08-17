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
    limite_credito, plazo_pago, creado_por, moneda_id = 1
  } = datos;

  // Validación de parámetros críticos
  if (!numero_contrato) throw new Error('numero_contrato es requerido');
  if (!cliente_id) throw new Error('cliente_id es requerido');
  if (!fecha_inicio) throw new Error('fecha_inicio es requerido');
  if (!fecha_fin) throw new Error('fecha_fin es requerido');
  if (!limite_credito) throw new Error('limite_credito es requerido');
  if (!plazo_pago) throw new Error('plazo_pago es requerido');
  if (!creado_por) throw new Error('creado_por es requerido - Usuario no autenticado');

  // Validar moneda_id válida
  const MONEDAS_VALIDAS = [1, 2, 6, 7];
  if (!MONEDAS_VALIDAS.includes(moneda_id)) {
    throw new Error(`Moneda inválida: ${moneda_id}. Solo se permiten: 1=GTQ, 2=USD, 6=HNL, 7=SVC`);
  }

  try {
    const pool = await getConnection();
    
    // Insertar sin OUTPUT (porque hay triggers en la tabla)
    await pool.request()
      .input('numero_contrato', sql.NVarChar,     numero_contrato)
      .input('cliente_id',      sql.Int,          cliente_id)
      .input('moneda_id',       sql.Int,          moneda_id)
      .input('fecha_inicio',    sql.Date,         fecha_inicio)
      .input('fecha_fin',       sql.Date,         fecha_fin)
      .input('limite_credito',  sql.Decimal(15,2), limite_credito)
      .input('plazo_pago',      sql.Int,          plazo_pago)
      .input('creado_por',      sql.Int,          creado_por)
      .query(`
        INSERT INTO contratos
          (numero_contrato, cliente_id, moneda_id, fecha_inicio, fecha_fin,
           limite_credito, plazo_pago, creado_por)
        VALUES
          (@numero_contrato, @cliente_id, @moneda_id, @fecha_inicio, @fecha_fin,
           @limite_credito, @plazo_pago, @creado_por)
      `);
    
    // Recuperar el registro insertado (sin OUTPUT por los triggers)
    const resultSelect = await pool.request()
      .input('numero_contrato', sql.NVarChar, numero_contrato)
      .query(`SELECT TOP 1 * FROM contratos WHERE numero_contrato = @numero_contrato`);
    
    if (!resultSelect.recordset || resultSelect.recordset.length === 0) {
      throw new Error('No se pudo recuperar el contrato después de crear');
    }
    
    return resultSelect.recordset[0];
  } catch (dbError) {
    console.error('[Contrato.crearContrato] Error en BD:', {
      codigo: dbError.code,
      mensaje: dbError.message,
      numero: dbError.number,
      linea: dbError.lineNumber,
      procedimiento: dbError.procedureName
    });

    // Errores específicos de MSSQL
    if (dbError.code === 'EREQUEST') {
      // Violación de foreign key
      if (dbError.message.includes('FK_contratos_cliente')) {
        throw new Error(`Cliente no encontrado: ${cliente_id}`);
      }
      if (dbError.message.includes('FK_contratos_moneda')) {
        throw new Error(`Moneda no encontrada en BD: ${moneda_id}`);
      }
      if (dbError.message.includes('FK_contratos_creado_por')) {
        throw new Error(`Usuario creador no encontrado: ${creado_por}`);
      }
      if (dbError.message.includes('numero_contrato')) {
        throw new Error(`El número de contrato ${numero_contrato} ya existe`);
      }
    }

    throw new Error(`Error en base de datos: ${dbError.message}`);
  }
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
           u.nombre AS cliente_nombre, u.nit AS cliente_nit,
           c.moneda_id, m.nombre AS nombre_moneda, m.simbolo AS simbolo_moneda
    FROM contratos c
    LEFT JOIN usuarios u ON u.id = c.cliente_id
    LEFT JOIN monedas m ON m.id = c.moneda_id
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
 *   - {number} moneda_id - ID de la moneda (1=GTQ, 2=USD, 6=HNL, 7=SVC)
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
             c.plazo_pago, c.fecha_creacion, c.moneda_id
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
        c.estado, c.limite_credito, c.saldo_usado, c.plazo_pago,
        c.moneda_id, m.nombre AS nombre_moneda, m.simbolo AS simbolo_moneda
      FROM contratos c
      LEFT JOIN monedas m ON m.id = c.moneda_id
      WHERE c.cliente_id = @cliente_id
        AND c.estado      = 'VIGENTE'
        AND c.fecha_fin  >= CAST(GETDATE() AS DATE)
      ORDER BY c.fecha_fin DESC
    `);
  return result.recordset[0];
};

/**
 * Busca TODOS los contratos vigentes de un cliente (para validación integral)
 * @async
 * @function buscarTodosPorCliente
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Array>} Array de objetos contrato vigentes con:
 *   - {number} id - ID del contrato
 *   - {string} numero_contrato - Número del contrato
 *   - {Date} fecha_inicio - Fecha de inicio
 *   - {Date} fecha_fin - Fecha de vencimiento
 *   - {string} estado - Estado (VIGENTE)
 *   - {number} limite_credito - Límite de crédito
 *   - {number} saldo_usado - Saldo utilizado
 *   - {number} plazo_pago - Plazo en días
 * @example
 * const contratosVigentes = await buscarTodosPorCliente(5);
 */
const buscarTodosPorCliente = async (cliente_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('cliente_id', sql.Int, cliente_id)
    .query(`
      SELECT
        c.id, c.numero_contrato, c.fecha_inicio, c.fecha_fin,
        c.estado, c.limite_credito, c.saldo_usado, c.plazo_pago,
        c.moneda_id, m.nombre AS nombre_moneda, m.simbolo AS simbolo_moneda
      FROM contratos c
      LEFT JOIN monedas m ON m.id = c.moneda_id
      WHERE c.cliente_id = @cliente_id
        AND c.estado      = 'VIGENTE'
        AND c.fecha_fin  >= CAST(GETDATE() AS DATE)
      ORDER BY c.fecha_fin DESC
    `);
  return result.recordset || [];
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
    plazo_pago, estado, modificado_por, moneda_id
  } = datos;

  // Validación crítica
  if (!modificado_por) {
    throw new Error('modificado_por es requerido - Usuario no autenticado');
  }

  try {
    const pool = await getConnection();
    const request = pool.request()
      .input('id', sql.Int, id);
    
    // Construir dinámicamente el UPDATE basado en qué campos se proporcionan
    const updates = [];

    if (fecha_inicio !== undefined) {
      updates.push('fecha_inicio = @fecha_inicio');
      request.input('fecha_inicio', sql.Date, fecha_inicio);
    }
    if (fecha_fin !== undefined) {
      updates.push('fecha_fin = @fecha_fin');
      request.input('fecha_fin', sql.Date, fecha_fin);
    }
    if (limite_credito !== undefined) {
      updates.push('limite_credito = @limite_credito');
      request.input('limite_credito', sql.Decimal(15,2), limite_credito);
    }
    if (plazo_pago !== undefined) {
      updates.push('plazo_pago = @plazo_pago');
      request.input('plazo_pago', sql.Int, plazo_pago);
    }
    if (estado !== undefined) {
      updates.push('estado = @estado');
      request.input('estado', sql.NVarChar, estado);
    }
    if (moneda_id !== undefined) {
      updates.push('moneda_id = @moneda_id');
      request.input('moneda_id', sql.Int, moneda_id);
    }

    updates.push('modificado_por = @modificado_por');
    updates.push('fecha_modificacion = GETDATE()');
    request.input('modificado_por', sql.Int, modificado_por);

    // UPDATE sin OUTPUT (por los triggers)
    const updateQuery = `
      UPDATE contratos
      SET ${updates.join(', ')}
      WHERE id = @id
    `;

    await request.query(updateQuery);

    // SELECT para obtener el registro DESPUÉS de que el trigger ejecutó
    const selectRequest = pool.request()
      .input('id', sql.Int, id);
    
    const selectResult = await selectRequest.query(`
      SELECT * FROM contratos WHERE id = @id
    `);

    if (!selectResult.recordset || selectResult.recordset.length === 0) {
      throw new Error('No se pudo recuperar el contrato después de actualizar');
    }

    return selectResult.recordset[0];
  } catch (dbError) {
    console.error('[Contrato.actualizarContrato] Error en BD:', {
      codigo: dbError.code,
      mensaje: dbError.message,
      numero: dbError.number
    });

    // Errores específicos de MSSQL
    if (dbError.code === 'EREQUEST') {
      if (dbError.message.includes('FK_contratos_moneda')) {
        throw new Error(`Moneda no encontrada en BD: ${moneda_id}`);
      }
      if (dbError.message.includes('FK_contratos_modificado_por')) {
        throw new Error(`Usuario modificador no encontrado: ${modificado_por}`);
      }
    }

    throw new Error(`Error en base de datos: ${dbError.message}`);
  }
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

// metodo extra solo para que funcione en finanzas es similar al de arriba
const actualizarSaldo_finanzas = async (id, saldo_usado) => {
  const pool = await getConnection();

  // 1. UPDATE SIN OUTPUT
  await pool.request()
    .input('id',          sql.Int,          id)
    .input('saldo_usado', sql.Decimal(15,2), saldo_usado)
    .query(`
      UPDATE contratos
      SET saldo_usado = @saldo_usado
      WHERE id = @id
    `);

  // 2. SELECT posterior
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id, saldo_usado, limite_credito
      FROM contratos
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

/**
 * Obtiene el contrato más reciente (para generar el siguiente número)
 * @async
 * @function obtenerUltimoContrato
 * @returns {Promise<Object|undefined>} Último contrato creado con numero_contrato
 * @example
 * const ultimoContrato = await obtenerUltimoContrato();
 */
const obtenerUltimoContrato = async () => {
  const pool = await getConnection();
  const result = await pool.request()
    .query(`
      SELECT TOP 1 id, numero_contrato, fecha_creacion
      FROM contratos
      ORDER BY id DESC
    `);
  return result.recordset[0];
};

module.exports = {
  crearContrato,
  buscarPorId,
  listarPorCliente,
  buscarVigentePorCliente,
  buscarTodosPorCliente,
  actualizarContrato,
  actualizarSaldo,
  cambiarEstado,
  listarTodos,
  obtenerUltimoContrato,
  actualizarSaldo_finanzas
};