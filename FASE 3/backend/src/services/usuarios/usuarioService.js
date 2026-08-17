/**
 * @file Servicio de Usuarios
 * @description Lógica de negocio para gestión de usuarios y evaluación de riesgo de clientes
 * Incluye CRUD de usuarios, cambios de estado, y asignación de perfiles de riesgo
 * Genera registros de auditoría para todas las operaciones
 * @module services/usuarios/usuarioService
 * @version 1.0.0
 * @requires models/usuarios/Usuario - modelo de usuario
 * @requires models/usuarios/RiesgoCliente - evaluación de riesgo
 * @requires models/auditoria/Auditoria - registro de cambios
 */

const Usuario      = require('../../models/usuarios/Usuario');
const RiesgoCliente = require('../../models/usuarios/RiesgoCliente');
const Auditoria    = require('../../models/auditoria/Auditoria');
const { notificarCuentaInactiva, notificarCuentaActivada, notificarClienteAceptado } = require('../../utils/notificaciones');

/**
 * @async
 * @function obtenerUsuario
 * @description Obtiene los datos completos de un usuario
 * Si es cliente corporativo, incluye su perfil de riesgo
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} Datos del usuario con riesgo embebido si aplica
 * @throws {Error} Si usuario no existe (404)
 */
const obtenerUsuario = async (id) => {
  const usuario = await Usuario.buscarPorId(id);
  if (!usuario) throw { status: 404, mensaje: 'Usuario no encontrado' };

  if (usuario.tipo_usuario === 'CLIENTE_CORPORATIVO') {
    const riesgo = await RiesgoCliente.buscarPorCliente(id);
    usuario.riesgo = riesgo || null;
  }
  return usuario;
};

/**
 * @async
 * @function listarUsuarios
 * @description Lista usuarios con filtros opcionales
 * @param {Object} [filtros={}] - Filtros de búsqueda
 * @param {string} [filtros.tipo_usuario] - Filtrar por tipo (CLIENTE_CORPORATIVO, PILOTO, etc.)
 * @param {string} [filtros.estado] - Filtrar por estado (ACTIVO, INACTIVO, BLOQUEADO)
 * @param {string} [filtros.nombre] - Filtrar por nombre o razón social
 * @returns {Promise<Array>} Lista de usuarios que coinciden con los filtros
 */
const listarUsuarios = async (filtros = {}) => {
  return await Usuario.listarUsuarios(filtros);
};

/**
 * @async
 * @function modificarUsuario
 * @description Actualiza los datos de un usuario
 * No permite cambiar NIT si el usuario tiene contratos u órdenes asociadas
 * @param {number} id - ID del usuario a modificar
 * @param {Object} datos - Nuevos datos (nombre, email, teléfono, etc.)
 * @param {number} usuario_ejecutor - ID del usuario que modifica (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Usuario actualizado
 * @throws {Error} Si usuario no existe o intenta cambiar NIT con historial
 */
const modificarUsuario = async (id, datos, usuario_ejecutor, ip) => {
  const usuarioActual = await Usuario.buscarPorId(id);
  if (!usuarioActual) throw { status: 404, mensaje: 'Usuario no encontrado' };

  if (datos.nit && datos.nit !== usuarioActual.nit) {
    const tieneHistorial = await Usuario.tieneHistorial(id);
    if (tieneHistorial) {
      throw {
        status: 400,
        mensaje: 'No se puede modificar el NIT porque el usuario tiene contratos u órdenes asociadas'
      };
    }
  }

  const usuarioActualizado = await Usuario.actualizarUsuario(id, datos);

  if (usuarioActual.tipo_usuario === 'CLIENTE_CORPORATIVO' && datos.riesgo) {
    await RiesgoCliente.actualizarRiesgo(id, {
      ...datos.riesgo,
      evaluado_por: usuario_ejecutor
    });
  }

  await Auditoria.registrar({
    tabla_afectada:   'usuarios',
    accion:           'UPDATE',
    registro_id:      id,
    usuario_id:       usuario_ejecutor,
    descripcion:      `Modificación de usuario: ${usuarioActual.nombre}`,
    datos_anteriores: usuarioActual,
    datos_nuevos:     usuarioActualizado,
    ip_origen:        ip
  });

  return usuarioActualizado;
};

/**
 * @async
 * @function cambiarEstadoUsuario
 * @description Cambia el estado de un usuario
 * Estados válidos: PENDIENTE_ACEPTACION, ACTIVO, INACTIVO, BLOQUEADO
 * @param {number} id - ID del usuario
 * @param {string} estado - Nuevo estado (PENDIENTE_ACEPTACION|ACTIVO|INACTIVO|BLOQUEADO)
 * @param {string} motivo - Motivo del cambio de estado
 * @param {number} usuario_ejecutor - ID del usuario que ejecuta el cambio (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Usuario con nuevo estado
 * @throws {Error} Si usuario no existe o estado es inválido
 */
