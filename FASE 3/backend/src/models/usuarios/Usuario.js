/**
 * @file Usuario.js
 * @description Modelo para la gestión de usuarios del sistema.
 * Maneja operaciones CRUD de usuarios (clientes y staff) con búsqueda
 * y filtrado por diferentes criterios.
 */

const sql = require('mssql');
const { getConnection } = require('../../config/db');

/**
 * Busca un usuario por ID con información de quién lo creó
 * @async
 * @function buscarPorId
 * @param {number} id - ID del usuario a buscar
 * @returns {Promise<Object|undefined>} Objeto usuario con propiedades:
 *   - {number} id - ID del usuario
 *   - {string} nit - NIT o identificación del usuario
 *   - {string} nombre - Nombre completo
 *   - {string} email - Correo electrónico
 *   - {string} telefono - Teléfono de contacto
 *   - {string} tipo_usuario - Tipo: 'CLIENTE', 'ADMIN', 'OPERADOR', etc
 *   - {string} estado - Estado: 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'
 *   - {Date} fecha_registro - Fecha de creación de la cuenta
 *   - {string} creado_por_nombre - Nombre del usuario administrador que lo creó
 *   Retorna undefined si el usuario no existe
 * @example
 * const usuario = await buscarPorId(5);
 * console.log(usuario.nombre); // Nombre del usuario
 */
const buscarPorId = async (id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT 
        u.id, u.nit, u.nombre, u.email, u.telefono, u.pais,
        u.tipo_usuario, u.estado, u.fecha_registro,
        c.nombre AS creado_por_nombre
      FROM usuarios u
      LEFT JOIN usuarios c ON c.id = u.creado_por
      WHERE u.id = @id
    `);
  return result.recordset[0];
};

/**
 * Lista usuarios con filtros opcionales por tipo, estado o nombre
 * @async
 * @function listarUsuarios
 * @param {Object} [filtros={}] - Opcional. Filtros de búsqueda
 * @param {string} [filtros.tipo_usuario] - Filtrar por tipo (ej: 'CLIENTE', 'ADMIN')
 * @param {string} [filtros.estado] - Filtrar por estado (ej: 'ACTIVO', 'INACTIVO')
 * @param {string} [filtros.nombre] - Búsqueda parcial por nombre (case-insensitive)
 * @returns {Promise<Array>} Array de usuarios ordenados por fecha de registro descendente:
 *   - {number} id - ID del usuario
 *   - {string} nit - NIT/ID del usuario
 *   - {string} nombre - Nombre completo
 *   - {string} email - Correo electrónico
 *   - {string} telefono - Teléfono
 *   - {string} tipo_usuario - Tipo de usuario
 *   - {string} estado - Estado actual
 *   - {Date} fecha_registro - Fecha de registro
 * @example
 * const clientes = await listarUsuarios({
 *   tipo_usuario: 'CLIENTE',
 *   estado: 'ACTIVO'
 * });
 */
const listarUsuarios = async (filtros = {}) => {
  const { tipo_usuario, estado, nombre } = filtros;
  const pool = await getConnection();
  const request = pool.request();

  let query = `
    SELECT id, nit, nombre, email, telefono, pais,
           tipo_usuario, estado, fecha_registro
    FROM usuarios
    WHERE 1=1
  `;

  if (tipo_usuario) {
    query += ` AND tipo_usuario = @tipo_usuario`;
    request.input('tipo_usuario', sql.NVarChar, tipo_usuario);
  }
  if (estado) {
    query += ` AND estado = @estado`;
    request.input('estado', sql.NVarChar, estado);
  }
  if (nombre) {
    query += ` AND nombre LIKE @nombre`;
    request.input('nombre', sql.NVarChar, `%${nombre}%`);
  }

  query += ` ORDER BY fecha_registro DESC`;
  const result = await request.query(query);
  return result.recordset;
};

/**
 * Actualiza los datos de contacto de un usuario
 * @async
 * @function actualizarUsuario
 * @param {number} id - ID del usuario a actualizar
 * @param {Object} datos - Datos a actualizar
 * @param {string} datos.nombre - Nuevo nombre completo
 * @param {string} datos.email - Nuevo correo electrónico
 * @param {string} datos.telefono - Nuevo teléfono de contacto
 * @returns {Promise<Object>} Usuario actualizado con todos sus campos
 * @example
 * const actualizado = await actualizarUsuario(5, {
 *   nombre: 'Nuevo Nombre',
 *   email: 'nuevo@email.com',
 *   telefono: '+502 7777 7777'
 * });
 */
const actualizarUsuario = async (id, datos) => {
  const { nombre, email, telefono, pais } = datos;
  const pool = await getConnection();
  const result = await pool.request()
    .input('id',       sql.Int,      id)
    .input('nombre',   sql.NVarChar, nombre)
    .input('email',    sql.NVarChar, email)
    .input('telefono', sql.NVarChar, telefono)
    .input('pais',     sql.NVarChar, pais)
    .query(`
      UPDATE usuarios
      SET nombre = @nombre, email = @email, telefono = @telefono, pais = @pais
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

/**
 * Cambia el estado de activación de un usuario
 * @async
 * @function cambiarEstado
 * @param {number} id - ID del usuario
 * @param {string} estado - Nuevo estado: 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'
 * @returns {Promise<Object>} Objeto con:
 *   - {number} id - ID del usuario
 *   - {string} nombre - Nombre del usuario
 *   - {string} estado - Estado actualizado
 * @example
 * const cambio = await cambiarEstado(5, 'SUSPENDIDO');
 */
const cambiarEstado = async (id, estado) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id',     sql.Int,      id)
    .input('estado', sql.NVarChar, estado)
    .query(`
      UPDATE usuarios
      SET estado = @estado
      OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.estado
      WHERE id = @id
    `);
  return result.recordset[0];
};

