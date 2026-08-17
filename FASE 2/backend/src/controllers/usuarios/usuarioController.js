// controllers/usuarios/usuarioController.js
const usuarioService = require('../../services/usuarios/usuarioService');

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

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  modificarUsuario,
  cambiarEstadoUsuario,
  crearRiesgoCliente,
  obtenerRiesgoCliente
};