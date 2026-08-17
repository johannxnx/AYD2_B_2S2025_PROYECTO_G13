// controllers/usuarios/usuarioController.js
const usuarioService = require('../../services/usuarios/usuarioService');
const bcrypt = require('bcrypt');

const listarUsuarios = async (req, res) => {
  try {
    const { tipo_usuario, estado, nombre } = req.query;
    const usuarios = await usuarioService.listarUsuarios({ tipo_usuario, estado, nombre });
    res.status(200).json({ ok: true, data: usuarios });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al listar usuarios' });
  }
};

const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await usuarioService.obtenerUsuario(Number(id));
    res.status(200).json({ ok: true, data: usuario });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener usuario' });
  }
};

const modificarUsuario = async (req, res) => {
  try {
    const { id }          = req.params;
    const datos           = req.body;
    const usuario_ejecutor = req.user ? Number(req.user.sub) : null;
    const ip              = req.ip;

    const usuarioActualizado = await usuarioService.modificarUsuario(Number(id), datos, usuario_ejecutor, ip);
    res.status(200).json({ ok: true, mensaje: 'Usuario actualizado correctamente', data: usuarioActualizado });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al modificar usuario' });
  }
};

const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id }             = req.params;
    const { estado, motivo } = req.body;
    const usuario_ejecutor    = req.user ? Number(req.user.sub) : null;
    const ip                 = req.ip;

    if (!estado)  return res.status(400).json({ ok: false, mensaje: 'El campo estado es obligatorio' });
    if (!motivo)  return res.status(400).json({ ok: false, mensaje: 'El campo motivo es obligatorio' });

    const resultado = await usuarioService.cambiarEstadoUsuario(Number(id), estado, motivo, usuario_ejecutor, ip);
    res.status(200).json({ ok: true, mensaje: `Estado del usuario actualizado a ${estado}`, data: resultado });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al cambiar estado' });
  }
};

const crearRiesgoCliente = async (req, res) => {
  try {
    const { id }          = req.params;
    const datos           = req.body;
    const usuario_ejecutor = req.user ? Number(req.user.sub) : null;
    const ip              = req.ip;

    const riesgo = await usuarioService.crearRiesgoCliente(Number(id), datos, usuario_ejecutor, ip);
    res.status(201).json({ ok: true, mensaje: 'Evaluación de riesgo creada correctamente', data: riesgo });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al crear riesgo' });
  }
};

const obtenerRiesgoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const riesgo = await usuarioService.obtenerRiesgoCliente(Number(id));
    res.status(200).json({ ok: true, data: riesgo });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener riesgo' });
  }
};

/**
 * @async
 * @route POST /api/usuarios
 * @description Crear nuevo usuario/cliente corporativo con estado inicial PENDIENTE_ACEPTACION
 * @requires auth - requireAuth middleware
 * @body {string} nombre - Nombre del cliente
 * @body {string} email - Email único
 * @body {string} nit - NIT único
 * @body {string} telefono - Teléfono (opcional)
 * @body {string} tipo_usuario - tipo (CLIENTE_CORPORATIVO, PILOTO, etc)
 * @body {string} estado - Estado inicial (generalmente PENDIENTE_ACEPTACION para corporativos)
 * @body {string} password - Contraseña en texto plano
 * @returns {201} Usuario creado con id, nombre, email, nit, tipo_usuario, estado
 */
const crearCliente = async (req, res) => {
  try {
    const { nombre, email, nit, telefono, pais, tipo_usuario, estado, password } = req.body;
    const usuario_ejecutor = req.user ? Number(req.user.sub) : null;
    const ip = req.ip;

    // Validar que password esté presente
    if (!password) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña es obligatoria' });
    }

    // Hash de password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Llamar servicio con datos completos
    const usuarioCreado = await usuarioService.crearCliente(
      {
        nombre,
        email,
        nit,
        telefono: telefono || null,
        pais: pais || null,
        tipo_usuario,
        estado,
        password_hash
      },
      usuario_ejecutor,
      ip
    );

    res.status(201).json({
      ok: true,
      mensaje: 'Cliente creado correctamente',
      data: {
        id: usuarioCreado.id,
        nombre: usuarioCreado.nombre,
        email: usuarioCreado.email,
        nit: usuarioCreado.nit,
        telefono: usuarioCreado.telefono,
        pais: usuarioCreado.pais,
        tipo_usuario: usuarioCreado.tipo_usuario,
        estado: usuarioCreado.estado,
        fecha_registro: usuarioCreado.fecha_registro
      }
    });
  } catch (error) {
    console.error('[crearCliente] Error:', error);
    
    let statusCode = 500;
    let mensaje = 'Error al crear cliente';
    
    if (error.status) {
      statusCode = error.status;
      mensaje = error.mensaje || mensaje;
    } else if (error instanceof Error) {
      if (error.message.includes('UNIQUE')) {
        statusCode = 400;
        mensaje = 'El email o NIT ya está registrado';
      } else if (error.message.includes('CHECK')) {
        statusCode = 400;
        mensaje = 'Los datos enviados no cumplen con las restricciones (tipo_usuario o estado inválido)';
      } else {
        mensaje = error.message;
      }
    }
    
    res.status(statusCode).json({ ok: false, mensaje });
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  modificarUsuario,
  cambiarEstadoUsuario,
  crearRiesgoCliente,
  obtenerRiesgoCliente,
  crearCliente
};