const cambiarEstadoUsuario = async (id, estado, motivo, usuario_ejecutor, ip) => {
  const estadosValidos = ['PENDIENTE_ACEPTACION', 'ACTIVO', 'INACTIVO', 'BLOQUEADO'];
  if (!estadosValidos.includes(estado)) {
    throw { status: 400, mensaje: `Estado inválido. Los estados válidos son: ${estadosValidos.join(', ')}` };
  }

  const usuarioActual = await Usuario.buscarPorId(id);
  if (!usuarioActual) throw { status: 404, mensaje: 'Usuario no encontrado' };

  const usuarioActualizado = await Usuario.cambiarEstado(id, estado);

  await Auditoria.registrar({
    tabla_afectada:   'usuarios',
    accion:           'UPDATE',
    registro_id:      id,
    usuario_id:       usuario_ejecutor,
    descripcion:      `Cambio de estado de usuario ${usuarioActual.nombre}: ${usuarioActual.estado} → ${estado}. Motivo: ${motivo}`,
    datos_anteriores: { estado: usuarioActual.estado },
    datos_nuevos:     { estado },
    ip_origen:        ip
  });

  // Enviar correos de notificación
  try {
    // Si se desactiva la cuenta (cambio a INACTIVO)
    if (estado === 'INACTIVO' && usuarioActual.estado !== 'INACTIVO') {
      await notificarCuentaInactiva(
        { email: usuarioActual.email, nombre: usuarioActual.nombre }
      );
    }
    // Si se acepta un cliente nuevo (cambio de PENDIENTE_ACEPTACION a ACTIVO)
    else if (estado === 'ACTIVO' && usuarioActual.estado === 'PENDIENTE_ACEPTACION') {
      await notificarClienteAceptado(
        { email: usuarioActual.email, nombre: usuarioActual.nombre }
      );
    }
    // Si se reactiva la cuenta (cambio a ACTIVO desde INACTIVO)
    else if (estado === 'ACTIVO' && usuarioActual.estado === 'INACTIVO') {
      await notificarCuentaActivada(
        { email: usuarioActual.email, nombre: usuarioActual.nombre }
      );
    }
  } catch (errorCorreo) {
    // No bloquear la operación si hay error en el correo
    console.error(`[cambiarEstadoUsuario] Error al enviar notificación: ${errorCorreo.message}`);
  }

  return usuarioActualizado;
};

/**
 * @async
 * @function crearRiesgoCliente
 * @description Crea una evaluación de riesgo para un cliente corporativo
 * Si el cliente está en estado PENDIENTE_ACEPTACION, lo activa automáticamente
 * Evalúa 4 niveles de riesgo: capacidad de pago, lavado de dinero, aduanas, mercancía
 * @param {number} usuario_id - ID del cliente corporativo
 * @param {Object} datos - Niveles de riesgo a evaluar
 * @param {string} datos.riesgo_capacidad_pago - BAJO|MEDIO|ALTO
 * @param {string} datos.riesgo_lavado_dinero - BAJO|MEDIO|ALTO
 * @param {string} datos.riesgo_aduanas - BAJO|MEDIO|ALTO
 * @param {string} datos.riesgo_mercancia - BAJO|MEDIO|ALTO
 * @param {number} usuario_ejecutor - ID del usuario que evalúa (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Evaluación de riesgo creada
 * @throws {Error} Si usuario no existe, no es corporativo, o niveles de riesgo inválidos
 */
const crearRiesgoCliente = async (usuario_id, datos, usuario_ejecutor, ip) => {
  const usuario = await Usuario.buscarPorId(usuario_id);
  if (!usuario) throw { status: 404, mensaje: 'Usuario no encontrado' };
  if (usuario.tipo_usuario !== 'CLIENTE_CORPORATIVO') {
    throw { status: 400, mensaje: 'Solo se puede asignar riesgo a clientes corporativos' };
  }

  const nivelesValidos = ['BAJO', 'MEDIO', 'ALTO'];
  const campos = ['riesgo_capacidad_pago', 'riesgo_lavado_dinero', 'riesgo_aduanas', 'riesgo_mercancia'];
  for (const campo of campos) {
    if (!nivelesValidos.includes(datos[campo])) {
      throw { status: 400, mensaje: `Valor inválido en ${campo}. Debe ser: BAJO, MEDIO o ALTO` };
    }
  }

  const riesgo = await RiesgoCliente.crearRiesgo({
    ...datos,
    usuario_id,
    evaluado_por: usuario_ejecutor
  });

  await Auditoria.registrar({
    tabla_afectada: 'riesgo_cliente',
    accion:         'CREATE',
    registro_id:    riesgo.id,
    usuario_id:     usuario_ejecutor,
    descripcion:    `Evaluación de riesgo creada para cliente: ${usuario.nombre}`,
    datos_nuevos:   riesgo,
    ip_origen:      ip
  });

  // Si el cliente estaba pendiente de aceptación, activarlo automáticamente
  if (usuario.estado === 'PENDIENTE_ACEPTACION') {
    const usuarioActualizado = await Usuario.cambiarEstado(usuario_id, 'ACTIVO');
    
    await Auditoria.registrar({
      tabla_afectada:   'usuarios',
      accion:           'UPDATE',
      registro_id:      usuario_id,
      usuario_id:       usuario_ejecutor,
      descripcion:      `Cliente corporativo ${usuario.nombre} aceptado y activado después de evaluación de riesgo`,
      datos_anteriores: { estado: usuario.estado },
      datos_nuevos:     { estado: 'ACTIVO' },
      ip_origen:        ip
    });

    // Enviar notificación de aceptación (para clientes nuevos que pasan de PENDIENTE a ACTIVO)
    try {
      await notificarClienteAceptado(
        { email: usuario.email, nombre: usuario.nombre }
      );
    } catch (errorCorreo) {
      console.error(`[crearRiesgoCliente] Error al enviar notificación: ${errorCorreo.message}`);
    }
  }

  return riesgo;
};

