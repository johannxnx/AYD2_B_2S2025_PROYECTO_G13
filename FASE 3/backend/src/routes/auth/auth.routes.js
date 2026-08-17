/**
 * @file auth.routes.js
 * @description Rutas de autenticación y autorización.
 * Gestiona registro de usuarios, login y validación de sesiones.
 */

"use strict";

const express = require("express");
const authController = require("../../controllers/auth/auth.controller");
const { requireAuth } = require("../../middlewares/auth/auth.middleware");
const {
	validateRegister,
	validateLogin,
} = require("../../middlewares/auth/auth.validation.middleware");

const router = express.Router();

/**
 * POST /api/auth/register
 * @description Registra un nuevo usuario en el sistema
 * @auth No requerida (público)
 * @middleware validateRegister - Valida campos requeridos
 * @body {
 *   nit: string - Cedula o NIT del usuario
 *   nombre: string - Nombre completo
 *   email: string - Correo electrónico único
 *   telefono: string - Teléfono de contacto
 *   tipo_usuario: string - CLIENTE, ADMIN, OPERADOR, etc
 *   contraseña: string - Contraseña (hasheada)
 * }
 * @response {status: 201, data: { usuario: object, token: jwt }}
 */
router.post("/register", validateRegister, authController.register);

/**
 * POST /api/auth/login
 * @description Autentica un usuario y retorna JWT
 * @auth No requerida (público)
 * @middleware validateLogin - Valida credenciales
 * @body {
 *   email: string - Correo electrónico
 *   contraseña: string - Contraseña
 * }
 * @response {status: 200, data: { usuario: object, token: jwt }}
 */
router.post("/login", validateLogin, authController.login);

/**
 * GET /api/auth/me
 * @description Obtiene los datos del usuario autenticado
 * @auth Requerida (token JWT)
 * @middleware requireAuth - Valida token JWT
 * @response {status: 200, data: usuario}
 */
router.get("/me", requireAuth, authController.me);

module.exports = router;

