/**
 * @file Auditoria.js
 * @description Modelo para registrar y auditar cambios en el sistema.
 * Mantiene un historial completo de todas las operaciones CRUD realizadas
 * con información del usuario, IP, cambios de datos y timestamps.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Registra un evento de auditoría en el sistema
 * @async
 * @function registrar
 * @param {Object} datos - Datos del evento a auditar
 * @param {string} datos.tabla_afectada - Nombre de la tabla que sufrió cambios (ej: 'usuarios', 'contratos')
 * @param {string} datos.accion - Tipo de acción: 'INSERT', 'UPDATE', 'DELETE', 'SELECT'
 * @param {number} datos.registro_id - ID del registro afectado en la tabla
 * @param {number} datos.usuario_id - ID del usuario que realizó la acción
 * @param {string} [datos.descripcion] - Descripción opcional del cambio
 * @param {Object} [datos.datos_anteriores] - Objeto con valores antes del cambio (se convierte a JSON)
 * @param {Object} [datos.datos_nuevos] - Objeto con valores después del cambio (se convierte a JSON)
 * @param {string} [datos.ip_origen] - Dirección IP desde donde se realizó la acción
 * @returns {Promise<Object>} Registro de auditoría creado con timestamp
 * @example
 * const auditoria = await registrar({
 *   tabla_afectada: 'usuarios',
 *   accion: 'UPDATE',
 *   registro_id: 5,
 *   usuario_id: 1,
 *   descripcion: 'Cambio de estado de usuario',
 *   datos_anteriores: { estado: 'ACTIVO' },
 *   datos_nuevos: { estado: 'INACTIVO' },
 *   ip_origen: '192.168.1.100'
 * });
 */
const registrar = async (datos) => {
  const {
    tabla_afectada, accion, registro_id, usuario_id,
    descripcion, datos_anteriores, datos_nuevos, ip_origen
  } = datos;

  const pool = await getConnection();
  const result = await pool.request()
    .input('tabla_afectada',   sql.NVarChar, tabla_afectada)
    .input('accion',           sql.NVarChar, accion)
    .input('registro_id',      sql.Int,      registro_id)
    .input('usuario_id',       sql.Int,      usuario_id)
    .input('descripcion',      sql.NVarChar, descripcion || null)
    .input('datos_anteriores', sql.NVarChar, datos_anteriores ? JSON.stringify(datos_anteriores) : null)
    .input('datos_nuevos',     sql.NVarChar, datos_nuevos ? JSON.stringify(datos_nuevos) : null)
    .input('ip_origen',        sql.NVarChar, ip_origen || null)
    .query(`
      INSERT INTO auditoria
        (tabla_afectada, accion, registro_id, usuario_id,
         descripcion, datos_anteriores, datos_nuevos, ip_origen)
      OUTPUT INSERTED.*
      VALUES
        (@tabla_afectada, @accion, @registro_id, @usuario_id,
         @descripcion, @datos_anteriores, @datos_nuevos, @ip_origen)
    `);
  return result.recordset[0];
};

/**
 * Lista registros de auditoría con filtros opcionales por tabla, acción, usuario y fechas
 * @async
 * @function listar
 * @param {Object} [filtros={}] - Filtros opcionales
 * @param {string} [filtros.tabla_afectada] - Filtrar por tabla específica
 * @param {string} [filtros.accion] - Filtrar por tipo de acción ('INSERT', 'UPDATE', 'DELETE')
 * @param {number} [filtros.usuario_id] - Filtrar por usuario que realizó la acción
 * @param {Date} [filtros.fecha_inicio] - Rango de fechas desde (inclusive)
 * @param {Date} [filtros.fecha_fin] - Rango de fechas hasta (inclusive)
 * @returns {Promise<Array>} Array de registros de auditoría ordenados por fecha descendente:
 *   - {number} id - ID del registro de auditoría
 *   - {string} tabla_afectada - Tabla que sufrió cambios
 *   - {string} accion - Tipo de acción realizada
 *   - {number} registro_id - ID del registro modificado
 *   - {number} usuario_id - ID del usuario que actuó
 *   - {string} usuario_nombre - Nombre del usuario
 *   - {string} descripcion - Descripción del cambio
 *   - {string} datos_anteriores - JSON con datos previos
 *   - {string} datos_nuevos - JSON con nuevos datos
 *   - {string} ip_origen - IP de origen de la acción
 *   - {Date} fecha_hora - Timestamp del evento
 * @example
 * const cambios = await listar({
 *   tabla_afectada: 'usuarios',
 *   accion: 'UPDATE',
 *   fecha_inicio: new Date('2026-03-01'),
 *   fecha_fin: new Date('2026-03-23')
 * });
 */
const listar = async (filtros = {}) => {
  const { tabla_afectada, accion, usuario_id, fecha_inicio, fecha_fin } = filtros;
  const pool = await getConnection();
  const request = pool.request();

  let query = `
    SELECT a.*, u.nombre AS usuario_nombre
    FROM auditoria a
    LEFT JOIN usuarios u ON u.id = a.usuario_id
    WHERE 1=1
  `;

  if (tabla_afectada) {
    query += ` AND a.tabla_afectada = @tabla_afectada`;
    request.input('tabla_afectada', sql.NVarChar, tabla_afectada);
  }
  if (accion) {
    query += ` AND a.accion = @accion`;
    request.input('accion', sql.NVarChar, accion);
  }
  if (usuario_id) {
    query += ` AND a.usuario_id = @usuario_id`;
    request.input('usuario_id', sql.Int, usuario_id);
  }
  if (fecha_inicio) {
    query += ` AND a.fecha_hora >= @fecha_inicio`;
    request.input('fecha_inicio', sql.DateTime2, new Date(fecha_inicio));
  }
  if (fecha_fin) {
    query += ` AND a.fecha_hora <= @fecha_fin`;
    request.input('fecha_fin', sql.DateTime2, new Date(fecha_fin));
  }

  query += ` ORDER BY a.fecha_hora DESC`;
  const result = await request.query(query);
  return result.recordset;
};

/**
 * Obtiene el historial completo de cambios de un registro específico
 * @async
 * @function listarPorRegistro
 * @param {string} tabla_afectada - Nombre de la tabla
 * @param {number} registro_id - ID del registro a auditar
 * @returns {Promise<Array>} Array de eventos de auditoría ordenados por fecha descendente:
 *   - {number} id - ID del registro de auditoría
 *   - {string} tabla_afectada - Tabla afectada
 *   - {string} accion - Acción realizada
 *   - {number} registro_id - ID del registro
 *   - {number} usuario_id - ID del usuario que actuó
 *   - {string} usuario_nombre - Nombre del usuario
 *   - {string} descripcion - Descripción del cambio
 *   - {string} datos_anteriores - JSON con datos previos
 *   - {string} datos_nuevos - JSON con nuevos datos
 *   - {string} ip_origen - IP de origen
 *   - {Date} fecha_hora - Timestamp del evento
 * @example
 * const historialUsuario = await listarPorRegistro('usuarios', 5);
 * // Muestra toda la historia de cambios del usuario con ID 5
 */
const listarPorRegistro = async (tabla_afectada, registro_id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('tabla_afectada', sql.NVarChar, tabla_afectada)
    .input('registro_id',    sql.Int,      registro_id)
    .query(`
      SELECT a.*, u.nombre AS usuario_nombre
      FROM auditoria a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.tabla_afectada = @tabla_afectada
        AND a.registro_id    = @registro_id
      ORDER BY a.fecha_hora DESC
    `);
  return result.recordset;
};

module.exports = { registrar, listar, listarPorRegistro };