/**
 * Verifica si un usuario tiene historial de contratos
 * @async
 * @function tieneHistorial
 * @param {number} id - ID del usuario a verificar
 * @returns {Promise<boolean>} true si tiene al menos un contrato, false si no
 * @example
 * const hay = await tieneHistorial(5);
 * if (hay) {
 *   console.log('El usuario tiene contratos registrados');
 * }
 */
const tieneHistorial = async (id) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT COUNT(*) AS total
      FROM contratos
      WHERE cliente_id = @id
    `);
  return result.recordset[0].total > 0;
};

/**
 * Busca un usuario por su número de NIT
 * @async
 * @function buscarPorNit
 * @param {string} nit - NIT o número de identificación
 * @returns {Promise<Object|undefined>} Usuario encontrado con:
 *   - {number} id - ID del usuario
 *   - {string} nit - NIT registrado
 *   - {string} nombre - Nombre del usuario
 *   - {string} tipo_usuario - Tipo de usuario
 *   - {string} estado - Estado actual
 *   Retorna undefined si no se encuentra usuario con ese NIT
 * @example
 * const usuario = await buscarPorNit('1234567890101');
 * if (usuario) {
 *   console.log(usuario.nombre);
 * }
 */
const buscarPorNit = async (nit) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('nit', sql.NVarChar, nit)
    .query(`
      SELECT id, nit, nombre, tipo_usuario, estado
      FROM usuarios
      WHERE nit = @nit
    `);
  return result.recordset[0];
};

/**
 * Busca un usuario por su email
 * @async
 * @function buscarPorEmail
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|undefined>} Usuario encontrado con:
 *   - {number} id - ID del usuario
 *   - {string} email - Email registrado
 *   - {string} nombre - Nombre del usuario
 *   - {string} tipo_usuario - Tipo de usuario
 *   - {string} estado - Estado actual
 *   Retorna undefined si no se encuentra usuario con ese email
 * @example
 * const usuario = await buscarPorEmail('user@example.com');
 * if (usuario) {
 *   console.log(usuario.nombre);
 * }
 */
const buscarPorEmail = async (email) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('email', sql.NVarChar, email)
    .query(`
      SELECT id, email, nombre, tipo_usuario, estado
      FROM usuarios
      WHERE email = @email
    `);
  return result.recordset[0];
};

/**
 * Crea un nuevo usuario/cliente con estado especificado
 * @async
 * @function crearCliente
 * @param {Object} datos - Datos del usuario a crear
 * @param {string} datos.nit - NIT único del usuario
 * @param {string} datos.nombre - Nombre completo
 * @param {string} datos.email - Email único
 * @param {string} datos.telefono - Teléfono (opcional)
 * @param {string} datos.pais - País (opcional)
 * @param {string} datos.tipo_usuario - Tipo (CLIENTE_CORPORATIVO, PILOTO, etc)
 * @param {string} datos.estado - Estado inicial (ACTIVO, PENDIENTE_ACEPTACION, etc)
 * @param {string} datos.password_hash - Contraseña hasheada
 * @param {number} [datos.creado_por] - ID del usuario que crea (opcional)
 * @returns {Promise<Object>} Usuario creado
 */
const crearCliente = async (datos) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input('nit',           sql.NVarChar, datos.nit)
    .input('nombre',        sql.NVarChar, datos.nombre)
    .input('email',         sql.NVarChar, datos.email)
    .input('telefono',      sql.NVarChar, datos.telefono || null)
    .input('pais',          sql.NVarChar, datos.pais || null)
    .input('tipo_usuario',  sql.NVarChar, datos.tipo_usuario)
    .input('estado',        sql.NVarChar, datos.estado)
    .input('password_hash', sql.NVarChar, datos.password_hash)
    .input('creado_por',    sql.Int,      datos.creado_por || null)
    .query(`
      INSERT INTO usuarios (nit, nombre, email, telefono, pais, password_hash, tipo_usuario, estado, creado_por)
      OUTPUT INSERTED.id, INSERTED.nit, INSERTED.nombre, INSERTED.email, INSERTED.telefono, INSERTED.pais,
             INSERTED.tipo_usuario, INSERTED.estado, INSERTED.fecha_registro
      VALUES (@nit, @nombre, @email, @telefono, @pais, @password_hash, @tipo_usuario, @estado, @creado_por)
    `);
  return result.recordset[0];
};

module.exports = {
  buscarPorId,
  listarUsuarios,
  actualizarUsuario,
  cambiarEstado,
  tieneHistorial,
  buscarPorNit,
  buscarPorEmail,
  crearCliente
};