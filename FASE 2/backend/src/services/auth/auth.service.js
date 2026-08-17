/**
 * @file Servicio de Autenticación
 * @description Lógica de negocio para registro, login y validación de credenciales
 * Incluye validaciones de email, contraseña, roles y envío de notificaciones
 * @module services/auth/auth.service
 * @version 1.0.0
 * @requires bcryptjs - para hash de contraseñas
 * @requires utils/jwt - para generación de tokens JWT
 * @requires models/auth/user.store - para operaciones de usuario
 * @requires utils/mailer - para notificaciones por email
 */

"use strict";

const bcrypt = require("bcryptjs");
const { signJwt } = require("../../utils/jwt");
const userStore = require("../../models/auth/user.store");
const { notificarInformativo } = require("../../utils/mailer");

// Roles permitidos actualizados para incluir agente_logistico
const ALLOWED_ROLES = ["cliente", "piloto", "finanzas", "gerencia", "operativo", "agente_logistico"];

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

/**
 * @async
 * @function register
 * @description Registra un nuevo usuario en el sistema con validaciones completas
 * Valida email, contraseña, NIT y rol. Enva notificación de bienvenida
 * @param {Object} payload - Datos de registro del usuario
 * @param {string} payload.nit - Número de Identificación Tributaria (max 13 caracteres)
 * @param {string} payload.email - Email único del usuario (debe ser válido)
 * @param {string} payload.password - Contraseña (mínimo 8 caracteres)
 * @param {string} payload.confirmPassword - Confirmación de contraseña (debe coincidir con password)
 * @param {string} [payload.role="cliente"] - Rol del usuario (cliente, piloto, finanzas, gerencia, operativo, agente_logistico)
 * @param {string} [payload.nombres=""] - Nombres del usuario
 * @param {string} [payload.apellidos=""] - Apellidos del usuario
 * @param {string} [payload.telefono=""] - Número de contacto del usuario
 * @returns {Promise<Object>} Datos del usuario registrado con mensaje de éxito
 * @throws {Error} Si hay validación fallida (email duplicado, email inválido, password débil, rol no permitido)
 * @example
 * const resultado = await register({
 *   nit: '1234567890',
 *   email: 'usuario@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!',
 *   role: 'cliente',
 *   nombres: 'Juan',
 *   apellidos: 'Pérez'
 * });
 */
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
    // No bloquear el registro si el envío de correo falla.
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

/**
 * @async
 * @function login
 * @description Autentica a un usuario y retorna un token JWT
 * Valida credenciales, verifica estado del usuario (ACTIVO) y genera token de sesión
 * @param {Object} payload - Credenciales de login
 * @param {string} payload.email - Email del usuario registrado
 * @param {string} payload.password - Contraseña en texto plano (será comparada con hash)
 * @returns {Promise<Object>} Token JWT y datos del usuario autenticado
 * @throws {Error} Si credenciales son inválidas (401), usuario no activo (403), o email inválido (400)
 * @example
 * const resultado = await login({
 *   email: 'usuario@example.com',
 *   password: 'SecurePass123!'
 * });
 * // Returns: { mensaje, data: { token: 'JWT_TOKEN', user: {...} } }
 */
async function login(payload) {
  const { email, password } = payload;

  console.log('[LOGIN] === INICIO DE PROCESO DE LOGIN ===');
  console.log('[LOGIN] Email recibido:', email);
  console.log('[LOGIN] Password recibida:', password ? '***' : 'No recibida');

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
  console.log('[LOGIN] - Password Hash (primeros 20 chars):', user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'No hay hash');

  // Verificar estado del usuario
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

  // Normalizar el rol a minúsculas para consistencia en el frontend
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