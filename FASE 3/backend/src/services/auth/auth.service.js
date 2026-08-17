// backend/src/services/auth/auth.service.js
"use strict";

const bcrypt = require("bcryptjs");
const { signJwt } = require("../../utils/jwt");
const userStore = require("../../models/auth/user.store");
const { notificarInformativo } = require("../../utils/mailer");

// Roles permitidos actualizados para incluir patio
const ALLOWED_ROLES = ["cliente", "piloto", "finanzas", "gerencia", "operativo", "agente_logistico", "patio"];

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function sanitizeRole(role) {
  return String(role || "cliente").trim().toLowerCase();
}

function getDisplayName(user) {
  const fullName = `${user.nombres || ""} ${user.apellidos || ""}`.trim();
  if (fullName) return fullName;
  return user.email;
}

async function register(payload) {
  const {
    nit,
    email,
    password,
    confirmPassword,
    role = "cliente",
    nombres = "",
    apellidos = "",
    telefono = "",
  } = payload;

  if (!nit || !email || !password || !confirmPassword) {
    throw createHttpError("NIT, email, password y confirmPassword son obligatorios", 400);
  }

  if (String(nit).trim().length > 13) {
    throw createHttpError("El NIT no puede tener más de 13 caracteres", 400);
  }

  if (!validateEmail(email)) {
    throw createHttpError("Formato de email invalido", 400);
  }

  if (password.length < 8) {
    throw createHttpError("La password debe tener al menos 8 caracteres", 400);
  }

  if (password !== confirmPassword) {
    throw createHttpError("La confirmacion de password no coincide", 400);
  }

  const finalRole = sanitizeRole(role);
  if (!ALLOWED_ROLES.includes(finalRole)) {
    throw createHttpError("Rol no permitido", 400);
  }

  const existingUser = await userStore.findByEmail(email.toLowerCase());
  if (existingUser) {
    throw createHttpError("El email ya se encuentra registrado", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userStore.createUser({
    nit: String(nit).trim(),
    email: email.toLowerCase(),
    passwordHash,
    role: finalRole,
    nombres: String(nombres || "").trim(),
    apellidos: String(apellidos || "").trim(),
    telefono: String(telefono || "").trim(),
    pais: String(payload.pais || "").trim(),
  });

  try {
    await notificarInformativo(
      user.email,
      getDisplayName(user),
      "Tu cuenta ha sido creada correctamente en la plataforma de LogiTrans.",
      {
        titulo: "Registro Exitoso",
        detalle: "Ya puedes iniciar sesión con tu correo y contraseña.",
        datos: [
          { etiqueta: "Correo", valor: user.email },
          { etiqueta: "Rol", valor: user.role },
          { etiqueta: "Id de Usuario", valor: String(user.id) },
        ],
      }
    );
  } catch (error) {
    console.error("[auth] Registro completado, pero falló la notificación por correo:", error.message);
  }

  return {
    mensaje: "Usuario registrado correctamente",
    data: {
      id: user.id,
      nit: user.nit,
      email: user.email,
      role: user.role,
      nombres: user.nombres,
      apellidos: user.apellidos,
      telefono: user.telefono,
    },
  };
}

async function login(payload) {
  const { email, password } = payload;

  console.log('[LOGIN] === INICIO DE PROCESO DE LOGIN ===');
  console.log('[LOGIN] Email recibido:', email);

  if (!email || !password) {
    console.log('[LOGIN] Error: Email o password faltante');
    throw createHttpError("Email y password son obligatorios", 400);
  }

  if (!validateEmail(email)) {
    console.log('[LOGIN] Error: Formato de email inválido:', email);
    throw createHttpError("Formato de email invalido", 400);
  }

  console.log('[LOGIN] Buscando usuario en base de datos con email:', email.toLowerCase());
  const user = await userStore.findByEmail(email.toLowerCase());
  
  if (!user) {
    console.log('[LOGIN] Error: Usuario no encontrado con email:', email.toLowerCase());
    throw createHttpError("Credenciales invalidas", 401);
  }

  console.log('[LOGIN] Usuario encontrado en BD:');
  console.log('[LOGIN] - ID:', user.id);
  console.log('[LOGIN] - Email:', user.email);
  console.log('[LOGIN] - Rol (original):', user.role);
  console.log('[LOGIN] - Estado:', user.estado);
  console.log('[LOGIN] - Nombres:', user.nombres);
  console.log('[LOGIN] - Apellidos:', user.apellidos);

  const userEstado = String(user.estado || "").toUpperCase();
  console.log('[LOGIN] Estado del usuario normalizado:', userEstado);
  
  if (userEstado !== "ACTIVO") {
    console.log('[LOGIN] Error: Usuario no está activo. Estado actual:', user.estado);
    throw createHttpError("El usuario no está activo", 403);
  }

  console.log('[LOGIN] Verificando contraseña con bcrypt.compare()...');
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  
  console.log('[LOGIN] Resultado de verificación de contraseña:', isValidPassword);
  
  if (!isValidPassword) {
    console.log('[LOGIN] Error: Contraseña incorrecta para el usuario:', email);
    throw createHttpError("Credenciales invalidas", 401);
  }

  const normalizedRole = user.role.toLowerCase();
  console.log('[LOGIN] Rol normalizado (para JWT):', normalizedRole);

  console.log('[LOGIN] Generando token JWT...');
  const token = signJwt({
    sub: String(user.id),
    email: user.email,
    role: normalizedRole,
    nombres: user.nombres,
    apellidos: user.apellidos,
  });

  console.log('[LOGIN] Token JWT generado correctamente');
  console.log('[LOGIN] === LOGIN EXITOSO para usuario:', email, 'con rol:', normalizedRole, '===');

  return {
    mensaje: "Login exitoso",
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: normalizedRole,
        nombres: user.nombres,
        apellidos: user.apellidos,
      },
    },
  };
}

module.exports = {
  register,
  login,
};