/**
 * @async
 * @function obtenerRiesgoCliente
 * @description Obtiene la evaluación de riesgo de un cliente corporativo
 * @param {number} usuario_id - ID del cliente corporativo
 * @returns {Promise<Object>} Perfil de riesgo del cliente
 * @throws {Error} Si usuario no existe, no es corporativo, o no tiene evaluación de riesgo
 */
const obtenerRiesgoCliente = async (usuario_id) => {
  const usuario = await Usuario.buscarPorId(usuario_id);
  if (!usuario) throw { status: 404, mensaje: 'Usuario no encontrado' };
  if (usuario.tipo_usuario !== 'CLIENTE_CORPORATIVO') {
    throw { status: 400, mensaje: 'Solo los clientes corporativos tienen perfil de riesgo' };
  }

  const riesgo = await RiesgoCliente.buscarPorCliente(usuario_id);
  if (!riesgo) throw { status: 404, mensaje: 'No se encontró evaluación de riesgo para este cliente' };

  return riesgo;
};

/**
 * @async
 * @function crearCliente
 * @description Crea un nuevo usuario/cliente en el sistema
 * Usado por administrador para crear clientes corporativos con estado PENDIENTE_ACEPTACION
 * @param {Object} datos - Datos del usuario
 * @param {string} datos.nit - NIT único
 * @param {string} datos.nombre - Nombre completo
 * @param {string} datos.email - Email único
 * @param {string} datos.telefono - Teléfono (opcional)
 * @param {string} datos.tipo_usuario - Tipo (CLIENTE_CORPORATIVO, PILOTO, etc)
 * @param {string} datos.estado - Estado: PENDIENTE_ACEPTACION, ACTIVO, etc
 * @param {string} datos.password_hash - Contraseña hasheada
 * @param {number} usuario_ejecutor - ID del admin que crea (para auditoría)
 * @param {string} ip - Dirección IP (para auditoría)
 * @returns {Promise<Object>} Usuario creado
 * @throws {Error} Si email o nit ya existen
 */
const crearCliente = async (datos, usuario_ejecutor, ip) => {
  // Validaciones básicas
  if (!datos.nombre || !datos.email || !datos.nit || !datos.tipo_usuario) {
    throw { status: 400, mensaje: 'Campos requeridos: nombre, email, nit, tipo_usuario' };
  }

  // Verificar que el email no exista
  const usuarioPorEmail = await Usuario.buscarPorEmail(datos.email);
  if (usuarioPorEmail) {
    throw { status: 400, mensaje: 'El email ya está registrado' };
  }

  // Verificar que el nit no exista
  const usuarioPorNit = await Usuario.buscarPorNit(datos.nit);
  if (usuarioPorNit) {
    throw { status: 400, mensaje: 'El NIT ya está registrado' };
  }

  //  Crear el usuario
  const usuarioCreado = await Usuario.crearCliente({
    ...datos,
    creado_por: usuario_ejecutor
  });

  // Registrar en auditoría solo si hay usuario ejecutor (sin bloquear si falla)
  if (usuario_ejecutor) {
    try {
      await Auditoria.registrar({
        tabla_afectada: 'usuarios',
        accion: 'CREATE',
        registro_id: usuarioCreado.id,
        usuario_id: usuario_ejecutor,
        descripcion: `Nuevo usuario creado: ${usuarioCreado.nombre} (${usuarioCreado.tipo_usuario}) - Estado: ${usuarioCreado.estado}`,
        datos_nuevos: usuarioCreado,
        ip_origen: ip
      });
    } catch (auditError) {
      console.error('[crearCliente] Error registrando auditoría:', auditError);
      // No bloquear la operación si la auditoría falla
    }
  } else {
    console.warn('[crearCliente] Usuario no autenticado, auditoría no registrada');
  }

  return usuarioCreado;
};

module.exports = {
  obtenerUsuario,
  listarUsuarios,
  modificarUsuario,
  cambiarEstadoUsuario,
  crearRiesgoCliente,
  obtenerRiesgoCliente,
  crearCliente
};