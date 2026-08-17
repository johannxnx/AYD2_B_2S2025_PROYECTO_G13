"use strict";

const authService = require("../../services/auth/auth.service");

// Handler de POST /api/auth/register
async function register(req, res) {
  try {
    const result = await authService.register(req.body || {});
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo registrar el usuario",
    });
  }
}

// Handler de POST /api/auth/login
async function login(req, res) {
  try {
    const result = await authService.login(req.body || {});
    console.log('[auth.controller] Login - user:', result.user);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('[auth.controller] Login error:', error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "Credenciales invalidas",
    });
  }
}

// Handler de GET /api/auth/me
function me(req, res) {
  console.log('[auth.controller] me - req.user:', req.user);
  
  // El req.user viene del middleware requireAuth y tiene la estructura del payload del JWT
  // Debe tener: sub, email, role, nombres, apellidos
  const userData = {
    sub: req.user?.sub || req.user?.id,        // ID del usuario
    email: req.user?.email,
    role: req.user?.role,
    nombres: req.user?.nombres,
    apellidos: req.user?.apellidos,
    nit: req.user?.nit,
    telefono: req.user?.telefono,
  };
  
  console.log('[auth.controller] me - response data:', userData);
  
  return res.status(200).json({
    ok: true,
    mensaje: "Perfil autenticado",
    data: userData,
  });
}

// backend/src/controllers/auth/auth.controller.js
function me(req, res) {
  console.log('[auth.controller] me - req.user recibido:', req.user);
  console.log('[auth.controller] me - req.user.sub:', req.user?.sub);
  console.log('[auth.controller] me - req.user.id:', req.user?.id);
  
  // El req.user ya viene del middleware con la estructura correcta
  const userData = {
    sub: req.user?.sub,           // El ID viene en sub
    email: req.user?.email,
    role: req.user?.role,
    nombres: req.user?.nombres,
    apellidos: req.user?.apellidos,
  };
  
  console.log('[auth.controller] me - response data:', userData);
  
  return res.status(200).json({
    ok: true,
    mensaje: "Perfil autenticado",
    data: userData,
  });
}

module.exports = {
  register,
  login,
  me,
};